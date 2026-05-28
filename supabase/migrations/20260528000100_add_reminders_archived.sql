ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
