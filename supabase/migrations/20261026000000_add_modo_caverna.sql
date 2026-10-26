-- Modo Caverna: três tabelas novas, isoladas por dono. Nenhuma tabela existente é alterada.

CREATE TABLE IF NOT EXISTS public.caverna_perfil (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pessoa TEXT NOT NULL CHECK (pessoa IN ('lucas', 'jessica')),
  dia_atual INTEGER NOT NULL DEFAULT 1 CHECK (dia_atual BETWEEN 1 AND 30),
  papel TEXT NOT NULL DEFAULT 'suporte' CHECK (papel IN ('casa', 'suporte')),
  cargas JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.caverna_dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 30),
  itens JSONB NOT NULL DEFAULT '{}'::jsonb,
  agua_ml INTEGER NOT NULL DEFAULT 0 CHECK (agua_ml >= 0),
  pontos INTEGER NOT NULL DEFAULT 0 CHECK (pontos BETWEEN 0 AND 7),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dia)
);

CREATE TABLE IF NOT EXISTS public.caverna_medidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 30),
  peso_kg NUMERIC(5, 1),
  cintura_cm NUMERIC(5, 1),
  flexoes INTEGER,
  bike_min INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dia)
);

ALTER TABLE public.caverna_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caverna_dias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caverna_medidas ENABLE ROW LEVEL SECURITY;

-- Cada pessoa só vê e edita o próprio.
CREATE POLICY "caverna_perfil_own" ON public.caverna_perfil
  FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "caverna_dias_own" ON public.caverna_dias
  FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "caverna_medidas_own" ON public.caverna_medidas
  FOR ALL USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
