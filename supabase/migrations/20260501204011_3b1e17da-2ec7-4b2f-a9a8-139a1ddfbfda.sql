
CREATE OR REPLACE FUNCTION public.sync_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status <> 'done') THEN
    NEW.completed_at := now();
  ELSIF NEW.status <> 'done' AND (OLD.status IS NULL OR OLD.status = 'done') THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_sync_task_completed_at
  BEFORE INSERT OR UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_task_completed_at();
