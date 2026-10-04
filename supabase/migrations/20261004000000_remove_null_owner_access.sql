-- Rows without an owner (user_id IS NULL) were readable and editable by any signed-in user.
-- They existed only before per-user isolation; there are none left, so access is now owner-only.
-- Policies only: no table data is changed.

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "inbox_select" ON public.inbox_items;
DROP POLICY IF EXISTS "inbox_update" ON public.inbox_items;
DROP POLICY IF EXISTS "inbox_delete" ON public.inbox_items;
CREATE POLICY "inbox_select" ON public.inbox_items FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "inbox_update" ON public.inbox_items FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "inbox_delete" ON public.inbox_items FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "timer_sessions_select" ON public.timer_sessions;
DROP POLICY IF EXISTS "timer_sessions_update" ON public.timer_sessions;
DROP POLICY IF EXISTS "timer_sessions_delete" ON public.timer_sessions;
CREATE POLICY "timer_sessions_select" ON public.timer_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = timer_sessions.task_id AND auth.uid() IS NOT NULL AND tasks.user_id = auth.uid()));
CREATE POLICY "timer_sessions_update" ON public.timer_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = timer_sessions.task_id AND auth.uid() IS NOT NULL AND tasks.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = timer_sessions.task_id AND tasks.user_id = auth.uid()));
CREATE POLICY "timer_sessions_delete" ON public.timer_sessions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = timer_sessions.task_id AND auth.uid() IS NOT NULL AND tasks.user_id = auth.uid()));
