
CREATE OR REPLACE FUNCTION public.sync_task_completed_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status <> 'done') THEN
    -- Only set completed_at if it was not explicitly provided in the update
    IF NEW.completed_at IS NULL OR NEW.completed_at = OLD.completed_at THEN
      NEW.completed_at := now();
    END IF;
  ELSIF NEW.status <> 'done' AND (OLD.status IS NULL OR OLD.status = 'done') THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trg_sync_task_completed_at ON public.tasks;
CREATE TRIGGER trg_sync_task_completed_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_task_completed_at();
