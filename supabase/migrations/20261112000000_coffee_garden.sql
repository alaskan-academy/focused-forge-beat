-- Coffee Cats: horta no quintal. Só acrescenta.
--
-- Cada pessoa tem 6 canteiros (compra até 12). Sementes: 3 grátis por dia + barraquinha.
-- Cada planta traz uma palavra (item do SRS) e cresce em 3 estágios; cada estágio precisa de
-- água (regar = exercício no app). Regada a tempo, cresce quando o tempo do estágio acaba; regada
-- atrasada, cresce na hora. Qualquer um rega (regar a planta da outra pessoa dá +2 XP); só o dono colhe.
-- Mesmas regras de src/lib/coffee/garden.ts (catálogo conferido por teste).

CREATE TABLE IF NOT EXISTS public.coffee_crops (
  crop_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('herb', 'veg', 'fruit', 'golden')),
  stage_minutes INTEGER NOT NULL,
  coins INTEGER NOT NULL,
  price INTEGER NOT NULL,
  min_level INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE public.coffee_crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_crops_read" ON public.coffee_crops FOR SELECT USING (auth.uid() IS NOT NULL);
REVOKE INSERT, UPDATE, DELETE ON public.coffee_crops FROM authenticated, anon;

CREATE TABLE IF NOT EXISTS public.coffee_garden (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  plots INTEGER NOT NULL DEFAULT 6 CHECK (plots BETWEEN 6 AND 12),
  seeds JSONB NOT NULL DEFAULT '{}'::jsonb,
  pantry JSONB NOT NULL DEFAULT '{}'::jsonb,
  seed_day DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coffee_garden ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_garden_read" ON public.coffee_garden FOR SELECT USING (cafe_id = public.coffee_my_cafe());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_garden FROM authenticated, anon;

CREATE TABLE IF NOT EXISTS public.coffee_garden_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plot INTEGER NOT NULL CHECK (plot BETWEEN 0 AND 11),
  crop_id TEXT NOT NULL REFERENCES public.coffee_crops(crop_id),
  item_id TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 0 CHECK (stage BETWEEN 0 AND 3),
  stage_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  watered BOOLEAN NOT NULL DEFAULT false,
  last_watered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  planted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, plot)
);
CREATE INDEX IF NOT EXISTS coffee_garden_plants_cafe ON public.coffee_garden_plants (cafe_id);
ALTER TABLE public.coffee_garden_plants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_garden_plants_read" ON public.coffee_garden_plants FOR SELECT USING (cafe_id = public.coffee_my_cafe());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_garden_plants FROM authenticated, anon;

ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_garden, public.coffee_garden_plants;

-- Garante a linha da horta de quem chama (uso interno).
CREATE OR REPLACE FUNCTION public.coffee_garden_row(p_user UUID)
RETURNS public.coffee_garden LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_garden; v_cafe UUID;
BEGIN
  SELECT cafe_id INTO v_cafe FROM public.coffee_members WHERE user_id = p_user;
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'not a member of a cafe' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.coffee_garden (user_id, cafe_id) VALUES (p_user, v_cafe) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_row FROM public.coffee_garden WHERE user_id = p_user FOR UPDATE;
  RETURN v_row;
END $$;

-- Cresce sozinha se foi regada e o tempo do estágio acabou (uso interno; mesma conta de plantNow).
CREATE OR REPLACE FUNCTION public.coffee_garden_grow(p_id UUID)
RETURNS public.coffee_garden_plants LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_p public.coffee_garden_plants; v_dur INTERVAL;
BEGIN
  SELECT * INTO v_p FROM public.coffee_garden_plants WHERE id = p_id FOR UPDATE;
  IF v_p.id IS NULL THEN RAISE EXCEPTION 'plant not found'; END IF;
  SELECT make_interval(mins => stage_minutes) INTO v_dur FROM public.coffee_crops WHERE crop_id = v_p.crop_id;
  IF v_p.stage < 3 AND v_p.watered AND now() >= v_p.stage_started_at + v_dur THEN
    UPDATE public.coffee_garden_plants SET stage = stage + 1, stage_started_at = stage_started_at + v_dur, watered = false
      WHERE id = p_id RETURNING * INTO v_p;
  END IF;
  RETURN v_p;
END $$;

