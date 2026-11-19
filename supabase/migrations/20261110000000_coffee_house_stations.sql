-- Coffee Cats: estações de estudo da casa (Etapa 4). Só acrescenta.
--
-- Presentes: cada pessoa ganha um computador e um telefone no próprio quarto; a casa ganha uma
-- TV e uma estante na sala. Se o lugar estiver ocupado, o presente vai para a mochila.
-- Telefone: recados de agradecimento em inglês para a outra pessoa (+5 🪙 no primeiro do dia).
-- TV: episódio de escuta (+5 🪙 por dia se acertar metade ou mais; senão +2).

ALTER TABLE public.coffee_house_items ADD COLUMN IF NOT EXISTS gift TEXT;

CREATE TABLE IF NOT EXISTS public.coffee_daily_rewards (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  day DATE NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, day)
);
ALTER TABLE public.coffee_daily_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_daily_rewards_read_own" ON public.coffee_daily_rewards FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_daily_rewards FROM authenticated, anon;

CREATE TABLE IF NOT EXISTS public.coffee_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300),
  heart BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS coffee_notes_cafe ON public.coffee_notes (cafe_id, created_at DESC);
ALTER TABLE public.coffee_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_notes_read_mine" ON public.coffee_notes FOR SELECT
  USING (cafe_id = public.coffee_my_cafe() AND (from_user = auth.uid() OR to_user = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON public.coffee_notes FROM authenticated, anon;

ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_notes;

-- Recompensa diária de uma atividade (uso interno): dá as moedas só na primeira vez do dia.
CREATE OR REPLACE FUNCTION public.coffee_daily_reward(p_user UUID, p_kind TEXT, p_coins INTEGER)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_rows INTEGER;
BEGIN
  INSERT INTO public.coffee_daily_rewards (user_id, kind, day, coins) VALUES (p_user, p_kind, v_today, p_coins)
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RETURN 0; END IF;
  UPDATE public.coffee_players SET coins = coins + p_coins, updated_at = now() WHERE user_id = p_user;
  RETURN p_coins;
END $$;

-- Tile de chão livre de móveis (uso interno; o mapa fixo já foi escolhido para os presentes).
CREATE OR REPLACE FUNCTION public.coffee_house_tile_free(p_cafe UUID, p_x INTEGER, p_y INTEGER)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.coffee_house_items i JOIN public.coffee_shop_catalog c USING (item_id)
    WHERE i.cafe_id = p_cafe AND i.room IS NOT NULL AND c.place = 'floor'
      AND p_x BETWEEN i.x AND i.x + c.w - 1 AND p_y BETWEEN i.y AND i.y + c.h - 1)
$$;

-- Dá os presentes que ainda faltam (pode chamar sempre; só cria uma vez).
CREATE OR REPLACE FUNCTION public.coffee_house_gifts()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID; v_idx INTEGER; v_room TEXT; v_added INTEGER := 0; g RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT cafe_id INTO v_cafe FROM public.coffee_members WHERE user_id = auth.uid();
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'not a member of a cafe' USING ERRCODE = '42501'; END IF;
  -- trava o café para dois aparelhos não darem o mesmo presente ao mesmo tempo
  PERFORM 1 FROM public.coffee_cafes WHERE id = v_cafe FOR UPDATE;
  SELECT n - 1 INTO v_idx FROM (SELECT user_id, row_number() OVER (ORDER BY joined_at) n FROM public.coffee_members WHERE cafe_id = v_cafe) m
    WHERE user_id = auth.uid();
  v_idx := least(1, greatest(0, coalesce(v_idx, 0)));
  v_room := CASE v_idx WHEN 0 THEN 'bedroom0' ELSE 'bedroom1' END;

  FOR g IN
    SELECT * FROM (VALUES
      ('pc', 'computer', true, v_room, CASE v_idx WHEN 0 THEN 10 ELSE 22 END, 2),
      ('phone', 'telephone', true, v_room, CASE v_idx WHEN 0 THEN 9 ELSE 21 END, 2),
      ('tv', 'television', false, 'living', 3, 9),
      ('bookshelf', 'bookshelf', false, 'living', 11, 9)
    ) AS t(gift, item, personal, room, x, y)
  LOOP
    IF EXISTS (SELECT 1 FROM public.coffee_house_items WHERE cafe_id = v_cafe AND gift = g.gift AND (NOT g.personal OR owner_id = auth.uid())) THEN
      CONTINUE;
    END IF;
    IF public.coffee_house_tile_free(v_cafe, g.x, g.y) THEN
      INSERT INTO public.coffee_house_items (cafe_id, owner_id, item_id, room, x, y, gift, placed_by)
        VALUES (v_cafe, auth.uid(), g.item, g.room, g.x, g.y, g.gift, auth.uid());
    ELSE
      INSERT INTO public.coffee_house_items (cafe_id, owner_id, item_id, gift) VALUES (v_cafe, auth.uid(), g.item, g.gift);
    END IF;
    v_added := v_added + 1;
  END LOOP;
  RETURN v_added;
END $$;

-- Telefone: recado de agradecimento para a outra pessoa do café.
CREATE OR REPLACE FUNCTION public.coffee_send_note(p_body TEXT, p_heart BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID; v_to UUID; v_coins INTEGER; v_total INTEGER; v_body TEXT := btrim(coalesce(p_body, ''));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT cafe_id INTO v_cafe FROM public.coffee_members WHERE user_id = auth.uid();
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'not a member of a cafe' USING ERRCODE = '42501'; END IF;
  SELECT user_id INTO v_to FROM public.coffee_members WHERE cafe_id = v_cafe AND user_id <> auth.uid() LIMIT 1;
  IF v_to IS NULL THEN RAISE EXCEPTION 'nobody to call'; END IF;
  IF char_length(v_body) < 1 OR char_length(v_body) > 300 THEN RAISE EXCEPTION 'bad note'; END IF;

  INSERT INTO public.coffee_notes (cafe_id, from_user, to_user, body, heart) VALUES (v_cafe, auth.uid(), v_to, v_body, coalesce(p_heart, false));
  INSERT INTO public.coffee_activity (cafe_id, user_id, kind, data) VALUES (v_cafe, auth.uid(), 'note', jsonb_build_object('heart', coalesce(p_heart, false)));
  v_coins := public.coffee_daily_reward(auth.uid(), 'phone', 5);
  SELECT coins INTO v_total FROM public.coffee_players WHERE user_id = auth.uid();
  RETURN jsonb_build_object('coins', v_coins, 'total_coins', v_total);
END $$;

CREATE OR REPLACE FUNCTION public.coffee_read_notes()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  UPDATE public.coffee_notes SET read_at = now() WHERE to_user = auth.uid() AND read_at IS NULL;
END $$;

-- TV: terminou o episódio de escuta do dia.
CREATE OR REPLACE FUNCTION public.coffee_tv_reward(p_correct INTEGER, p_total INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_coins INTEGER; v_total INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.coffee_players WHERE user_id = auth.uid()) THEN RAISE EXCEPTION 'not a player'; END IF;
  v_coins := public.coffee_daily_reward(auth.uid(), 'tv',
    CASE WHEN greatest(0, coalesce(p_correct, 0)) * 2 >= greatest(1, coalesce(p_total, 1)) THEN 5 ELSE 2 END);
  SELECT coins INTO v_total FROM public.coffee_players WHERE user_id = auth.uid();
  RETURN jsonb_build_object('coins', v_coins, 'total_coins', v_total);
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_daily_reward(UUID, TEXT, INTEGER), public.coffee_house_tile_free(UUID, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.coffee_house_gifts(), public.coffee_send_note(TEXT, BOOLEAN), public.coffee_read_notes(),
  public.coffee_tv_reward(INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_house_gifts(), public.coffee_send_note(TEXT, BOOLEAN), public.coffee_read_notes(),
  public.coffee_tv_reward(INTEGER, INTEGER) TO authenticated;
