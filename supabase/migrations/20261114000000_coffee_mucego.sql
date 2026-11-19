-- Coffee Cats: Mucego Frutífero (amizade, comida, tapinha na bundinha, presentes), lojinha do jardim
-- (acessórios, petiscos, brinquedos, decoração) e decorar o quintal. Só acrescenta.
-- Mesmas regras de src/lib/coffee/mucego.ts e src/lib/coffee/gardenItems.ts (catálogo conferido por teste).

CREATE TABLE IF NOT EXISTS public.coffee_garden_catalog (
  item_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('accessory', 'treat', 'toy', 'decor')),
  price INTEGER NOT NULL CHECK (price >= 0),
  min_level INTEGER NOT NULL DEFAULT 1,
  place TEXT NOT NULL CHECK (place IN ('floor', 'flat')),
  w INTEGER NOT NULL DEFAULT 1,
  h INTEGER NOT NULL DEFAULT 1,
  friendship INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.coffee_garden_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_garden_catalog_read" ON public.coffee_garden_catalog FOR SELECT USING (auth.uid() IS NOT NULL);
REVOKE INSERT, UPDATE, DELETE ON public.coffee_garden_catalog FROM authenticated, anon;

-- a Mucego é do café (os dois cuidam juntos)
CREATE TABLE IF NOT EXISTS public.coffee_mucego (
  cafe_id UUID PRIMARY KEY REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  friendship INTEGER NOT NULL DEFAULT 0 CHECK (friendship >= 0),
  accessory TEXT,
  accessories TEXT[] NOT NULL DEFAULT '{}',
  request_day DATE, -- dia em que o pedido foi atendido
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coffee_mucego ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_mucego_read" ON public.coffee_mucego FOR SELECT USING (cafe_id = public.coffee_my_cafe());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_mucego FROM authenticated, anon;

CREATE TABLE IF NOT EXISTS public.coffee_mucego_user (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  last_pet_at TIMESTAMPTZ,
  feed_day DATE,
  feeds INTEGER NOT NULL DEFAULT 0,
  treats JSONB NOT NULL DEFAULT '{}'::jsonb,
  gift_day DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coffee_mucego_user ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_mucego_user_read_own" ON public.coffee_mucego_user FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_mucego_user FROM authenticated, anon;

CREATE TABLE IF NOT EXISTS public.coffee_garden_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.coffee_garden_catalog(item_id),
  placed BOOLEAN NOT NULL DEFAULT false,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  flip BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coffee_garden_items_cafe ON public.coffee_garden_items (cafe_id);
ALTER TABLE public.coffee_garden_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_garden_items_read" ON public.coffee_garden_items FOR SELECT USING (cafe_id = public.coffee_my_cafe());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_garden_items FROM authenticated, anon;

ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_mucego, public.coffee_garden_items;

-- linhas da Mucego (do café) e de quem chama (uso interno)
CREATE OR REPLACE FUNCTION public.coffee_mucego_rows(p_user UUID, OUT m public.coffee_mucego, OUT u public.coffee_mucego_user)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID; v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  SELECT cafe_id INTO v_cafe FROM public.coffee_members WHERE user_id = p_user;
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'not a member of a cafe' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.coffee_mucego (cafe_id) VALUES (v_cafe) ON CONFLICT (cafe_id) DO NOTHING;
  INSERT INTO public.coffee_mucego_user (user_id, cafe_id) VALUES (p_user, v_cafe) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.coffee_mucego_user SET feed_day = v_today, feeds = 0 WHERE user_id = p_user AND (feed_day IS NULL OR feed_day < v_today);
  SELECT * INTO m FROM public.coffee_mucego WHERE cafe_id = v_cafe FOR UPDATE;
  SELECT * INTO u FROM public.coffee_mucego_user WHERE user_id = p_user FOR UPDATE;
END $$;

-- pedido do dia: dia do ano % 8 (mesma ordem de WANTS em src/lib/coffee/mucego.ts)
CREATE OR REPLACE FUNCTION public.coffee_mucego_wants(p_day DATE)
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT (ARRAY[
    ARRAY['strawberry', 'watermelon', '', ''],
    ARRAY['carrot', 'pumpkin', '', ''],
    ARRAY['lettuce', 'basil', 'mint', 'parsley'],
    ARRAY['blueberry', '', '', ''],
    ARRAY['corn', 'sunflower', '', ''],
    ARRAY['watermelon', 'pumpkin', '', ''],
    ARRAY['rosemary', 'mint', 'basil', ''],
    ARRAY['tomato', 'lettuce', '', '']
  ])[(extract(doy FROM p_day)::int % 8) + 1:(extract(doy FROM p_day)::int % 8) + 1][1:4]
$$;

CREATE OR REPLACE FUNCTION public.coffee_mucego_state()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.coffee_mucego_rows(auth.uid());
  RETURN jsonb_build_object(
    'friendship', (r.m).friendship, 'accessory', (r.m).accessory, 'accessories', to_jsonb((r.m).accessories),
    'request_done', (r.m).request_day IS NOT NULL AND (r.m).request_day >= v_today,
    'last_pet_at', (r.u).last_pet_at, 'feeds_today', (r.u).feeds, 'treats', (r.u).treats,
    'gift_ready', (r.m).friendship >= 30 AND ((r.u).gift_day IS NULL OR (r.u).gift_day < v_today));
END $$;

-- Tapinha na bundinha: uma vez por hora (cada um), +1 de amizade.
CREATE OR REPLACE FUNCTION public.coffee_mucego_pet()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_f INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.coffee_mucego_rows(auth.uid());
  IF (r.u).last_pet_at IS NOT NULL AND (r.u).last_pet_at > now() - interval '60 minutes' THEN
    RETURN jsonb_build_object('ok', false, 'friendship', (r.m).friendship);
  END IF;
  UPDATE public.coffee_mucego_user SET last_pet_at = now(), updated_at = now() WHERE user_id = auth.uid();
  UPDATE public.coffee_mucego SET friendship = least(150, friendship + 1), updated_at = now() WHERE cafe_id = (r.m).cafe_id RETURNING friendship INTO v_f;
  RETURN jsonb_build_object('ok', true, 'friendship', v_f);
END $$;

-- Dar comida da despensa (até 5 por dia cada um): fruta +3, legume/erva +1, dourada +5.
-- Se for o pedido do dia (e ninguém atendeu ainda): +5 de amizade e +5 🪙.
CREATE OR REPLACE FUNCTION public.coffee_mucego_feed(p_crop TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_kind TEXT; v_garden public.coffee_garden; v_have INTEGER; v_gain INTEGER; v_req BOOLEAN := false; v_coins INTEGER := 0;
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_f INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT kind INTO v_kind FROM public.coffee_crops WHERE crop_id = p_crop;
  IF v_kind IS NULL THEN RAISE EXCEPTION 'unknown crop'; END IF;
  SELECT * INTO r FROM public.coffee_mucego_rows(auth.uid());
  IF (r.u).feeds >= 5 THEN RAISE EXCEPTION 'she is full'; END IF;
  v_garden := public.coffee_garden_row(auth.uid());
  v_have := coalesce((v_garden.pantry->>p_crop)::int, 0);
  IF v_have < 1 THEN RAISE EXCEPTION 'not in pantry'; END IF;
  UPDATE public.coffee_garden SET pantry = jsonb_set(pantry, ARRAY[p_crop], to_jsonb(v_have - 1)), updated_at = now() WHERE user_id = auth.uid();
  v_gain := CASE v_kind WHEN 'fruit' THEN 3 WHEN 'golden' THEN 5 ELSE 1 END;
  IF p_crop = ANY (public.coffee_mucego_wants(v_today)) AND ((r.m).request_day IS NULL OR (r.m).request_day < v_today) THEN
    v_req := true;
    v_gain := v_gain + 5;
    v_coins := 5;
    UPDATE public.coffee_players SET coins = coins + 5, updated_at = now() WHERE user_id = auth.uid();
  END IF;
  UPDATE public.coffee_mucego_user SET feeds = feeds + 1, updated_at = now() WHERE user_id = auth.uid();
  UPDATE public.coffee_mucego SET friendship = least(150, friendship + v_gain), request_day = CASE WHEN v_req THEN v_today ELSE request_day END, updated_at = now()
    WHERE cafe_id = (r.m).cafe_id RETURNING friendship INTO v_f;
  RETURN jsonb_build_object('friendship', v_f, 'gain', v_gain, 'request', v_req, 'coins', v_coins);
END $$;

CREATE OR REPLACE FUNCTION public.coffee_mucego_treat(p_treat TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_have INTEGER; v_gain INTEGER; v_f INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT friendship INTO v_gain FROM public.coffee_garden_catalog WHERE item_id = p_treat AND kind = 'treat';
  IF v_gain IS NULL THEN RAISE EXCEPTION 'unknown treat'; END IF;
  SELECT * INTO r FROM public.coffee_mucego_rows(auth.uid());
  v_have := coalesce(((r.u).treats->>p_treat)::int, 0);
  IF v_have < 1 THEN RAISE EXCEPTION 'no treats'; END IF;
  UPDATE public.coffee_mucego_user SET treats = jsonb_set(treats, ARRAY[p_treat], to_jsonb(v_have - 1)), updated_at = now() WHERE user_id = auth.uid();
  UPDATE public.coffee_mucego SET friendship = least(150, friendship + v_gain), updated_at = now() WHERE cafe_id = (r.m).cafe_id RETURNING friendship INTO v_f;
  RETURN jsonb_build_object('friendship', v_f, 'gain', v_gain);
END $$;

-- Presente do dia (amizade 30+): uma semente; 60+ fruta; 100+ dourada.
CREATE OR REPLACE FUNCTION public.coffee_mucego_gift()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_crop TEXT; v_garden public.coffee_garden;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.coffee_mucego_rows(auth.uid());
  IF (r.m).friendship < 30 OR ((r.u).gift_day IS NOT NULL AND (r.u).gift_day >= v_today) THEN RAISE EXCEPTION 'no gift today'; END IF;
  SELECT crop_id INTO v_crop FROM public.coffee_crops
    WHERE kind = CASE WHEN (r.m).friendship >= 100 THEN 'golden' WHEN (r.m).friendship >= 60 THEN 'fruit' ELSE 'veg' END ORDER BY random() LIMIT 1;
  v_garden := public.coffee_garden_row(auth.uid());
  UPDATE public.coffee_garden SET seeds = jsonb_set(seeds, ARRAY[v_crop], to_jsonb(coalesce((seeds->>v_crop)::int, 0) + 1)), updated_at = now() WHERE user_id = auth.uid();
  UPDATE public.coffee_mucego_user SET gift_day = v_today, updated_at = now() WHERE user_id = auth.uid();
  RETURN jsonb_build_object('crop', v_crop);
END $$;

-- Comprar na lojinha do jardim: acessório (do café), petisco (meu) ou item (vai para a minha mochila).
CREATE OR REPLACE FUNCTION public.coffee_garden_buy(p_item TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cat public.coffee_garden_catalog; v_player public.coffee_players; r RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_cat FROM public.coffee_garden_catalog WHERE item_id = p_item;
  IF v_cat.item_id IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  SELECT * INTO v_player FROM public.coffee_players WHERE user_id = auth.uid() FOR UPDATE;
  IF public.coffee_level(v_player.xp) < v_cat.min_level THEN RAISE EXCEPTION 'level too low'; END IF;
  IF v_player.coins < v_cat.price THEN RAISE EXCEPTION 'not enough coins'; END IF;
  SELECT * INTO r FROM public.coffee_mucego_rows(auth.uid());
  IF v_cat.kind = 'accessory' AND p_item = ANY ((r.m).accessories) THEN RAISE EXCEPTION 'already owned'; END IF;
  UPDATE public.coffee_players SET coins = coins - v_cat.price, updated_at = now() WHERE user_id = auth.uid() RETURNING * INTO v_player;
  IF v_cat.kind = 'accessory' THEN
    UPDATE public.coffee_mucego SET accessories = array_append(accessories, p_item), updated_at = now() WHERE cafe_id = (r.m).cafe_id;
  ELSIF v_cat.kind = 'treat' THEN
    UPDATE public.coffee_mucego_user SET treats = jsonb_set(treats, ARRAY[p_item], to_jsonb(coalesce((treats->>p_item)::int, 0) + 1)), updated_at = now()
      WHERE user_id = auth.uid();
  ELSE
    INSERT INTO public.coffee_garden_items (cafe_id, owner_id, item_id) VALUES ((r.m).cafe_id, auth.uid(), p_item);
  END IF;
  RETURN jsonb_build_object('total_coins', v_player.coins);
END $$;

CREATE OR REPLACE FUNCTION public.coffee_mucego_wear(p_accessory TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.coffee_mucego_rows(auth.uid());
  IF p_accessory IS NOT NULL AND NOT (p_accessory = ANY ((r.m).accessories)) THEN RAISE EXCEPTION 'not owned'; END IF;
  UPDATE public.coffee_mucego SET accessory = p_accessory, updated_at = now() WHERE cafe_id = (r.m).cafe_id;
END $$;

-- Colocar/mover um item no jardim (o app confere a passagem; aqui só os limites do mapa e quem pode).
CREATE OR REPLACE FUNCTION public.coffee_garden_item_place(p_id UUID, p_x INTEGER, p_y INTEGER, p_flip BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_it public.coffee_garden_items; v_cat public.coffee_garden_catalog;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_it FROM public.coffee_garden_items WHERE id = p_id FOR UPDATE;
  IF v_it.id IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;
  PERFORM public.coffee_require_member(v_it.cafe_id);
  IF NOT v_it.placed AND v_it.owner_id <> auth.uid() THEN RAISE EXCEPTION 'not your item' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_cat FROM public.coffee_garden_catalog WHERE item_id = v_it.item_id;
  IF p_x < 1 OR p_y < 1 OR p_x + v_cat.w - 1 > 22 OR p_y + v_cat.h - 1 > 14 THEN RAISE EXCEPTION 'out of the garden'; END IF;
  UPDATE public.coffee_garden_items SET placed = true, x = p_x, y = p_y, flip = coalesce(p_flip, false), updated_at = now() WHERE id = p_id;
END $$;

CREATE OR REPLACE FUNCTION public.coffee_garden_item_store(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_it public.coffee_garden_items;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_it FROM public.coffee_garden_items WHERE id = p_id FOR UPDATE;
  IF v_it.id IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;
  PERFORM public.coffee_require_member(v_it.cafe_id);
  IF NOT v_it.placed AND v_it.owner_id <> auth.uid() THEN RAISE EXCEPTION 'not your item' USING ERRCODE = '42501'; END IF;
  UPDATE public.coffee_garden_items SET placed = false, updated_at = now() WHERE id = p_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_mucego_rows(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.coffee_mucego_state(), public.coffee_mucego_pet(), public.coffee_mucego_feed(TEXT), public.coffee_mucego_treat(TEXT),
  public.coffee_mucego_gift(), public.coffee_garden_buy(TEXT), public.coffee_mucego_wear(TEXT), public.coffee_garden_item_place(UUID, INTEGER, INTEGER, BOOLEAN),
  public.coffee_garden_item_store(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_mucego_state(), public.coffee_mucego_pet(), public.coffee_mucego_feed(TEXT), public.coffee_mucego_treat(TEXT),
  public.coffee_mucego_gift(), public.coffee_garden_buy(TEXT), public.coffee_mucego_wear(TEXT), public.coffee_garden_item_place(UUID, INTEGER, INTEGER, BOOLEAN),
  public.coffee_garden_item_store(UUID) TO authenticated;

-- Catálogo (item, tipo, preço, nível mínimo, lugar, largura, altura, amizade)
INSERT INTO public.coffee_garden_catalog (item_id, kind, price, min_level, place, w, h, friendship) VALUES
  ('red_bow', 'accessory', 15, 1, 'floor', 1, 1, 0),
  ('pink_bow', 'accessory', 15, 1, 'floor', 1, 1, 0),
  ('blue_bow', 'accessory', 15, 1, 'floor', 1, 1, 0),
  ('bell_collar', 'accessory', 25, 1, 'floor', 1, 1, 0),
  ('bandana', 'accessory', 25, 1, 'floor', 1, 1, 0),
  ('scarf', 'accessory', 35, 1, 'floor', 1, 1, 0),
  ('flower_crown', 'accessory', 40, 3, 'floor', 1, 1, 0),
  ('straw_hat', 'accessory', 45, 3, 'floor', 1, 1, 0),
  ('sunglasses', 'accessory', 50, 3, 'floor', 1, 1, 0),
  ('witch_hat', 'accessory', 60, 5, 'floor', 1, 1, 0),
  ('santa_hat', 'accessory', 60, 5, 'floor', 1, 1, 0),
  ('golden_crown', 'accessory', 300, 8, 'floor', 1, 1, 0),
  ('cat_cookie', 'treat', 3, 1, 'floor', 1, 1, 1),
  ('dried_fish', 'treat', 5, 1, 'floor', 1, 1, 2),
  ('cat_pouch', 'treat', 6, 1, 'floor', 1, 1, 3),
  ('catnip', 'treat', 8, 1, 'floor', 1, 1, 4),
  ('yarn_ball', 'toy', 15, 1, 'flat', 1, 1, 0),
  ('toy_mouse', 'toy', 15, 1, 'flat', 1, 1, 0),
  ('feather_toy', 'toy', 20, 1, 'flat', 1, 1, 0),
  ('food_bowl', 'toy', 12, 1, 'flat', 1, 1, 0),
  ('water_bowl', 'toy', 12, 1, 'flat', 1, 1, 0),
  ('sunny_cushion', 'toy', 25, 1, 'flat', 1, 1, 0),
  ('cat_bed_garden', 'toy', 35, 1, 'flat', 1, 1, 0),
  ('cat_hammock', 'toy', 50, 3, 'floor', 1, 1, 0),
  ('scratching_post_garden', 'toy', 40, 1, 'floor', 1, 1, 0),
  ('cat_tunnel', 'toy', 45, 3, 'floor', 2, 1, 0),
  ('cat_house', 'toy', 80, 5, 'floor', 1, 1, 0),
  ('cat_tower', 'toy', 120, 5, 'floor', 1, 1, 0),
  ('stone_path', 'decor', 10, 1, 'flat', 1, 1, 0),
  ('red_flowers', 'decor', 12, 1, 'flat', 1, 1, 0),
  ('yellow_flowers', 'decor', 12, 1, 'flat', 1, 1, 0),
  ('purple_flowers', 'decor', 12, 1, 'flat', 1, 1, 0),
  ('mushrooms', 'decor', 15, 1, 'flat', 1, 1, 0),
  ('white_fence', 'decor', 10, 1, 'floor', 1, 1, 0),
  ('bush', 'decor', 15, 1, 'floor', 1, 1, 0),
  ('rose_bush', 'decor', 30, 1, 'floor', 1, 1, 0),
  ('garden_gnome', 'decor', 30, 1, 'floor', 1, 1, 0),
  ('watering_can', 'decor', 15, 1, 'flat', 1, 1, 0),
  ('bird_bath', 'decor', 45, 3, 'floor', 1, 1, 0),
  ('scarecrow', 'decor', 50, 3, 'floor', 1, 1, 0),
  ('lamp_post', 'decor', 55, 3, 'floor', 1, 1, 0),
  ('garden_bench', 'decor', 60, 3, 'floor', 2, 1, 0),
  ('picnic_table', 'decor', 90, 5, 'floor', 2, 1, 0),
  ('parasol', 'decor', 70, 5, 'floor', 1, 1, 0),
  ('swing', 'decor', 120, 5, 'floor', 2, 1, 0),
  ('fountain', 'decor', 200, 8, 'floor', 2, 2, 0)
ON CONFLICT (item_id) DO UPDATE SET kind = EXCLUDED.kind, price = EXCLUDED.price, min_level = EXCLUDED.min_level, place = EXCLUDED.place,
  w = EXCLUDED.w, h = EXCLUDED.h, friendship = EXCLUDED.friendship;
