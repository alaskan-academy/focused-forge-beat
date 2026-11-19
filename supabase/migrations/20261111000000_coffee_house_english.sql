-- Coffee Cats: inglês da casa (Etapa 5). Só acrescenta.
-- "Where did you put the…?": acertou a preposição de lugar → +1 🪙, até 5 vezes por dia
-- (usa coffee_daily_rewards com kind prep1…prep5).

CREATE OR REPLACE FUNCTION public.coffee_prep_reward()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date; v_used INTEGER; v_coins INTEGER := 0; v_total INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  -- trava o jogador para duas respostas ao mesmo tempo não passarem do limite
  PERFORM 1 FROM public.coffee_players WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not a player'; END IF;
  SELECT count(*) INTO v_used FROM public.coffee_daily_rewards WHERE user_id = auth.uid() AND day = v_today AND kind LIKE 'prep%';
  IF v_used < 5 THEN
    v_coins := public.coffee_daily_reward(auth.uid(), 'prep' || (v_used + 1), 1);
  END IF;
  SELECT coins INTO v_total FROM public.coffee_players WHERE user_id = auth.uid();
  RETURN jsonb_build_object('coins', v_coins, 'total_coins', v_total);
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_prep_reward() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_prep_reward() TO authenticated;
