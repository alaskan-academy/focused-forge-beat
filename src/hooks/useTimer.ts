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

      const { error } = await supabase
        .from('timer_sessions')
        .update({ ended_at: new Date(pausedAt).toISOString(), duration_minutes: duration })
        .eq('id', sessionId);
      if (error) throw error;

      // Note: total_tracked_minutes is computed by the view (SUM of timer_sessions.duration_minutes)
      // No need to update tasks.actual_minutes — that's for manual overrides only.
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
