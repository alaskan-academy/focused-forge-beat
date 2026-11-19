-- Coffee Cats: conforto da casa e bônus ao acordar (Etapa 3). Só acrescenta.
--
-- Conforto = soma do conforto dos móveis colocados (dos dois); cada tipo de móvel conta no
-- máximo 3 vezes. Título e bônus diário (igual a src/lib/coffee/comfort.ts):
--   0 Caixa de papelão +3 · 10 Cantinho simples +6 · 30 Lar aconchegante +10
--   60 Casa de revista +16 · 100 Mansão dos gatos +25
-- O bônus é de cada pessoa, uma vez por dia (horário de Brasília).

CREATE TABLE IF NOT EXISTS public.coffee_house_bonus (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_day DATE NOT NULL,
  last_coins INTEGER NOT NULL DEFAULT 0,
  total_coins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coffee_house_bonus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_house_bonus_read_own" ON public.coffee_house_bonus FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_house_bonus FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.coffee_house_comfort(p_cafe UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(sum(c.comfort * least(3, t.n)), 0)::int
  FROM (SELECT item_id, count(*) AS n FROM public.coffee_house_items WHERE cafe_id = p_cafe AND room IS NOT NULL GROUP BY item_id) t
  JOIN public.coffee_shop_catalog c USING (item_id)
$$;

CREATE OR REPLACE FUNCTION public.coffee_comfort_level(p_comfort INTEGER)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_comfort >= 100 THEN 4 WHEN p_comfort >= 60 THEN 3 WHEN p_comfort >= 30 THEN 2 WHEN p_comfort >= 10 THEN 1 ELSE 0 END
$$;

-- Ao acordar: se ainda não ganhou hoje, ganha o bônus do título da casa.
-- Sempre devolve o conforto e o nível atuais (claimed = false se já tinha ganhado hoje).
CREATE OR REPLACE FUNCTION public.coffee_house_morning()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_player public.coffee_players; v_today DATE; v_last DATE; v_comfort INTEGER; v_level INTEGER; v_coins INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_player FROM public.coffee_players WHERE user_id = auth.uid() FOR UPDATE;
  IF v_player.user_id IS NULL THEN RAISE EXCEPTION 'not a player'; END IF;
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_comfort := public.coffee_house_comfort(v_player.cafe_id);
  v_level := public.coffee_comfort_level(v_comfort);
  SELECT last_day INTO v_last FROM public.coffee_house_bonus WHERE user_id = auth.uid();
  IF v_last IS NOT NULL AND v_last >= v_today THEN
    RETURN jsonb_build_object('claimed', false, 'coins', 0, 'comfort', v_comfort, 'level', v_level, 'total_coins', v_player.coins);
  END IF;

  v_coins := (ARRAY[3, 6, 10, 16, 25])[v_level + 1];
  UPDATE public.coffee_players SET coins = coins + v_coins, updated_at = now()
    WHERE user_id = auth.uid() RETURNING * INTO v_player;
  INSERT INTO public.coffee_house_bonus (user_id, last_day, last_coins, total_coins)
    VALUES (auth.uid(), v_today, v_coins, v_coins)
    ON CONFLICT (user_id) DO UPDATE SET last_day = EXCLUDED.last_day, last_coins = EXCLUDED.last_coins,
      total_coins = public.coffee_house_bonus.total_coins + EXCLUDED.last_coins, updated_at = now();
  RETURN jsonb_build_object('claimed', true, 'coins', v_coins, 'comfort', v_comfort, 'level', v_level, 'total_coins', v_player.coins);
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_house_comfort(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.coffee_house_morning() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_house_morning() TO authenticated;
