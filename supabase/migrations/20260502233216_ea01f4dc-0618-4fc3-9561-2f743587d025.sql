ALTER TABLE public.tasks ALTER COLUMN work_block SET DEFAULT 'none';
UPDATE public.tasks SET work_block = 'none' WHERE work_block = 'morning';