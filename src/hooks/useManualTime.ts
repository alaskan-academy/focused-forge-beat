import { useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
import { fromLocalDateKey, toLocalDateKey } from '@/lib/recurrence';

/** "hoje", "ontem" or dd/MM for the day a manual adjustment lands on. */
export function manualTimeDayLabel(dateKey: string): string {
  const today = new Date();
  if (dateKey === toLocalDateKey(today)) return 'hoje';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dateKey === toLocalDateKey(yesterday)) return 'ontem';
  return fromLocalDateKey(dateKey).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Records a manual time adjustment as a zero-length timer session, so the timer history stays
 * the single source of truth. Past days are recorded at noon of that day; today at the current time.
 */
export function useAddManualTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, minutes, dateKey }: { taskId: string; minutes: number; dateKey?: string }) => {
      const todayKey = toLocalDateKey(new Date());
      const key = dateKey && dateKey < todayKey ? dateKey : todayKey;
      const at = key === todayKey ? new Date() : new Date(`${key}T12:00:00`);
      const iso = at.toISOString();
      const { error } = await supabase.from('timer_sessions').insert({
        task_id: taskId,
        started_at: iso,
        ended_at: iso,
        duration_minutes: minutes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks_with_time'] });
      qc.invalidateQueries({ queryKey: ['daily_work_time'] });
    },
  });
}
