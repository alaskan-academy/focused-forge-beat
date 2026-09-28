-- Soft delete: deleting a task sets deleted_at instead of removing the row
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Recreate view with security_invoker so RLS on tasks is respected, hiding soft-deleted tasks
DROP VIEW IF EXISTS public.tasks_with_time;
CREATE VIEW public.tasks_with_time WITH (security_invoker = true) AS
SELECT t.*, p.name AS project_name, p.color AS project_color,
  COALESCE(SUM(ts.duration_minutes), 0) AS total_tracked_minutes
FROM public.tasks t
LEFT JOIN public.projects p ON t.project_id = p.id
LEFT JOIN public.timer_sessions ts ON ts.task_id = t.id
WHERE t.deleted_at IS NULL
GROUP BY t.id, p.name, p.color;
