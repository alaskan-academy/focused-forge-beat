-- Add user_id to tables for per-user data isolation
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all on inbox_items" ON public.inbox_items;
DROP POLICY IF EXISTS "Allow all on timer_sessions" ON public.timer_sessions;

-- Tasks: show own rows + unclaimed (null) rows; write only own rows
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

-- Projects
CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

-- Inbox items
CREATE POLICY "inbox_select" ON public.inbox_items FOR SELECT
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));
CREATE POLICY "inbox_insert" ON public.inbox_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "inbox_update" ON public.inbox_items FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "inbox_delete" ON public.inbox_items FOR DELETE
  USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL));

-- Timer sessions: access tied to the owning task
CREATE POLICY "timer_sessions_select" ON public.timer_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = timer_sessions.task_id
      AND auth.uid() IS NOT NULL
      AND (tasks.user_id = auth.uid() OR tasks.user_id IS NULL)
  ));
CREATE POLICY "timer_sessions_insert" ON public.timer_sessions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = timer_sessions.task_id
      AND tasks.user_id = auth.uid()
  ));
CREATE POLICY "timer_sessions_update" ON public.timer_sessions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = timer_sessions.task_id
      AND auth.uid() IS NOT NULL
      AND (tasks.user_id = auth.uid() OR tasks.user_id IS NULL)
  ));
CREATE POLICY "timer_sessions_delete" ON public.timer_sessions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = timer_sessions.task_id
      AND auth.uid() IS NOT NULL
      AND (tasks.user_id = auth.uid() OR tasks.user_id IS NULL)
  ));

-- Recreate view with security_invoker so RLS on tasks is respected
DROP VIEW IF EXISTS public.tasks_with_time;
CREATE VIEW public.tasks_with_time WITH (security_invoker = true) AS
SELECT t.*, p.name AS project_name, p.color AS project_color,
  COALESCE(SUM(ts.duration_minutes), 0) AS total_tracked_minutes
FROM public.tasks t
LEFT JOIN public.projects p ON t.project_id = p.id
LEFT JOIN public.timer_sessions ts ON ts.task_id = t.id
GROUP BY t.id, p.name, p.color;
