-- Coffee Cats: pescaria no lago do quintal. Só acrescenta.
--
-- 10 lançamentos grátis por dia (horário de Brasília) + iscas (compradas ou feitas com ingredientes
-- da horta). O peixe é sorteado aqui no lançamento; o app faz a pergunta com cronômetro e avisa se
-- pegou. Álbum compartilhado do café (quem pegou primeiro e quantos cada um pegou).
-- Mesmas regras de src/lib/coffee/fishing.ts (catálogo conferido por teste).

CREATE TABLE IF NOT EXISTS public.coffee_fish (
  fish_id TEXT PRIMARY KEY,
  rarity TEXT NOT NULL CHECK (rarity IN ('junk', 'common', 'uncommon', 'rare', 'legendary')),
  night BOOLEAN NOT NULL DEFAULT false,
  coins INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.coffee_fish ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_fish_read" ON public.coffee_fish FOR SELECT USING (auth.uid() IS NOT NULL);
REVOKE INSERT, UPDATE, DELETE ON public.coffee_fish FROM authenticated, anon;

CREATE TABLE IF NOT EXISTS public.coffee_fishing (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  free_day DATE,
  free_used INTEGER NOT NULL DEFAULT 0,
  bait INTEGER NOT NULL DEFAULT 0 CHECK (bait >= 0),
  lucky INTEGER NOT NULL DEFAULT 0 CHECK (lucky >= 0),
  fed_day DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coffee_fishing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_fishing_read_own" ON public.coffee_fishing FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_fishing FROM authenticated, anon;

CREATE TABLE IF NOT EXISTS public.coffee_fish_album (
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  fish_id TEXT NOT NULL REFERENCES public.coffee_fish(fish_id),
  first_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (cafe_id, fish_id)
);
ALTER TABLE public.coffee_fish_album ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_fish_album_read" ON public.coffee_fish_album FOR SELECT USING (cafe_id = public.coffee_my_cafe());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_fish_album FROM authenticated, anon;

-- lançamento pendente (o peixe sorteado espera a resposta do app por até 10 minutos)
CREATE TABLE IF NOT EXISTS public.coffee_fish_casts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fish_id TEXT NOT NULL REFERENCES public.coffee_fish(fish_id),
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coffee_fish_casts_user ON public.coffee_fish_casts (user_id, created_at DESC);
ALTER TABLE public.coffee_fish_casts ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.coffee_fish_casts FROM authenticated, anon;

ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_fish_album;

CREATE OR REPLACE FUNCTION public.coffee_fishing_row(p_user UUID)
RETURNS public.coffee_fishing LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_fishing; v_cafe UUID; v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  SELECT cafe_id INTO v_cafe FROM public.coffee_members WHERE user_id = p_user;
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'not a member of a cafe' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.coffee_fishing (user_id, cafe_id, free_day) VALUES (p_user, v_cafe, v_today) ON CONFLICT (user_id) DO NOTHING;
  -- dia novo: zera os lançamentos grátis usados
  UPDATE public.coffee_fishing SET free_day = v_today, free_used = 0 WHERE user_id = p_user AND (free_day IS NULL OR free_day < v_today);
  SELECT * INTO v_row FROM public.coffee_fishing WHERE user_id = p_user FOR UPDATE;
  RETURN v_row;
END $$;

-- Lançar a linha: gasta um lançamento grátis (ou uma isca) e sorteia o peixe.
CREATE OR REPLACE FUNCTION public.coffee_fish_cast(p_together BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_fishing; v_boost BOOLEAN; v_night BOOLEAN; v_hour INTEGER; v_roll FLOAT; v_total FLOAT;
  v_rarity TEXT; v_fish TEXT; v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  v_row := public.coffee_fishing_row(auth.uid());
  v_boost := coalesce(p_together, false) OR v_row.lucky > 0;
  IF v_row.free_used < 10 THEN
    UPDATE public.coffee_fishing SET free_used = free_used + 1, updated_at = now() WHERE user_id = auth.uid();
  ELSIF v_row.bait > 0 THEN
    UPDATE public.coffee_fishing SET bait = bait - 1, updated_at = now() WHERE user_id = auth.uid();
  ELSE
    RAISE EXCEPTION 'no bait';
  END IF;
  IF v_row.lucky > 0 THEN UPDATE public.coffee_fishing SET lucky = lucky - 1 WHERE user_id = auth.uid(); END IF;

  v_hour := extract(hour FROM now() AT TIME ZONE 'America/Sao_Paulo');
  v_night := v_hour >= 19 OR v_hour < 5;
  -- pesos: lixo 10 · comum 55 · incomum 25 · raro 8 · lendário 2 (raro/lendário ×1.5 com bônus)
  v_total := 10 + 55 + 25 + (8 + 2) * (CASE WHEN v_boost THEN 1.5 ELSE 1 END);
  v_roll := random() * v_total;
  v_rarity := CASE
    WHEN v_roll < 55 THEN 'common'
    WHEN v_roll < 80 THEN 'uncommon'
    WHEN v_roll < 80 + 8 * (CASE WHEN v_boost THEN 1.5 ELSE 1 END) THEN 'rare'
    WHEN v_roll < 80 + 10 * (CASE WHEN v_boost THEN 1.5 ELSE 1 END) THEN 'legendary'
    ELSE 'junk' END;
  SELECT fish_id INTO v_fish FROM public.coffee_fish WHERE rarity = v_rarity AND (v_night OR NOT night) ORDER BY random() LIMIT 1;
  INSERT INTO public.coffee_fish_casts (user_id, fish_id) VALUES (auth.uid(), v_fish) RETURNING id INTO v_id;
  RETURN jsonb_build_object('cast_id', v_id, 'fish_id', v_fish);
END $$;

-- Resultado do lançamento: pegou (acertou a pergunta) ou escapou. Lixo sempre vem.
CREATE OR REPLACE FUNCTION public.coffee_fish_catch(p_cast UUID, p_success BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cast public.coffee_fish_casts; v_fish public.coffee_fish; v_cafe UUID; v_first BOOLEAN := false; v_count INTEGER := 0; v_total INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_cast FROM public.coffee_fish_casts WHERE id = p_cast FOR UPDATE;
  IF v_cast.id IS NULL OR v_cast.user_id <> auth.uid() THEN RAISE EXCEPTION 'cast not found'; END IF;
  IF v_cast.done OR v_cast.created_at < now() - interval '10 minutes' THEN RAISE EXCEPTION 'cast expired'; END IF;
  UPDATE public.coffee_fish_casts SET done = true WHERE id = p_cast;
  SELECT * INTO v_fish FROM public.coffee_fish WHERE fish_id = v_cast.fish_id;
  SELECT cafe_id INTO v_cafe FROM public.coffee_members WHERE user_id = auth.uid();
  IF coalesce(p_success, false) OR v_fish.rarity = 'junk' THEN
    INSERT INTO public.coffee_fish_album (cafe_id, fish_id, first_by) VALUES (v_cafe, v_fish.fish_id, auth.uid())
      ON CONFLICT (cafe_id, fish_id) DO NOTHING;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_first := v_count > 0;
    UPDATE public.coffee_fish_album SET counts = jsonb_set(counts, ARRAY[auth.uid()::text], to_jsonb(coalesce((counts->>auth.uid()::text)::int, 0) + 1))
      WHERE cafe_id = v_cafe AND fish_id = v_fish.fish_id RETURNING (counts->>auth.uid()::text)::int INTO v_count;
    UPDATE public.coffee_players SET coins = coins + v_fish.coins, updated_at = now() WHERE user_id = auth.uid();
    IF v_fish.rarity = 'legendary' THEN
      INSERT INTO public.coffee_activity (cafe_id, user_id, kind, data) VALUES (v_cafe, auth.uid(), 'fish', jsonb_build_object('fish', v_fish.fish_id, 'first', v_first));
    END IF;
  ELSE
    v_count := 0;
  END IF;
  SELECT coins INTO v_total FROM public.coffee_players WHERE user_id = auth.uid();
  RETURN jsonb_build_object('coins', CASE WHEN coalesce(p_success, false) OR v_fish.rarity = 'junk' THEN v_fish.coins ELSE 0 END,
                            'total_coins', v_total, 'first', v_first, 'count', v_count);
END $$;

CREATE OR REPLACE FUNCTION public.coffee_fish_buy_bait(p_qty INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_qty INTEGER := least(20, greatest(1, coalesce(p_qty, 1))); v_player public.coffee_players; v_row public.coffee_fishing;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  v_row := public.coffee_fishing_row(auth.uid());
  SELECT * INTO v_player FROM public.coffee_players WHERE user_id = auth.uid() FOR UPDATE;
  IF v_player.coins < 2 * v_qty THEN RAISE EXCEPTION 'not enough coins'; END IF;
  UPDATE public.coffee_players SET coins = coins - 2 * v_qty, updated_at = now() WHERE user_id = auth.uid() RETURNING * INTO v_player;
  UPDATE public.coffee_fishing SET bait = bait + v_qty, updated_at = now() WHERE user_id = auth.uid();
  RETURN jsonb_build_object('total_coins', v_player.coins);
END $$;

-- Ingrediente da despensa vira isca: erva +1 · legume +3 · fruta +3 e 3 de sorte · dourada +5 e 5 de sorte.
CREATE OR REPLACE FUNCTION public.coffee_fish_bait_from_pantry(p_crop TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_garden public.coffee_garden; v_kind TEXT; v_have INTEGER; v_bait INTEGER; v_lucky INTEGER; v_row public.coffee_fishing;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT kind INTO v_kind FROM public.coffee_crops WHERE crop_id = p_crop;
  IF v_kind IS NULL THEN RAISE EXCEPTION 'unknown crop'; END IF;
  v_garden := public.coffee_garden_row(auth.uid());
  v_have := coalesce((v_garden.pantry->>p_crop)::int, 0);
  IF v_have < 1 THEN RAISE EXCEPTION 'not in pantry'; END IF;
  v_bait := CASE v_kind WHEN 'herb' THEN 1 WHEN 'veg' THEN 3 WHEN 'fruit' THEN 3 ELSE 5 END;
  v_lucky := CASE v_kind WHEN 'fruit' THEN 3 WHEN 'golden' THEN 5 ELSE 0 END;
  UPDATE public.coffee_garden SET pantry = jsonb_set(pantry, ARRAY[p_crop], to_jsonb(v_have - 1)), updated_at = now() WHERE user_id = auth.uid();
  v_row := public.coffee_fishing_row(auth.uid());
  UPDATE public.coffee_fishing SET bait = bait + v_bait, lucky = lucky + v_lucky, updated_at = now() WHERE user_id = auth.uid();
  RETURN jsonb_build_object('bait', v_bait, 'lucky', v_lucky);
END $$;

-- Dar um peixinho para a Mucego (uma vez por dia): +2 XP.
CREATE OR REPLACE FUNCTION public.coffee_fish_feed_mucego()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_fishing; v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  v_row := public.coffee_fishing_row(auth.uid());
  IF v_row.fed_day IS NOT NULL AND v_row.fed_day >= v_today THEN RETURN jsonb_build_object('xp', 0); END IF;
  UPDATE public.coffee_fishing SET fed_day = v_today, updated_at = now() WHERE user_id = auth.uid();
  UPDATE public.coffee_players SET xp = xp + 2, updated_at = now() WHERE user_id = auth.uid();
  RETURN jsonb_build_object('xp', 2);
END $$;

-- Estado da pescaria de quem chama (cria a linha e vira o dia).
CREATE OR REPLACE FUNCTION public.coffee_fishing_state()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_fishing; v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  v_row := public.coffee_fishing_row(auth.uid());
  RETURN jsonb_build_object('free_left', greatest(0, 10 - v_row.free_used), 'bait', v_row.bait, 'lucky', v_row.lucky,
                            'fed_today', v_row.fed_day IS NOT NULL AND v_row.fed_day >= v_today);
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_fishing_row(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.coffee_fish_cast(BOOLEAN), public.coffee_fish_catch(UUID, BOOLEAN), public.coffee_fish_buy_bait(INTEGER),
  public.coffee_fish_bait_from_pantry(TEXT), public.coffee_fish_feed_mucego(), public.coffee_fishing_state() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_fish_cast(BOOLEAN), public.coffee_fish_catch(UUID, BOOLEAN), public.coffee_fish_buy_bait(INTEGER),
  public.coffee_fish_bait_from_pantry(TEXT), public.coffee_fish_feed_mucego(), public.coffee_fishing_state() TO authenticated;

-- Catálogo (peixe, raridade, só à noite, moedas)
INSERT INTO public.coffee_fish (fish_id, rarity, night, coins) VALUES
  ('minnow', 'common', false, 2),
  ('perch', 'common', false, 2),
  ('carp', 'common', false, 2),
  ('sunfish', 'common', false, 2),
  ('bluegill', 'common', false, 2),
  ('tilapia', 'common', false, 2),
  ('goldfish', 'common', false, 2),
  ('frog', 'common', false, 2),
  ('trout', 'uncommon', false, 5),
  ('bass', 'uncommon', false, 5),
  ('pike', 'uncommon', false, 5),
  ('salmon', 'uncommon', false, 5),
  ('crayfish', 'uncommon', false, 5),
  ('tadpole', 'uncommon', false, 5),
  ('catfish', 'uncommon', true, 5),
  ('walleye', 'uncommon', true, 5),
  ('koi', 'rare', false, 12),
  ('sturgeon', 'rare', false, 12),
  ('turtle', 'rare', false, 12),
  ('axolotl', 'rare', false, 12),
  ('rainbow_trout', 'rare', false, 12),
  ('eel', 'rare', true, 12),
  ('golden_koi', 'legendary', false, 40),
  ('lake_king', 'legendary', true, 40),
  ('moonfish', 'legendary', true, 40),
  ('old_boot', 'junk', false, 0),
  ('tin_can', 'junk', false, 0),
  ('rubber_duck', 'junk', false, 0),
  ('lost_sock', 'junk', false, 0),
  ('message_bottle', 'junk', false, 0)
ON CONFLICT (fish_id) DO UPDATE SET rarity = EXCLUDED.rarity, night = EXCLUDED.night, coins = EXCLUDED.coins;
