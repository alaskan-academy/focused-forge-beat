import { useQuery } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
import { subDays, startOfDay } from 'date-fns';
import { toLocalDateKey } from '@/lib/recurrence';

/** Tracked minutes per local day and task: { 'yyyy-MM-dd': { taskId: minutes } }. */
export type WorkByDay = Record<string, Record<string, number>>;

/**
 * Tracked time from timer sessions (including manual adjustments), grouped by the day each
 * session started and by task. `days` limits it to the last N days; null loads all history.
 */
export function useDailyWorkTime(days: number | null = 7) {
  return useQuery<WorkByDay>({
    queryKey: ['daily_work_time', days],
    staleTime: 30_000,
    queryFn: async () => {
      let query = supabase
        .from('timer_sessions')
        .select('started_at, duration_minutes, task_id')
        .not('ended_at', 'is', null);
      if (days !== null) query = query.gte('started_at', startOfDay(subDays(new Date(), days - 1)).toISOString());
      const { data, error } = await query;
      if (error) throw error;

      const byDay: WorkByDay = {};
      (data || []).forEach((s) => {
        const minutes = Number(s.duration_minutes || 0);
        if (!minutes || !s.task_id) return;
        const day = toLocalDateKey(new Date(s.started_at));
        byDay[day] = byDay[day] || {};
        byDay[day][s.task_id] = (byDay[day][s.task_id] || 0) + minutes;
      });
      return byDay;
    },
  });
}
