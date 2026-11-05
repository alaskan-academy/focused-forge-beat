-- Coffee Cats: Belmont Sulphur, o senhorio (dono do prédio). Só acrescenta; não altera nada que já existe.
--
-- Uma visita por dia para cada jogador (horário de Brasília), depois do primeiro atendimento ou
-- Sudoku do dia. Cobra aluguel variável + taxa de erros + dívida anterior. A primeira visita leva
-- todas as moedas. Sem dinheiro, o resto vira dívida (não bloqueia nada).
--
-- Aluguel = min(40, 10 + 15% do que ganhou desde a última visita + 5 por melhoria pronta do café)
-- Taxa de erros = 1 moeda por erro (atendimentos e Sudokus) desde a última visita
-- Desconto por negociar bem: até 5 moedas (fora da primeira visita)

CREATE TABLE IF NOT EXISTS public.coffee_landlord (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  debt INTEGER NOT NULL DEFAULT 0 CHECK (debt >= 0),
  visits INTEGER NOT NULL DEFAULT 0,
  total_paid INTEGER NOT NULL DEFAULT 0,
  last_visit_day DATE,
  last_visit_at TIMESTAMPTZ,
  booked_by_me BOOLEAN, -- quem reservou a cabana (respondido no capítulo 1)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coffee_landlord ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coffee_landlord_read_own" ON public.coffee_landlord FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON public.coffee_landlord FROM authenticated, anon;

-- Conta de hoje para um jogador (uso interno; quem chama do app usa coffee_landlord_bill).
CREATE OR REPLACE FUNCTION public.coffee_landlord_compute(p_user UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID; v_row public.coffee_landlord; v_today DATE; v_since TIMESTAMPTZ; v_active BOOLEAN;
  v_earned INTEGER; v_errors INTEGER; v_upgrades INTEGER; v_coins INTEGER; v_first BOOLEAN; v_rent INTEGER; v_fee INTEGER;
BEGIN
  SELECT cafe_id INTO v_cafe FROM public.coffee_members WHERE user_id = p_user;
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'not a member of a cafe' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_row FROM public.coffee_landlord WHERE user_id = p_user;
  SELECT coins INTO v_coins FROM public.coffee_players WHERE user_id = p_user;
  v_today := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_since := coalesce(v_row.last_visit_at, '-infinity'::timestamptz);
  v_first := v_row.user_id IS NULL OR v_row.visits = 0;

  -- já jogou hoje? (atendimento ou Sudoku concluído)
  v_active := EXISTS (SELECT 1 FROM public.coffee_encounters e WHERE e.user_id = p_user AND (e.created_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today)
           OR EXISTS (SELECT 1 FROM public.coffee_puzzles z WHERE z.user_id = p_user AND z.status = 'done' AND (z.finished_at AT TIME ZONE 'America/Sao_Paulo')::date = v_today);

  SELECT coalesce(sum(coins_earned), 0), coalesce(sum(mistakes), 0) INTO v_earned, v_errors
    FROM public.coffee_encounters WHERE user_id = p_user AND created_at > v_since;
  v_earned := v_earned + (SELECT coalesce(sum(coins_earned), 0) FROM public.coffee_puzzles WHERE user_id = p_user AND status = 'done' AND finished_at > v_since);
  v_errors := v_errors + (SELECT coalesce(sum((data->>'mistakes')::int), 0) FROM public.coffee_activity WHERE user_id = p_user AND kind = 'puzzle' AND created_at > v_since);
  SELECT count(*) INTO v_upgrades FROM public.coffee_upgrades WHERE cafe_id = v_cafe AND completed_at IS NOT NULL;

  IF v_first THEN
    v_rent := coalesce(v_coins, 0); -- primeira visita: leva tudo
    v_fee := 0;
  ELSE
    v_rent := least(40, 10 + round(v_earned * 0.15)::int + 5 * v_upgrades);
    v_fee := v_errors;
  END IF;

  RETURN jsonb_build_object(
    'ready', v_active AND (v_row.last_visit_day IS NULL OR v_row.last_visit_day < v_today),
    'first', v_first, 'visits', coalesce(v_row.visits, 0), 'earned', v_earned, 'errors', v_errors,
    'upgrades', v_upgrades, 'rent', v_rent, 'error_fee', v_fee, 'debt', coalesce(v_row.debt, 0),
    'total', v_rent + v_fee + coalesce(v_row.debt, 0), 'coins', coalesce(v_coins, 0),
    'booked_by_me', v_row.booked_by_me, 'cafe_id', v_cafe);
END $$;

-- Conta de hoje de quem chama (só leitura: os números aparecem nas falas do Belmont).
CREATE OR REPLACE FUNCTION public.coffee_landlord_bill()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  RETURN public.coffee_landlord_compute(auth.uid());
END $$;

-- Fim da visita: cobra (aluguel + erros + dívida − desconto), guarda a dívida que sobrar,
-- dá o XP da conversa (5 por estrela + 5 por atividade, como os atendimentos) e registra no mural.
CREATE OR REPLACE FUNCTION public.coffee_landlord_pay(
  p_stars INTEGER, p_activities INTEGER, p_mistakes INTEGER, p_discount INTEGER, p_booked_by_me BOOLEAN, p_chapter TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_bill JSONB; v_player public.coffee_players; v_due INTEGER; v_paid INTEGER; v_debt INTEGER; v_discount INTEGER;
  v_xp INTEGER; v_first BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  -- trava o jogador para a conta não ser paga duas vezes ao mesmo tempo
  SELECT * INTO v_player FROM public.coffee_players WHERE user_id = auth.uid() FOR UPDATE;
  v_bill := public.coffee_landlord_compute(auth.uid());
  IF NOT (v_bill->>'ready')::boolean THEN RAISE EXCEPTION 'landlord is not here today'; END IF;
  v_first := (v_bill->>'first')::boolean;

  v_discount := CASE WHEN v_first THEN 0 ELSE least(5, greatest(0, coalesce(p_discount, 0))) END;
  v_due := greatest(0, (v_bill->>'total')::int - v_discount);
  v_paid := least(v_player.coins, v_due);
  v_debt := v_due - v_paid;
  v_xp := least(3, greatest(1, p_stars)) * 5 + least(10, greatest(1, p_activities)) * 5;

  UPDATE public.coffee_players SET coins = coins - v_paid, xp = xp + v_xp, updated_at = now()
    WHERE user_id = auth.uid() RETURNING * INTO v_player;
  INSERT INTO public.coffee_landlord (user_id, cafe_id, debt, visits, total_paid, last_visit_day, last_visit_at, booked_by_me)
    VALUES (auth.uid(), (v_bill->>'cafe_id')::uuid, v_debt, 1, v_paid, (now() AT TIME ZONE 'America/Sao_Paulo')::date, now(), p_booked_by_me)
    ON CONFLICT (user_id) DO UPDATE SET
      debt = EXCLUDED.debt, visits = public.coffee_landlord.visits + 1, total_paid = public.coffee_landlord.total_paid + EXCLUDED.total_paid,
      last_visit_day = EXCLUDED.last_visit_day, last_visit_at = EXCLUDED.last_visit_at,
      booked_by_me = coalesce(EXCLUDED.booked_by_me, public.coffee_landlord.booked_by_me), updated_at = now();
  INSERT INTO public.coffee_activity (cafe_id, user_id, kind, data)
    VALUES ((v_bill->>'cafe_id')::uuid, auth.uid(), 'rent',
            jsonb_build_object('paid', v_paid, 'debt', v_debt, 'first', v_first, 'chapter', p_chapter, 'mistakes', greatest(0, coalesce(p_mistakes, 0))));

  RETURN jsonb_build_object('paid', v_paid, 'debt', v_debt, 'discount', v_discount, 'first', v_first, 'xp', v_xp,
                            'rent', (v_bill->>'rent')::int, 'error_fee', (v_bill->>'error_fee')::int, 'previous_debt', (v_bill->>'debt')::int,
                            'total_coins', v_player.coins, 'total_xp', v_player.xp);
END $$;

REVOKE EXECUTE ON FUNCTION public.coffee_landlord_compute(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.coffee_landlord_bill(),
  public.coffee_landlord_pay(INTEGER, INTEGER, INTEGER, INTEGER, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_landlord_bill(),
  public.coffee_landlord_pay(INTEGER, INTEGER, INTEGER, INTEGER, BOOLEAN, TEXT) TO authenticated;
