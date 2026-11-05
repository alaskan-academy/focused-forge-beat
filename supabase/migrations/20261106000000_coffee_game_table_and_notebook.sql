-- Coffee Cats: mesa de jogos (Sudoku de inglês) e caderninho escrito à mão. Só acrescenta; não altera nada que já existe.
--
-- coffee_puzzles: puzzle do dia de cada jogador (um por tamanho por dia), com o estado em andamento
-- (para continuar depois), o histórico e as estrelas. O puzzle nasce pela função coffee_start_puzzle
-- (o dia é decidido pelo banco, no horário de Brasília) e a recompensa sai só por coffee_finish_puzzle.

CREATE TABLE IF NOT EXISTS public.coffee_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'sudoku' CHECK (kind IN ('sudoku')),
  day DATE NOT NULL,
  size SMALLINT NOT NULL CHECK (size IN (4, 6, 9)),
  theme TEXT NOT NULL,
  data JSONB NOT NULL,                      -- grade, palavras e pistas (gerado no app)
  progress JSONB NOT NULL DEFAULT '{}'::jsonb, -- casas preenchidas, erros e dicas por palavra
  status TEXT NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'done')),
  stars SMALLINT CHECK (stars BETWEEN 1 AND 3),
  coins_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  UNIQUE (user_id, kind, day, size)
);
CREATE INDEX IF NOT EXISTS coffee_puzzles_user_day ON public.coffee_puzzles (user_id, day DESC);

ALTER TABLE public.coffee_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_puzzles_read_own" ON public.coffee_puzzles FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
-- o próprio jogador só salva o andamento de um puzzle que ainda está em jogo
CREATE POLICY "coffee_puzzles_progress_own" ON public.coffee_puzzles FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid() AND status = 'playing')
  WITH CHECK (user_id = auth.uid() AND status = 'playing');
REVOKE INSERT, UPDATE, DELETE ON public.coffee_puzzles FROM authenticated, anon;
GRANT UPDATE (progress, updated_at) ON public.coffee_puzzles TO authenticated;

-- Começa (ou retoma) o puzzle de hoje deste tamanho. Se já existe, devolve o que está salvo.
CREATE OR REPLACE FUNCTION public.coffee_start_puzzle(p_size INTEGER, p_theme TEXT, p_data JSONB)
RETURNS public.coffee_puzzles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID; v_day DATE; v_row public.coffee_puzzles;
BEGIN
  SELECT cafe_id INTO v_cafe FROM public.coffee_members WHERE user_id = auth.uid();
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'not a member of a cafe' USING ERRCODE = '42501'; END IF;
  IF p_size NOT IN (4, 6, 9) THEN RAISE EXCEPTION 'invalid size'; END IF;
  v_day := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  INSERT INTO public.coffee_puzzles (cafe_id, user_id, day, size, theme, data)
    VALUES (v_cafe, auth.uid(), v_day, p_size, coalesce(p_theme, ''), coalesce(p_data, '{}'::jsonb))
    ON CONFLICT (user_id, kind, day, size) DO NOTHING;
  SELECT * INTO v_row FROM public.coffee_puzzles WHERE user_id = auth.uid() AND kind = 'sudoku' AND day = v_day AND size = p_size;
  RETURN v_row;
END $$;

-- Conclui o puzzle: moedas fixas por tamanho (4×4 = 6, 6×6 = 10, 9×9 = 16) e XP como nos atendimentos
-- (5 por estrela + 5 por palavra treinada, até 10). Cada puzzle paga uma vez só.
CREATE OR REPLACE FUNCTION public.coffee_finish_puzzle(p_puzzle UUID, p_stars INTEGER, p_mistakes INTEGER, p_hints INTEGER, p_words INTEGER, p_progress JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_puzzles; v_stars INTEGER; v_coins INTEGER; v_xp INTEGER; v_player public.coffee_players;
BEGIN
  SELECT * INTO v_row FROM public.coffee_puzzles WHERE id = p_puzzle AND user_id = auth.uid() AND status = 'playing' FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'puzzle not found or already finished'; END IF;
  v_stars := least(3, greatest(1, p_stars));
  v_coins := CASE v_row.size WHEN 4 THEN 6 WHEN 6 THEN 10 ELSE 16 END;
  v_xp := v_stars * 5 + least(10, greatest(1, p_words)) * 5;

  UPDATE public.coffee_puzzles SET status = 'done', stars = v_stars, coins_earned = v_coins, xp_earned = v_xp,
    progress = coalesce(p_progress, progress), finished_at = now(), updated_at = now()
    WHERE id = p_puzzle;
  UPDATE public.coffee_players SET coins = coins + v_coins, xp = xp + v_xp, updated_at = now()
    WHERE user_id = auth.uid() RETURNING * INTO v_player;
  INSERT INTO public.coffee_activity (cafe_id, user_id, kind, data)
    VALUES (v_row.cafe_id, auth.uid(), 'puzzle',
            jsonb_build_object('size', v_row.size, 'stars', v_stars, 'theme', v_row.theme,
                               'mistakes', greatest(0, p_mistakes), 'hints', greatest(0, p_hints)));

  RETURN jsonb_build_object('coins', v_coins, 'xp', v_xp, 'total_coins', v_player.coins, 'total_xp', v_player.xp);
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_start_puzzle(INTEGER, TEXT, JSONB),
  public.coffee_finish_puzzle(UUID, INTEGER, INTEGER, INTEGER, INTEGER, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_start_puzzle(INTEGER, TEXT, JSONB),
  public.coffee_finish_puzzle(UUID, INTEGER, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;

-- ── Caderninho escrito à mão ───────────────────────────────────────────────
-- Palavras/expressões que cada jogador anota (de aula, série, música…). Cada um escreve o seu;
-- o outro membro do café pode ler (para copiar). Viram itens de revisão "u:<id>" em coffee_player_items.
CREATE TABLE IF NOT EXISTS public.coffee_custom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  en TEXT NOT NULL CHECK (length(trim(en)) BETWEEN 1 AND 120),
  pt TEXT NOT NULL CHECK (length(trim(pt)) BETWEEN 1 AND 200),
  example TEXT CHECK (example IS NULL OR length(example) <= 300),
  source TEXT CHECK (source IS NULL OR length(source) <= 80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coffee_custom_items_cafe ON public.coffee_custom_items (cafe_id, created_at DESC);

ALTER TABLE public.coffee_custom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_custom_read_cafe" ON public.coffee_custom_items FOR SELECT USING (cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_custom_insert_own" ON public.coffee_custom_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid() AND cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_custom_update_own" ON public.coffee_custom_items FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_custom_delete_own" ON public.coffee_custom_items FOR DELETE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
