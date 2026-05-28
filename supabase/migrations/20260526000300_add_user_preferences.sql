-- User preferences table: stores per-user settings (sort order, etc.)
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_prefs_all" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
