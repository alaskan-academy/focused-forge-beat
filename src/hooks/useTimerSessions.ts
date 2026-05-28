import { useQuery } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
import { format, subDays, startOfDay } from 'date-fns';

/**
 * Returns daily work time in minutes, keyed by 'yyyy-MM-dd'.
 * Each entry = sum of duration_minutes for timer sessions that STARTED on that day.
 * This correctly tracks how many hours were worked each day, even for multi-day tasks.
 */
export function useDailyWorkTime(days = 7) {
  return useQuery<Record<string, number>>({
    queryKey: ['daily_work_time', days],
    staleTime: 30_000,
    queryFn: async () => {
      const since = startOfDay(subDays(new Date(), days - 1)).toISOString();
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('started_at, duration_minutes, task_id')
        .not('ended_at', 'is', null)
        .gte('started_at', since);
      if (error) throw error;

      const byDay: Record<string, number> = {};
      (data || []).forEach((s) => {
        const day = format(new Date(s.started_at), 'yyyy-MM-dd');
        byDay[day] = (byDay[day] || 0) + Number(s.duration_minutes || 0);
      });
      return byDay;
    },
  });
}
