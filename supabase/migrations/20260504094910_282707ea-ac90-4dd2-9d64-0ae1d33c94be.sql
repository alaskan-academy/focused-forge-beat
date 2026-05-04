DROP VIEW IF EXISTS public.tasks_with_time;
CREATE VIEW public.tasks_with_time AS
SELECT t.id,
    t.name,
    t.area,
    t.project_id,
    t.status,
    t.priority,
    t.due_date,
    t.estimated_minutes,
    t.actual_minutes,
    t.notes,
    t.created_at,
    t.completed_at,
    p.name AS project_name,
    p.color AS project_color,
    GREATEST(COALESCE(t.actual_minutes, 0)::numeric, COALESCE(sum(ts.duration_minutes), 0)) AS total_tracked_minutes
   FROM ((tasks t
     LEFT JOIN projects p ON ((t.project_id = p.id)))
     LEFT JOIN timer_sessions ts ON ((ts.task_id = t.id)))
  GROUP BY t.id, p.name, p.color;