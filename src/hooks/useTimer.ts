import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';

// Sessions longer than this were probably left running by accident (browser left open, etc.)
export const MAX_SESSION_MINUTES = 480; // 8 hours

export interface ActiveTimerSession {
  id: string;
  task_id: string;
  started_at: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function minutesSince(startedAt: string, until: number = Date.now()): number {
  return (until - new Date(startedAt).getTime()) / 60000;
}

function invalidateTimerQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['active_timer'] });
  qc.invalidateQueries({ queryKey: ['tasks_with_time'] });
  qc.invalidateQueries({ queryKey: ['daily_work_time'] });
}

/**
 * Closes a session. `minutes` overrides the counted duration; `null` keeps the session
 * in history without counting it (used for timers forgotten running for hours).
 */
async function closeSession(session: { id: string; started_at: string }, minutes?: number | null) {
  const duration = minutes === undefined ? round2(minutesSince(session.started_at)) : minutes;
  const { error } = await supabase
    .from('timer_sessions')
    .update({ ended_at: new Date().toISOString(), duration_minutes: duration })
    .eq('id', session.id);
  if (error) throw error;
}

/**
 * The running timer, if any. The elapsed time ticks locally (useElapsedTime), so this only
 * needs to catch timers started or stopped elsewhere (another tab or device).
 */
export function useActiveTimer() {
  return useQuery<ActiveTimerSession | null>({
    queryKey: ['active_timer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timer_sessions')
        .select('id, task_id, started_at')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ActiveTimerSession | null;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Starts a timer on a task, first closing any timer still running. */
export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string): Promise<{ closedStale: boolean }> => {
      const { data: running, error: runningError } = await supabase
        .from('timer_sessions')
        .select('id, started_at')
        .is('ended_at', null);
      if (runningError) throw runningError;

      let closedStale = false;
      for (const session of running || []) {
        if (minutesSince(session.started_at) > MAX_SESSION_MINUTES) {
          // Forgotten timer: keep the session but don't count the inflated time
          await closeSession(session, null);
          closedStale = true;
        } else {
          await closeSession(session);
        }
      }

      const { error } = await supabase
        .from('timer_sessions')
        .insert({ task_id: taskId, started_at: new Date().toISOString() });
      if (error) throw error;
      return { closedStale };
    },
    onSuccess: () => invalidateTimerQueries(qc),
  });
}

/** Stops the timer and saves the session. Pass `minutes` to save a corrected duration. */
export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ session, minutes }: { session: ActiveTimerSession; minutes?: number }) => {
      const duration = minutes ?? round2(minutesSince(session.started_at));
      await closeSession(session, duration);
      return duration;
    },
    onSuccess: () => invalidateTimerQueries(qc),
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
    onSuccess: () => invalidateTimerQueries(qc),
  });
}

/** Seconds elapsed since `startedAt`, updated every second. */
export function useElapsedTime(startedAt: string | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) { setElapsed(0); return; }
    const update = () => setElapsed((Date.now() - new Date(startedAt).getTime()) / 1000);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}
