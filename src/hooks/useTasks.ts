import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
import { addDays, addWeeks, addMonths, format, getDay, getDate } from 'date-fns';
import { RecurrenceConfig } from '@/lib/recurrence';
import { parseLocalDate } from '@/lib/dateUtils';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks_with_time'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks_with_time')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
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
      due_date?: string | null;
      estimated_minutes?: number;
      recurrence_config?: RecurrenceConfig;
      notes?: string;
      work_block?: string;
    }) => {
      const { recurrence_config, ...rest } = task;
      const insertData = {
        ...rest,
        recurrence_config: recurrence_config ? JSON.parse(JSON.stringify(recurrence_config)) : { type: 'none' },
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
      priority: string; due_date: string | null; estimated_minutes: number;
      actual_minutes: number; notes: string | null;
      completed_at: string | null; recurrence_config: RecurrenceConfig;
      work_block: string;
    }>) => {
      const { id, recurrence_config, work_block, ...updates } = params;
      const payload: Record<string, any> = recurrence_config 
        ? { ...updates, recurrence_config: JSON.parse(JSON.stringify(recurrence_config)) }
        : { ...updates };
      if (work_block !== undefined) {
        payload.work_block = work_block;
      }
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
