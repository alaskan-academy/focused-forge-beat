
-- Drop view first so we can modify the column
DROP VIEW IF EXISTS public.tasks_with_time;

-- Drop old recurrence column
ALTER TABLE public.tasks DROP COLUMN recurrence;

-- Recreate the view with recurrence_config
CREATE OR REPLACE VIEW public.tasks_with_time AS
SELECT 
  t.*,
  p.name AS project_name,
  p.color AS project_color,
  COALESCE(SUM(ts.duration_minutes), 0) AS total_tracked_minutes
FROM public.tasks t
LEFT JOIN public.projects p ON t.project_id = p.id
LEFT JOIN public.timer_sessions ts ON ts.task_id = t.id
GROUP BY t.id, p.name, p.color;
