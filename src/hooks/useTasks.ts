import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
import { queryClient } from '@/lib/queryClient';
import { RecurrenceConfig, parseRecurrence, toLocalDateKey } from '@/lib/recurrence';
import { Task } from '@/lib/types';

export const TASKS_QUERY_KEY = ['tasks_with_time'] as const;

// Per-day tracked time is available for this many days back (day navigation, weekly views).
const SESSION_HISTORY_DAYS = 120;

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: async () => {
      // Fetch tasks and recent completed timer sessions in parallel.
      // Sessions are grouped by (task_id, local date) so any date filter can read the
      // correct per-occurrence time. For today's display, only today's sessions count,
      // ensuring recurring tasks always start each new day at zero.
      const since = new Date();
      since.setDate(since.getDate() - SESSION_HISTORY_DAYS);
      since.setHours(0, 0, 0, 0);

      const todayKey = toLocalDateKey(new Date());

      const { data: { session: authSession } } = await supabase.auth.getSession();
      const userId = authSession?.user?.id;
      if (!userId) return [];

      const [{ data, error }, { data: sessions, error: sessionsError }] = await Promise.all([
        supabase.from('tasks_with_time').select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('timer_sessions')
          .select('task_id, duration_minutes, started_at')
          .not('ended_at', 'is', null)
          .gte('started_at', since.toISOString()),
      ]);
      if (error) throw error;
      if (sessionsError) throw sessionsError;

      // Group sessions by (task_id, local_date) — uses browser local timezone
      const sessionsByTaskAndDate: Record<string, Record<string, number>> = {};
      (sessions || []).forEach((s) => {
        if (s.task_id && s.duration_minutes) {
          const dateKey = toLocalDateKey(new Date(s.started_at));
          if (!sessionsByTaskAndDate[s.task_id]) sessionsByTaskAndDate[s.task_id] = {};
          sessionsByTaskAndDate[s.task_id][dateKey] =
            (sessionsByTaskAndDate[s.task_id][dateKey] || 0) + Number(s.duration_minutes);
        }
      });

      return (data || []).map((row) => {
        const task = row as unknown as Omit<Task, 'session_minutes_by_date'>;
        const isRecurring = parseRecurrence(task.recurrence_config).type !== 'none';

        // All tasks get session_minutes_by_date so multi-day non-recurring tasks
        // can also show per-day time (same as recurring tasks).
        const sessionsByDate = sessionsByTaskAndDate[task.id] || {};

        // Recurring tasks: today's sessions for current occurrence (resets each new day).
        // Non-recurring: total_tracked_minutes from the view (authoritative all-time session sum).
        // `||` on purpose: legacy tasks from before timer sessions only have actual_minutes.
        const total_tracked_minutes = isRecurring
          ? Number(sessionsByDate[todayKey] ?? 0)
          : Number(task.total_tracked_minutes || task.actual_minutes || 0);

        return { ...task, total_tracked_minutes, session_minutes_by_date: sessionsByDate };
      });
    },
  });
}

export interface NewTaskInput {
  name: string;
  area: string;
  project_id?: string | null;
  status?: string;
  priority?: string;
  start_date?: string | null;
  due_date?: string | null;
  estimated_minutes?: number;
  recurrence_config?: RecurrenceConfig;
  notes?: string | null;
  work_block?: string;
  completed_at?: string | null;
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: NewTaskInput) => {
      const { recurrence_config, work_block, ...rest } = task;
      const recJson: Record<string, unknown> = recurrence_config ? JSON.parse(JSON.stringify(recurrence_config)) : { type: 'none' };
      if (work_block) recJson.work_block = work_block;
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      const insertData = {
        ...rest,
        recurrence_config: recJson,
        ...(userId ? { user_id: userId } : {}),
      };

      const { data, error } = await supabase.from('tasks').insert(insertData as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

export type TaskUpdate = { id: string } & Partial<{
  name: string; area: string; project_id: string | null; status: string;
  priority: string; start_date: string | null; due_date: string | null;
  estimated_minutes: number; notes: string | null;
  completed_at: string | null; recurrence_config: RecurrenceConfig;
  work_block: string;
}>;

/** Applies an update to a cached task, mirroring how the mutation stores work_block. */
function applyTaskUpdate(task: Task, params: TaskUpdate): Task {
  const { id: _id, recurrence_config, work_block, ...rest } = params;
  let rc: unknown = recurrence_config ?? task.recurrence_config;
  if (work_block !== undefined) rc = { ...parseRecurrence(rc), work_block };
  return { ...task, ...rest, recurrence_config: rc };
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: TaskUpdate) => {
      const { id, recurrence_config, work_block, ...updates } = params;
      // Merge work_block into recurrence_config JSON (external DB has no work_block column)
      let recJson: Record<string, unknown> | undefined = recurrence_config ? JSON.parse(JSON.stringify(recurrence_config)) : undefined;
      if (work_block !== undefined) {
        if (!recJson) {
          // Need to read current recurrence_config to merge work_block into it
          const { data: current, error: readError } = await supabase.from('tasks').select('recurrence_config').eq('id', id).single();
          if (readError) throw readError;
          recJson = (current?.recurrence_config as Record<string, unknown>) || { type: 'none' };
        }
        recJson.work_block = work_block;
      }
      const payload: Record<string, unknown> = { ...updates };
      if (recJson) payload.recurrence_config = recJson;
      const { error } = await supabase.from('tasks').update(payload as never).eq('id', id);
      if (error) throw error;
    },
    // Optimistic: checkboxes and status changes respond instantly, rolled back on error
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previous = qc.getQueryData<Task[]>(TASKS_QUERY_KEY);
      if (previous) {
        qc.setQueryData<Task[]>(TASKS_QUERY_KEY, previous.map((t) => (t.id === params.id ? applyTaskUpdate(t, params) : t)));
      }
      return { previous };
    },
    onError: (_err, _params, context) => {
      if (context?.previous) qc.setQueryData(TASKS_QUERY_KEY, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  });
}

/**
 * Changes a task's recurrence based on its latest saved version (read fresh from the database),
 * so quick actions — move, skip, end, undo — never overwrite changes made elsewhere.
 */
export async function updateTaskRecurrence(id: string, change: (rc: RecurrenceConfig) => RecurrenceConfig) {
  const { data, error } = await supabase.from('tasks').select('recurrence_config').eq('id', id).single();
  if (error) throw error;
  const next = change(parseRecurrence(data?.recurrence_config));
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ recurrence_config: next } as never)
    .eq('id', id);
  if (updateError) throw updateError;
  queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
}

/** Soft delete: the task goes to the trash (deleted_at) and can be restored. */
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['deleted_tasks'] });
    },
  });
}

export interface DeletedTask {
  id: string;
  name: string;
  area: string;
  project_id: string | null;
  status: string;
  due_date: string | null;
  recurrence_config: unknown;
  deleted_at: string;
}

export function useDeletedTasks() {
  return useQuery<DeletedTask[]>({
    queryKey: ['deleted_tasks'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return [];
      // Reads the base table: the tasks_with_time view hides soft-deleted tasks
      const { data, error } = await supabase
        .from('tasks')
        .select('id, name, area, project_id, status, due_date, recurrence_config, deleted_at')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DeletedTask[];
    },
  });
}

/** Brings a task back from the trash. Plain function so "Desfazer" toasts work after the modal closes. */
export async function restoreTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: null } as never)
    .eq('id', id);
  if (error) throw error;
  queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: ['deleted_tasks'] });
}

export function useRestoreTask() {
  return useMutation({ mutationFn: restoreTask });
}
