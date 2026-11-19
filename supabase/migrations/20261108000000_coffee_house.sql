-- Coffee Cats: a casa (Etapa 2) — lojinha de móveis, mochila e decoração. Só acrescenta;
-- não altera nada que já existe (moedas e XP só mudam na compra, pela função abaixo).
--
-- coffee_shop_catalog: preço, nível mínimo, tamanho e conforto de cada móvel (igual a
--   src/content/coffee/furniture.ts; um teste confere).
-- coffee_house_items: móveis comprados. room NULL = na mochila de quem comprou.
-- Quartos: bedroom0 é do primeiro membro do café (ordem de entrada), bedroom1 do segundo.
-- Sala e cozinha são dos dois: qualquer um mexe nos móveis que estão lá.

CREATE TABLE IF NOT EXISTS public.coffee_shop_catalog (
  item_id TEXT PRIMARY KEY,
  price INTEGER NOT NULL CHECK (price >= 0),
  min_level INTEGER NOT NULL DEFAULT 1,
  place TEXT NOT NULL CHECK (place IN ('floor', 'rug', 'wall')),
  w INTEGER NOT NULL DEFAULT 1,
  h INTEGER NOT NULL DEFAULT 1,
  variants INTEGER NOT NULL DEFAULT 1,
  comfort INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.coffee_shop_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_shop_catalog_read" ON public.coffee_shop_catalog FOR SELECT USING (auth.uid() IS NOT NULL);
REVOKE INSERT, UPDATE, DELETE ON public.coffee_shop_catalog FROM authenticated, anon;

CREATE TABLE IF NOT EXISTS public.coffee_house_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.coffee_shop_catalog(item_id),
  variant INTEGER NOT NULL DEFAULT 0,
  room TEXT CHECK (room IN ('bedroom0', 'bedroom1', 'living', 'kitchen')),
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  flip BOOLEAN NOT NULL DEFAULT false,
  placed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coffee_house_items_cafe ON public.coffee_house_items (cafe_id);

ALTER TABLE public.coffee_house_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_house_items_read" ON public.coffee_house_items FOR SELECT USING (cafe_id = public.coffee_my_cafe());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_house_items FROM authenticated, anon;

ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_house_items;

-- Nível a partir do XP (igual a levelFromXp em src/lib/coffee/activities.ts: 100, 150, 200…).
CREATE OR REPLACE FUNCTION public.coffee_level(p_xp INTEGER)
RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v_level INTEGER := 1; v_need INTEGER := 100; v_rest INTEGER := greatest(0, coalesce(p_xp, 0));
BEGIN
  WHILE v_rest >= v_need LOOP
    v_rest := v_rest - v_need;
    v_level := v_level + 1;
    v_need := v_need + 50;
  END LOOP;
  RETURN v_level;
END $$;

-- Retângulo interno de cada cômodo (igual a ROOMS em src/lib/coffee/house.ts).
CREATE OR REPLACE FUNCTION public.coffee_room_rect(p_room TEXT, OUT x0 INTEGER, OUT y0 INTEGER, OUT x1 INTEGER, OUT y1 INTEGER)
LANGUAGE sql IMMUTABLE AS $$
  SELECT r.a, r.b, r.c, r.d FROM (VALUES
    ('bedroom0', 1, 2, 10, 7),
    ('bedroom1', 12, 2, 22, 7),
    ('living', 1, 9, 13, 14),
    ('kitchen', 15, 9, 22, 14)
  ) AS r(room, a, b, c, d) WHERE r.room = p_room
$$;

-- Posso editar este cômodo? Quarto N = N-ésimo membro por ordem de entrada; sala e cozinha = todos.
CREATE OR REPLACE FUNCTION public.coffee_can_edit_room(p_cafe UUID, p_room TEXT, p_user UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner UUID;
BEGIN
  IF p_room IN ('living', 'kitchen') THEN RETURN true; END IF;
  SELECT user_id INTO v_owner FROM public.coffee_members WHERE cafe_id = p_cafe
    ORDER BY joined_at OFFSET (CASE p_room WHEN 'bedroom0' THEN 0 WHEN 'bedroom1' THEN 1 ELSE 99 END) LIMIT 1;
  IF v_owner IS NULL THEN
    -- quarto ainda sem dono (café com uma pessoa só): só o quarto 0 é dela
    RETURN p_room = 'bedroom0';
  END IF;
  RETURN v_owner = p_user;
END $$;

-- Compra um móvel: confere nível e moedas, desconta e põe na mochila. Registra no mural.
CREATE OR REPLACE FUNCTION public.coffee_house_buy(p_item TEXT, p_variant INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_player public.coffee_players; v_cat public.coffee_shop_catalog; v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_player FROM public.coffee_players WHERE user_id = auth.uid() FOR UPDATE;
  IF v_player.user_id IS NULL THEN RAISE EXCEPTION 'not a player'; END IF;
  SELECT * INTO v_cat FROM public.coffee_shop_catalog WHERE item_id = p_item;
  IF v_cat.item_id IS NULL THEN RAISE EXCEPTION 'unknown item'; END IF;
  IF p_variant IS NULL OR p_variant < 0 OR p_variant >= v_cat.variants THEN RAISE EXCEPTION 'unknown variant'; END IF;
  IF public.coffee_level(v_player.xp) < v_cat.min_level THEN RAISE EXCEPTION 'level too low'; END IF;
  IF v_player.coins < v_cat.price THEN RAISE EXCEPTION 'not enough coins'; END IF;

  UPDATE public.coffee_players SET coins = coins - v_cat.price, updated_at = now()
    WHERE user_id = auth.uid() RETURNING * INTO v_player;
  INSERT INTO public.coffee_house_items (cafe_id, owner_id, item_id, variant)
    VALUES (v_player.cafe_id, auth.uid(), p_item, p_variant) RETURNING id INTO v_id;
  INSERT INTO public.coffee_activity (cafe_id, user_id, kind, data)
    VALUES (v_player.cafe_id, auth.uid(), 'house_buy', jsonb_build_object('item', p_item, 'variant', p_variant, 'price', v_cat.price));
  RETURN jsonb_build_object('id', v_id, 'total_coins', v_player.coins);
END $$;

-- Coloca (ou move) um móvel. O app confere sobreposição e passagem; aqui confere quem pode e os limites.
CREATE OR REPLACE FUNCTION public.coffee_house_place(p_id UUID, p_room TEXT, p_x INTEGER, p_y INTEGER, p_flip BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_it public.coffee_house_items; v_cat public.coffee_shop_catalog; r RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_it FROM public.coffee_house_items WHERE id = p_id FOR UPDATE;
  IF v_it.id IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;
  PERFORM public.coffee_require_member(v_it.cafe_id);
  -- da mochila, só quem comprou; já colocado em outra pessoa, só se estiver num cômodo compartilhado
  IF v_it.owner_id <> auth.uid() AND (v_it.room IS NULL OR v_it.room NOT IN ('living', 'kitchen')) THEN
    RAISE EXCEPTION 'not your item' USING ERRCODE = '42501';
  END IF;
  IF v_it.owner_id <> auth.uid() AND p_room NOT IN ('living', 'kitchen') THEN
    RAISE EXCEPTION 'not your item' USING ERRCODE = '42501';
  END IF;
  IF NOT public.coffee_can_edit_room(v_it.cafe_id, p_room, auth.uid()) THEN
    RAISE EXCEPTION 'not your room' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_cat FROM public.coffee_shop_catalog WHERE item_id = v_it.item_id;
  SELECT * INTO r FROM public.coffee_room_rect(p_room);
  IF r.x0 IS NULL THEN RAISE EXCEPTION 'unknown room'; END IF;
  IF p_x < r.x0 OR p_x + v_cat.w - 1 > r.x1 THEN RAISE EXCEPTION 'out of the room'; END IF;
  IF v_cat.place = 'wall' THEN
    IF p_y <> r.y0 - 1 OR v_cat.h <> 1 THEN RAISE EXCEPTION 'out of the room'; END IF;
  ELSIF p_y < r.y0 OR p_y + v_cat.h - 1 > r.y1 THEN
    RAISE EXCEPTION 'out of the room';
  END IF;

  UPDATE public.coffee_house_items
    SET room = p_room, x = p_x, y = p_y, flip = coalesce(p_flip, false), placed_by = auth.uid(), updated_at = now()
    WHERE id = p_id;
END $$;

-- Guarda um móvel de volta na mochila de quem comprou.
CREATE OR REPLACE FUNCTION public.coffee_house_store(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_it public.coffee_house_items;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_it FROM public.coffee_house_items WHERE id = p_id FOR UPDATE;
  IF v_it.id IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;
  PERFORM public.coffee_require_member(v_it.cafe_id);
  IF v_it.owner_id <> auth.uid() AND (v_it.room IS NULL OR v_it.room NOT IN ('living', 'kitchen')) THEN
    RAISE EXCEPTION 'not your item' USING ERRCODE = '42501';
  END IF;
  UPDATE public.coffee_house_items SET room = NULL, placed_by = auth.uid(), updated_at = now() WHERE id = p_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_can_edit_room(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.coffee_house_buy(TEXT, INTEGER), public.coffee_house_place(UUID, TEXT, INTEGER, INTEGER, BOOLEAN),
  public.coffee_house_store(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_house_buy(TEXT, INTEGER), public.coffee_house_place(UUID, TEXT, INTEGER, INTEGER, BOOLEAN),
  public.coffee_house_store(UUID) TO authenticated;

-- Catálogo (item_id, preço, nível mínimo, lugar, largura, altura, variantes, conforto)
INSERT INTO public.coffee_shop_catalog (item_id, price, min_level, place, w, h, variants, comfort) VALUES
  ('potted_plant', 12, 1, 'floor', 1, 1, 2, 1),
  ('cactus', 10, 1, 'floor', 1, 1, 1, 1),
  ('floor_cushion', 10, 1, 'floor', 1, 1, 4, 1),
  ('stool', 12, 1, 'floor', 1, 1, 1, 1),
  ('ottoman', 15, 1, 'floor', 1, 1, 1, 1),
  ('barrel', 15, 1, 'floor', 1, 1, 2, 1),
  ('chair', 18, 1, 'floor', 1, 1, 2, 1),
  ('side_chair', 18, 1, 'floor', 1, 1, 1, 1),
  ('side_table', 20, 1, 'floor', 1, 1, 1, 1),
  ('round_table', 25, 1, 'floor', 1, 1, 1, 2),
  ('small_rug', 15, 1, 'rug', 1, 1, 4, 1),
  ('laundry_basket', 10, 1, 'floor', 1, 1, 1, 1),
  ('teddy_bear', 20, 1, 'floor', 1, 1, 1, 2),
  ('trash_can', 10, 1, 'floor', 1, 1, 1, 1),
  ('fan', 25, 1, 'floor', 1, 1, 1, 2),
  ('wall_clock', 20, 1, 'wall', 1, 1, 1, 1),
  ('calendar', 10, 1, 'wall', 1, 1, 1, 1),
  ('poster', 15, 1, 'wall', 1, 1, 4, 1),
  ('picture_frames', 20, 1, 'wall', 1, 1, 3, 1),
  ('wall_lamp', 25, 1, 'wall', 1, 1, 2, 1),
  ('armchair', 60, 3, 'floor', 1, 1, 2, 4),
  ('reading_chair', 50, 3, 'floor', 1, 1, 2, 3),
  ('coffee_table', 45, 3, 'floor', 2, 1, 1, 3),
  ('dining_table', 70, 3, 'floor', 3, 1, 1, 4),
  ('bench', 40, 3, 'floor', 2, 1, 2, 2),
  ('bookshelf', 60, 3, 'floor', 1, 1, 3, 4),
  ('dresser', 55, 3, 'floor', 1, 1, 2, 3),
  ('floor_lamp', 45, 3, 'floor', 1, 1, 2, 3),
  ('candelabra', 50, 3, 'floor', 1, 1, 2, 3),
  ('mirror', 50, 3, 'wall', 1, 1, 1, 3),
  ('painting', 60, 3, 'wall', 1, 1, 3, 4),
  ('oval_rug', 55, 3, 'rug', 2, 1, 2, 4),
  ('beanbag', 45, 3, 'floor', 1, 1, 4, 4),
  ('fridge', 80, 3, 'floor', 1, 1, 1, 3),
  ('sink', 50, 3, 'floor', 1, 1, 1, 2),
  ('cabinet', 40, 3, 'floor', 1, 1, 2, 2),
  ('spice_counter', 45, 3, 'floor', 1, 1, 2, 2),
  ('dish_counter', 40, 3, 'floor', 1, 1, 1, 2),
  ('coffee_maker', 60, 3, 'floor', 1, 1, 1, 3),
  ('record_player', 75, 3, 'floor', 1, 1, 1, 5),
  ('guitar', 70, 3, 'floor', 1, 1, 1, 4),
  ('cat_bed', 40, 3, 'floor', 1, 1, 1, 4),
  ('telephone', 40, 3, 'floor', 1, 1, 1, 2),
  ('writing_desk', 60, 3, 'floor', 1, 1, 1, 3),
  ('string_lights', 45, 3, 'wall', 2, 1, 1, 4),
  ('wall_banner', 40, 3, 'wall', 1, 1, 3, 2),
  ('large_rug', 140, 5, 'rug', 3, 1, 2, 8),
  ('banquet_table', 180, 5, 'floor', 3, 2, 2, 8),
  ('tea_table', 130, 5, 'floor', 2, 2, 2, 6),
  ('television', 200, 5, 'floor', 1, 1, 1, 8),
  ('computer', 220, 5, 'floor', 1, 1, 1, 6),
  ('tapestry', 150, 5, 'wall', 3, 1, 3, 7),
  ('world_map', 120, 5, 'wall', 2, 1, 2, 5),
  ('aquarium', 220, 5, 'floor', 1, 1, 1, 9),
  ('scratching_post', 120, 5, 'floor', 1, 1, 1, 6),
  ('monstera', 130, 5, 'floor', 1, 1, 1, 7),
  ('chess_table', 160, 5, 'floor', 1, 1, 1, 6),
  ('piano', 450, 8, 'floor', 2, 2, 1, 18),
  ('fireplace', 400, 8, 'floor', 2, 1, 1, 20),
  ('cat_tree', 320, 8, 'floor', 1, 2, 1, 15),
  ('grandfather_clock', 300, 8, 'floor', 1, 2, 1, 12)
ON CONFLICT (item_id) DO UPDATE SET price = EXCLUDED.price, min_level = EXCLUDED.min_level, place = EXCLUDED.place,
  w = EXCLUDED.w, h = EXCLUDED.h, variants = EXCLUDED.variants, comfort = EXCLUDED.comfort;