-- Abre a horta: cria a linha e dá as 3 sementes grátis do dia (uma vez por dia, horário de Brasília).
CREATE OR REPLACE FUNCTION public.coffee_garden_daily()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_garden; v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_level INTEGER;
  v_given TEXT[] := '{}'; v_crop TEXT; v_roll FLOAT; i INTEGER; v_seeds JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  v_row := public.coffee_garden_row(auth.uid());
  IF v_row.seed_day IS NOT NULL AND v_row.seed_day >= v_today THEN
    RETURN jsonb_build_object('given', '[]'::jsonb);
  END IF;
  SELECT public.coffee_level(xp) INTO v_level FROM public.coffee_players WHERE user_id = auth.uid();
  v_seeds := v_row.seeds;
  FOR i IN 1..3 LOOP
    v_roll := random();
    IF i = 3 AND v_level >= 5 AND v_roll < 0.08 THEN
      SELECT crop_id INTO v_crop FROM public.coffee_crops WHERE kind = 'golden' ORDER BY random() LIMIT 1;
    ELSIF i = 3 AND v_level >= 3 AND v_roll < 0.4 THEN
      SELECT crop_id INTO v_crop FROM public.coffee_crops WHERE kind = 'fruit' ORDER BY random() LIMIT 1;
    ELSE
      SELECT crop_id INTO v_crop FROM public.coffee_crops WHERE kind IN ('herb', 'veg') ORDER BY random() LIMIT 1;
    END IF;
    v_seeds := jsonb_set(v_seeds, ARRAY[v_crop], to_jsonb(coalesce((v_seeds->>v_crop)::int, 0) + 1));
    v_given := v_given || v_crop;
  END LOOP;
  UPDATE public.coffee_garden SET seeds = v_seeds, seed_day = v_today, updated_at = now() WHERE user_id = auth.uid();
  RETURN jsonb_build_object('given', to_jsonb(v_given));
END $$;

