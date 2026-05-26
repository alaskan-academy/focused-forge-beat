-- Add start_date column to tasks for multi-day task ranges
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date DATE;

-- Drop and recreate view so t.* expands to include start_date
DROP VIEW IF EXISTS public.tasks_with_time;

CREATE VIEW public.tasks_with_time AS
SELECT
  t.*,
  p.name AS project_name,
  p.color AS project_color,
  COALESCE(SUM(ts.duration_minutes), 0) AS total_tracked_minutes
FROM public.tasks t
LEFT JOIN public.projects p ON t.project_id = p.id
LEFT JOIN public.timer_sessions ts ON ts.task_id = t.id
GROUP BY t.id, p.name, p.color;
