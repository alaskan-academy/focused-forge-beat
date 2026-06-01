import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
import { addDays, addWeeks, addMonths, format, getDay, getDate } from 'date-fns';
import { RecurrenceConfig } from '@/lib/recurrence';
import { parseLocalDate } from '@/lib/dateUtils';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks_with_time'],
    queryFn: async () => {
      // Fetch tasks and the last 30 days of completed timer sessions in parallel.
      // Sessions are grouped by (task_id, local date) so any date filter can read the
      // correct per-occurrence time. For today's display, only today's sessions count,
      // ensuring recurring tasks always start each new day at zero.
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const todayKey = new Date().toLocaleDateString('sv-SE'); // 'YYYY-MM-DD' in local tz

      const [{ data, error }, { data: sessions }] = await Promise.all([
        supabase.from('tasks_with_time').select('*').order('created_at', { ascending: false }),
        supabase
          .from('timer_sessions')
          .select('task_id, duration_minutes, started_at')
          .not('ended_at', 'is', null)
          .gte('started_at', thirtyDaysAgo.toISOString()),
      ]);
      if (error) throw error;

      // Group sessions by (task_id, local_date) — uses browser local timezone
      const sessionsByTaskAndDate: Record<string, Record<string, number>> = {};
      (sessions || []).forEach((s: any) => {
        if (s.task_id && s.duration_minutes) {
          const dateKey = new Date(s.started_at).toLocaleDateString('sv-SE');
          if (!sessionsByTaskAndDate[s.task_id]) sessionsByTaskAndDate[s.task_id] = {};
          sessionsByTaskAndDate[s.task_id][dateKey] =
            (sessionsByTaskAndDate[s.task_id][dateKey] || 0) + Number(s.duration_minutes);
        }
      });

      return (data || []).map((task: any) => {
        const recConfig = task.recurrence_config as any;
        const isRecurring = recConfig?.type && recConfig.type !== 'none';

        let sessionsByDate: Record<string, number> | undefined;
        if (isRecurring) {
          // Start with timer_sessions grouped by date
          const timerByDate = sessionsByTaskAndDate[task.id] || {};
          // Apply manual overrides on top — user-entered values take precedence
          const manualOverrides: Record<string, number> = recConfig?.time_by_date_manual || {};
          sessionsByDate = { ...timerByDate, ...manualOverrides };
        }

        // Recurring tasks: today's sessions (+ any manual override) for current occurrence.
        // Non-recurring: use actual_minutes (accumulated all-time total).
        const total_tracked_minutes = isRecurring
          ? Number((sessionsByDate || {})[todayKey] ?? 0)
          : Number(task.actual_minutes ?? task.total_tracked_minutes ?? 0);

        return { ...task, total_tracked_minutes, session_minutes_by_date: sessionsByDate };
      });
    },
  });
}

function generateRecurringDates(startDate: string, config: RecurrenceConfig, maxDays = 30): string[] {
  const dates: string[] = [];
  const start = parseLocalDate(startDate);
  if (!start) return dates;
  const limit = addDays(new Date(), maxDays);
  
  if (config.type === 'daily') {
    let current = start;
    for (let i = 0; i < 100; i++) {
      current = addDays(current, config.interval);
      if (current > limit) break;
      dates.push(format(current, 'yyyy-MM-dd'));
    }
  } else if (config.type === 'weekly') {
    const targetDays = config.days_of_week?.length ? config.days_of_week : [getDay(start)];
    let weekStart = start;
    for (let w = 0; w < 20; w++) {
      weekStart = addWeeks(start, (w + 1) * config.interval);
      if (weekStart > limit) break;
      for (const dayOfWeek of targetDays) {
        const diff = dayOfWeek - getDay(weekStart);
        const d = addDays(weekStart, diff);
        if (d > start && d <= limit) {
          dates.push(format(d, 'yyyy-MM-dd'));
        }
      }
    }
  } else if (config.type === 'monthly') {
    const targetDays = config.days_of_month?.length ? config.days_of_month : [getDate(start)];
    let current = start;
    for (let m = 0; m < 12; m++) {
      current = addMonths(start, (m + 1) * config.interval);
      if (current > limit) break;
      for (const dayOfMonth of targetDays) {
        const d = new Date(current.getFullYear(), current.getMonth(), Math.min(dayOfMonth, new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()));
        if (d > start && d <= limit) {
          dates.push(format(d, 'yyyy-MM-dd'));
        }
      }
    }
  }
  
  return [...new Set(dates)].sort();
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      name: string;
      area: string;
      project_id?: string | null;
      status?: string;
      priority?: string;
      start_date?: string | null;
      due_date?: string | null;
      estimated_minutes?: number;
      recurrence_config?: RecurrenceConfig;
      notes?: string;
      work_block?: string;
    }) => {
      const { recurrence_config, work_block, ...rest } = task;
      const recJson = recurrence_config ? JSON.parse(JSON.stringify(recurrence_config)) : { type: 'none' };
      if (work_block) recJson.work_block = work_block;
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      const insertData = {
        ...rest,
        recurrence_config: recJson,
        ...(userId ? { user_id: userId } : {}),
      };

      const { data, error } = await supabase.from('tasks').insert(insertData as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks_with_time'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string } & Partial<{
      name: string; area: string; project_id: string | null; status: string;
      priority: string; start_date: string | null; due_date: string | null;
      estimated_minutes: number; actual_minutes: number; notes: string | null;
      completed_at: string | null; recurrence_config: RecurrenceConfig;
      work_block: string;
    }>) => {
      const { id, recurrence_config, work_block, ...updates } = params;
      // Merge work_block into recurrence_config JSON (external DB has no work_block column)
      let recJson: any = recurrence_config ? JSON.parse(JSON.stringify(recurrence_config)) : undefined;
      if (work_block !== undefined) {
        if (!recJson) {
          // Need to read current recurrence_config to merge work_block into it
          const { data: current } = await supabase.from('tasks').select('recurrence_config').eq('id', id).single();
          recJson = current?.recurrence_config || { type: 'none' };
        }
        recJson.work_block = work_block;
      }
      const payload: Record<string, any> = { ...updates };
      if (recJson) payload.recurrence_config = recJson;
      const { error } = await supabase.from('tasks').update(payload as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks_with_time'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks_with_time'] }),
  });
}