CREATE OR REPLACE FUNCTION public.coffee_garden_buy_seed(p_crop TEXT, p_qty INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_garden; v_crop public.coffee_crops; v_player public.coffee_players; v_qty INTEGER := least(10, greatest(1, coalesce(p_qty, 1)));
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_crop FROM public.coffee_crops WHERE crop_id = p_crop;
  IF v_crop.crop_id IS NULL THEN RAISE EXCEPTION 'unknown crop'; END IF;
  SELECT * INTO v_player FROM public.coffee_players WHERE user_id = auth.uid() FOR UPDATE;
  IF public.coffee_level(v_player.xp) < v_crop.min_level THEN RAISE EXCEPTION 'level too low'; END IF;
  IF v_player.coins < v_crop.price * v_qty THEN RAISE EXCEPTION 'not enough coins'; END IF;
  v_row := public.coffee_garden_row(auth.uid());
  UPDATE public.coffee_players SET coins = coins - v_crop.price * v_qty, updated_at = now() WHERE user_id = auth.uid() RETURNING * INTO v_player;
  UPDATE public.coffee_garden SET seeds = jsonb_set(seeds, ARRAY[p_crop], to_jsonb(coalesce((seeds->>p_crop)::int, 0) + v_qty)), updated_at = now()
    WHERE user_id = auth.uid();
  RETURN jsonb_build_object('total_coins', v_player.coins);
END $$;

CREATE OR REPLACE FUNCTION public.coffee_garden_plant(p_plot INTEGER, p_crop TEXT, p_item TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_garden; v_have INTEGER; v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  IF p_item IS NULL OR char_length(p_item) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'bad word'; END IF;
  v_row := public.coffee_garden_row(auth.uid());
  IF p_plot < 0 OR p_plot >= v_row.plots THEN RAISE EXCEPTION 'plot locked'; END IF;
  IF EXISTS (SELECT 1 FROM public.coffee_garden_plants WHERE owner_id = auth.uid() AND plot = p_plot) THEN RAISE EXCEPTION 'plot busy'; END IF;
  v_have := coalesce((v_row.seeds->>p_crop)::int, 0);
  IF v_have < 1 THEN RAISE EXCEPTION 'no seeds'; END IF;
  UPDATE public.coffee_garden SET seeds = jsonb_set(seeds, ARRAY[p_crop], to_jsonb(v_have - 1)), updated_at = now() WHERE user_id = auth.uid();
  INSERT INTO public.coffee_garden_plants (cafe_id, owner_id, plot, crop_id, item_id) VALUES (v_row.cafe_id, auth.uid(), p_plot, p_crop, p_item)
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Regar (qualquer membro do café). Atrasada: cresce na hora. A tempo: cresce quando o estágio acabar.
CREATE OR REPLACE FUNCTION public.coffee_garden_water(p_plant UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_p public.coffee_garden_plants; v_dur INTERVAL; v_xp INTEGER := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  v_p := public.coffee_garden_grow(p_plant);
  PERFORM public.coffee_require_member(v_p.cafe_id);
  IF v_p.stage >= 3 OR v_p.watered THEN
    RETURN jsonb_build_object('stage', v_p.stage, 'watered', v_p.watered, 'changed', false, 'xp', 0);
  END IF;
  SELECT make_interval(mins => stage_minutes) INTO v_dur FROM public.coffee_crops WHERE crop_id = v_p.crop_id;
  IF now() >= v_p.stage_started_at + v_dur THEN
    UPDATE public.coffee_garden_plants SET stage = stage + 1, stage_started_at = now(), watered = false, last_watered_by = auth.uid()
      WHERE id = p_plant RETURNING * INTO v_p;
  ELSE
    UPDATE public.coffee_garden_plants SET watered = true, last_watered_by = auth.uid() WHERE id = p_plant RETURNING * INTO v_p;
  END IF;
  IF v_p.owner_id <> auth.uid() THEN
    v_xp := 2;
    UPDATE public.coffee_players SET xp = xp + v_xp, updated_at = now() WHERE user_id = auth.uid();
  END IF;
  RETURN jsonb_build_object('stage', v_p.stage, 'watered', v_p.watered, 'changed', true, 'xp', v_xp);
END $$;

-- Colher (só o dono, planta pronta): moedas + ingrediente na despensa.
CREATE OR REPLACE FUNCTION public.coffee_garden_harvest(p_plant UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_p public.coffee_garden_plants; v_crop public.coffee_crops; v_total INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  v_p := public.coffee_garden_grow(p_plant);
  IF v_p.owner_id <> auth.uid() THEN RAISE EXCEPTION 'not your plant' USING ERRCODE = '42501'; END IF;
  IF v_p.stage < 3 THEN RAISE EXCEPTION 'not ready'; END IF;
  SELECT * INTO v_crop FROM public.coffee_crops WHERE crop_id = v_p.crop_id;
  DELETE FROM public.coffee_garden_plants WHERE id = p_plant;
  UPDATE public.coffee_players SET coins = coins + v_crop.coins, updated_at = now() WHERE user_id = auth.uid() RETURNING coins INTO v_total;
  UPDATE public.coffee_garden SET pantry = jsonb_set(pantry, ARRAY[v_crop.crop_id], to_jsonb(coalesce((pantry->>v_crop.crop_id)::int, 0) + 1)), updated_at = now()
    WHERE user_id = auth.uid();
  IF v_crop.kind = 'golden' THEN
    INSERT INTO public.coffee_activity (cafe_id, user_id, kind, data) VALUES (v_p.cafe_id, auth.uid(), 'harvest', jsonb_build_object('crop', v_crop.crop_id));
  END IF;
  RETURN jsonb_build_object('coins', v_crop.coins, 'total_coins', v_total, 'crop', v_crop.crop_id, 'item', v_p.item_id);
END $$;

-- Canteiro extra: 7º = 30 🪙, 8º = 40 … 12º = 80.
CREATE OR REPLACE FUNCTION public.coffee_garden_buy_plot()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.coffee_garden; v_price INTEGER; v_player public.coffee_players;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  v_row := public.coffee_garden_row(auth.uid());
  IF v_row.plots >= 12 THEN RAISE EXCEPTION 'max plots'; END IF;
  v_price := 30 + 10 * (v_row.plots - 6);
  SELECT * INTO v_player FROM public.coffee_players WHERE user_id = auth.uid() FOR UPDATE;
  IF v_player.coins < v_price THEN RAISE EXCEPTION 'not enough coins'; END IF;
  UPDATE public.coffee_players SET coins = coins - v_price, updated_at = now() WHERE user_id = auth.uid() RETURNING * INTO v_player;
  UPDATE public.coffee_garden SET plots = plots + 1, updated_at = now() WHERE user_id = auth.uid();
  RETURN jsonb_build_object('plots', v_row.plots + 1, 'total_coins', v_player.coins);
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_garden_row(UUID), public.coffee_garden_grow(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.coffee_garden_daily(), public.coffee_garden_buy_seed(TEXT, INTEGER), public.coffee_garden_plant(INTEGER, TEXT, TEXT),
  public.coffee_garden_water(UUID), public.coffee_garden_harvest(UUID), public.coffee_garden_buy_plot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_garden_daily(), public.coffee_garden_buy_seed(TEXT, INTEGER), public.coffee_garden_plant(INTEGER, TEXT, TEXT),
  public.coffee_garden_water(UUID), public.coffee_garden_harvest(UUID), public.coffee_garden_buy_plot() TO authenticated;

-- Catálogo (planta, tipo, minutos por estágio, moedas na colheita, preço da semente, nível mínimo)
INSERT INTO public.coffee_crops (crop_id, kind, stage_minutes, coins, price, min_level) VALUES
  ('basil', 'herb', 20, 3, 2, 1),
  ('mint', 'herb', 20, 3, 2, 1),
  ('parsley', 'herb', 20, 3, 2, 1),
  ('rosemary', 'herb', 20, 3, 2, 1),
  ('carrot', 'veg', 80, 6, 4, 1),
  ('tomato', 'veg', 80, 6, 4, 1),
  ('lettuce', 'veg', 80, 6, 4, 1),
  ('pumpkin', 'veg', 80, 6, 4, 1),
  ('corn', 'veg', 80, 6, 4, 1),
  ('strawberry', 'fruit', 240, 10, 8, 3),
  ('blueberry', 'fruit', 240, 10, 8, 3),
  ('sunflower', 'fruit', 240, 10, 8, 3),
  ('watermelon', 'fruit', 240, 10, 8, 3),
  ('golden_apple', 'golden', 480, 20, 30, 5)
ON CONFLICT (crop_id) DO UPDATE SET kind = EXCLUDED.kind, stage_minutes = EXCLUDED.stage_minutes, coins = EXCLUDED.coins,
  price = EXCLUDED.price, min_level = EXCLUDED.min_level;
