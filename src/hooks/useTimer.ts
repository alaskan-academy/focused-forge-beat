import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';

// Sessions longer than this are considered stale (browser left open, etc.)
const MAX_SESSION_MINUTES = 480; // 8 hours

export function useActiveTimer() {
  return useQuery({
    queryKey: ['active_timer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('*')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 1000,
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      // Stop any active timer first
      const { data: active } = await supabase
        .from('timer_sessions')
        .select('*')
        .is('ended_at', null)
        .limit(1)
        .maybeSingle();

      if (active) {
        const durationMinutes = (Date.now() - new Date(active.started_at).getTime()) / 60000;

        if (durationMinutes > MAX_SESSION_MINUTES) {
          // Stale session — discard silently instead of saving inflated time
          await supabase.from('timer_sessions').delete().eq('id', active.id);
        } else {
          await supabase
            .from('timer_sessions')
            .update({
              ended_at: new Date().toISOString(),
              duration_minutes: Math.round(durationMinutes * 100) / 100,
            })
            .eq('id', active.id);
        }
      }

      const { error } = await supabase
        .from('timer_sessions')
        .insert({ task_id: taskId, started_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active_timer'] });
      qc.invalidateQueries({ queryKey: ['tasks_with_time'] });
    },
  });
}

export function useSaveTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, pausedAt }: { sessionId: string; pausedAt: number }) => {
      const { data: session } = await supabase
        .from('timer_sessions')
        .select('started_at')
        .eq('id', sessionId)
        .single();

      if (!session) return;

      const duration = Math.round(((pausedAt - new Date(session.started_at).getTime()) / 60000) * 100) / 100;

      if (duration > MAX_SESSION_MINUTES) {
        throw new Error(
          `Esta sessão tem ${Math.round(duration / 60)}h — parece que o timer ficou aberto. Use "Descartar" e reinicie o timer.`
        );
      }

      const { data: sessionFull } = await supabase
        .from('timer_sessions')
        .select('task_id')
        .eq('id', sessionId)
        .single();

      const { error } = await supabase
        .from('timer_sessions')
        .update({ ended_at: new Date(pausedAt).toISOString(), duration_minutes: duration })
        .eq('id', sessionId);
      if (error) throw error;

      // Update actual_minutes on the task.
      // For recurring tasks: reset to the session's duration when it's a new occurrence day,
      // so each occurrence starts fresh while full history is preserved in timer_sessions.
      // For non-recurring tasks: always accumulate.
      if (sessionFull?.task_id) {
        const { data: currentTask } = await supabase
          .from('tasks')
          .select('actual_minutes, recurrence_config')
          .eq('id', sessionFull.task_id)
          .single();

        const recConfig = currentTask?.recurrence_config as any;
        const isRecurring = recConfig?.type && recConfig.type !== 'none';
        const today = new Date().toISOString().split('T')[0]; // 'yyyy-MM-dd'
        const lastTrackedDate = recConfig?.last_occurrence_tracked_date as string | undefined;

        let newActualMinutes: number;
        if (isRecurring && lastTrackedDate !== today) {
          // First save of a new occurrence day — discard previous occurrences' accumulated time
          newActualMinutes = Math.round(duration * 100) / 100;
        } else {
          // Same day (multiple sessions) or non-recurring — accumulate normally
          const previous = Number(currentTask?.actual_minutes ?? 0);
          newActualMinutes = Math.round((previous + duration) * 100) / 100;
        }

        const taskUpdates: Record<string, unknown> = { actual_minutes: newActualMinutes };
        if (isRecurring) {
          // Persist today's date so subsequent saves on the same day accumulate correctly
          taskUpdates.recurrence_config = { ...recConfig, last_occurrence_tracked_date: today };
        }

        await supabase
          .from('tasks')
          .update(taskUpdates)
          .eq('id', sessionFull.task_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active_timer'] });
      qc.invalidateQueries({ queryKey: ['tasks_with_time'] });
      qc.invalidateQueries({ queryKey: ['daily_work_time'] });
    },
  });
}

export function useDiscardTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('timer_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active_timer'] });
      qc.invalidateQueries({ queryKey: ['tasks_with_time'] });
    },
  });
}

export function useElapsedTime(startedAt: string | null, frozen: boolean) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) { setElapsed(0); return; }
    if (frozen) return;
    const update = () => setElapsed((Date.now() - new Date(startedAt).getTime()) / 1000);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt, frozen]);

  return elapsed;
}
