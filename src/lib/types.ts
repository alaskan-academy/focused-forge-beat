export interface TaskWithTime {
  id: string;
  name: string;
  area: string;
  project_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  recurrence: string;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  project_name: string | null;
  project_color: string | null;
  total_tracked_minutes: number | null;
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
