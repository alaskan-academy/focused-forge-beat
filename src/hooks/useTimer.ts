import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      // Stop any active timer first (save it)
      const { data: active } = await supabase
        .from('timer_sessions')
        .select('*')
        .is('ended_at', null)
        .limit(1)
        .maybeSingle();

      if (active) {
        const duration = (Date.now() - new Date(active.started_at).getTime()) / 60000;
        await supabase
          .from('timer_sessions')
          .update({ ended_at: new Date().toISOString(), duration_minutes: Math.round(duration * 100) / 100 })
          .eq('id', active.id);
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
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!session) return;
      const duration = Math.round(((pausedAt - new Date(session.started_at).getTime()) / 60000) * 100) / 100;
      const { error } = await supabase
        .from('timer_sessions')
        .update({ ended_at: new Date(pausedAt).toISOString(), duration_minutes: duration })
        .eq('id', sessionId);
      if (error) throw error;

      // Update actual_minutes on the task with total tracked time
      const { data: allSessions } = await supabase
        .from('timer_sessions')
        .select('duration_minutes')
        .eq('task_id', session.task_id)
        .not('ended_at', 'is', null);

      const totalMinutes = Math.round(
        (allSessions || []).reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0) + duration
      );

      await supabase
        .from('tasks')
        .update({ actual_minutes: totalMinutes })
        .eq('id', session.task_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active_timer'] });
      qc.invalidateQueries({ queryKey: ['tasks_with_time'] });
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
    if (frozen) return; // don't update when paused
    const update = () => setElapsed((Date.now() - new Date(startedAt).getTime()) / 1000);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt, frozen]);

  return elapsed;
}
