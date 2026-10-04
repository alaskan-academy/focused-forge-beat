/** A task as loaded by useTasks: the tasks_with_time row plus per-day tracked minutes. */
export interface Task {
  id: string;
  name: string;
  area: string;
  project_id: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  recurrence_config: unknown;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  deleted_at?: string | null;
  user_id?: string | null;
  project_name?: string | null;
  project_color?: string | null;
  /** Non-recurring: all-time tracked minutes. Recurring: today's tracked minutes. */
  total_tracked_minutes: number;
  /** Tracked minutes per local day (yyyy-MM-dd), from timer sessions. */
  session_minutes_by_date: Record<string, number>;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  status: string;
  created_at: string;
}

export interface TimerSession {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
}

export type DateFilter = 'today' | 'yesterday' | 'tomorrow' | 'week' | 'custom';
export type AreaFilter = 'all' | 'work' | 'personal';
export type StatusFilter = 'all' | 'todo' | 'in_progress' | 'done';
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
