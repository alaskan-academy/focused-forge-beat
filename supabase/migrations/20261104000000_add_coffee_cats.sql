-- Coffee Cats: jogo co-op para aprender inglês. Só tabelas novas (prefixo coffee_); nada existente é alterado.
--
-- Regras de acesso:
--  * cada jogador lê/edita só o próprio progresso de aprendizagem (SRS) e de arcos (corações, capítulos);
--  * o café (clientes, gatos, melhorias, mural, jogadores) é visível a todos os membros;
--  * tudo o que mexe em moedas, clientes ou melhorias passa por funções (RPC) atômicas,
--    para dois jogadores não atenderem o mesmo cliente nem gastarem moedas que não têm.
-- O conteúdo (cenas, personagens, vocabulário) fica no código (src/content/coffee); o banco guarda só ids.

-- ── Tabelas ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coffee_cafes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Coffee Cats',
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  level INTEGER NOT NULL DEFAULT 1,
  reputation INTEGER NOT NULL DEFAULT 0,
  last_spawn_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coffee_members (
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- um café por pessoa
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cafe_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.coffee_players (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Barista' CHECK (char_length(display_name) BETWEEN 1 AND 24),
  pronoun TEXT NOT NULL DEFAULT 'she' CHECK (pronoun IN ('she', 'he')), -- como os clientes falam desta pessoa
  coins INTEGER NOT NULL DEFAULT 30 CHECK (coins >= 0),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  appearance JSONB,
  corner JSONB NOT NULL DEFAULT '{}'::jsonb, -- cantinho pessoal (Fase 2)
  recent_scenes TEXT[] NOT NULL DEFAULT '{}', -- últimas cenas, para não repetir
  last_theme TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Repetição espaçada (Leitner) por jogador × item. item_id = id de vocab.ts ou de grammar.ts ("g:...").
CREATE TABLE IF NOT EXISTS public.coffee_player_items (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  box SMALLINT NOT NULL DEFAULT 1 CHECK (box BETWEEN 1 AND 5),
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);

-- Progresso de cada jogador no arco de cada cliente recorrente (o cliente é do café; a história é de cada um).
CREATE TABLE IF NOT EXISTS public.coffee_player_arcs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  done TEXT[] NOT NULL DEFAULT '{}',     -- capítulos concluídos
  last_chapter_at TIMESTAMPTZ,
  hearts SMALLINT NOT NULL DEFAULT 0 CHECK (hearts BETWEEN 0 AND 10),
  unlocks TEXT[] NOT NULL DEFAULT '{}',  -- marcos de amizade ('gift', 'photo')
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, character_id)
);

-- Clientes presentes no café (compartilhados). O encontro em si é escolhido para quem atende.
CREATE TABLE IF NOT EXISTS public.coffee_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  spot TEXT NOT NULL,                       -- id do lugar (src/lib/coffee/map.ts)
  seed INTEGER NOT NULL,                    -- aparência de clientes avulsos
  character_id TEXT,                        -- cliente recorrente (src/content/coffee/characters)
  is_hard BOOLEAN NOT NULL DEFAULT false,   -- cliente difícil (Fase 2)
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'served', 'left')),
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  served_by UUID[] NOT NULL DEFAULT '{}',   -- quem já conversou nesta visita (recorrentes ficam até todos conversarem)
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  leave_at TIMESTAMPTZ NOT NULL,
  served_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS coffee_customers_active ON public.coffee_customers (cafe_id) WHERE status IN ('waiting', 'serving');

-- Um atendimento: cenas jogadas e resultado.
CREATE TABLE IF NOT EXISTS public.coffee_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.coffee_customers(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scene_ids TEXT[] NOT NULL,
  character_id TEXT,
  chapter_id TEXT,
  stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 3),
  activities INTEGER NOT NULL DEFAULT 1,
  mistakes INTEGER NOT NULL DEFAULT 0,
  hints INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  hearts_delta INTEGER NOT NULL DEFAULT 0,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ item_id, grade }]
  duo_request_id UUID,                      -- Fase 3: pedidos de dupla
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coffee_encounters_user ON public.coffee_encounters (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.coffee_cats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  look JSONB NOT NULL DEFAULT '{}'::jsonb,
  adopted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coffee_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost > 0),
  funded INTEGER NOT NULL DEFAULT 0 CHECK (funded >= 0),
  completed_at TIMESTAMPTZ,
  UNIQUE (cafe_id, key)
);

CREATE TABLE IF NOT EXISTS public.coffee_upgrade_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upgrade_id UUID NOT NULL REFERENCES public.coffee_upgrades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mural: o que cada um fez. O texto é montado no app a partir de kind + data.
CREATE TABLE IF NOT EXISTS public.coffee_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.coffee_cafes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coffee_activity_cafe ON public.coffee_activity (cafe_id, created_at DESC);

-- ── Acesso (RLS) ───────────────────────────────────────────────────────────

-- SECURITY DEFINER evita recursão de RLS ao checar se alguém é membro.
CREATE OR REPLACE FUNCTION public.coffee_my_cafe()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cafe_id FROM public.coffee_members WHERE user_id = auth.uid()
$$;

ALTER TABLE public.coffee_cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_player_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_player_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_upgrade_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coffee_cafes_read" ON public.coffee_cafes FOR SELECT USING (id = public.coffee_my_cafe());
CREATE POLICY "coffee_members_read" ON public.coffee_members FOR SELECT USING (cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_players_read" ON public.coffee_players FOR SELECT USING (cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_players_update_own" ON public.coffee_players FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "coffee_items_own" ON public.coffee_player_items FOR ALL
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "coffee_arcs_own" ON public.coffee_player_arcs FOR ALL
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "coffee_customers_read" ON public.coffee_customers FOR SELECT USING (cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_encounters_read" ON public.coffee_encounters FOR SELECT USING (cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_cats_read" ON public.coffee_cats FOR SELECT USING (cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_upgrades_read" ON public.coffee_upgrades FOR SELECT USING (cafe_id = public.coffee_my_cafe());
CREATE POLICY "coffee_contrib_read" ON public.coffee_upgrade_contributions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.coffee_upgrades u WHERE u.id = upgrade_id AND u.cafe_id = public.coffee_my_cafe()));
CREATE POLICY "coffee_activity_read" ON public.coffee_activity FOR SELECT USING (cafe_id = public.coffee_my_cafe());

-- No próprio jogador, só nome, aparência, cantinho e histórico de cenas são editáveis direto;
-- moedas e XP mudam só pelas funções abaixo.
REVOKE UPDATE ON public.coffee_players FROM authenticated, anon;
GRANT UPDATE (display_name, pronoun, appearance, corner, recent_scenes, last_theme, updated_at) ON public.coffee_players TO authenticated;

-- ── Funções do jogo ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.coffee_require_member(p_cafe UUID)
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.coffee_members WHERE cafe_id = p_cafe AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not a member of this cafe' USING ERRCODE = '42501';
  END IF;
END $$;

-- Cria o café de quem chama (com o primeiro gato e a melhoria compartilhada). Abre com ~2 clientes.
CREATE OR REPLACE FUNCTION public.coffee_create_cafe(p_display_name TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.coffee_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'already in a cafe';
  END IF;
  INSERT INTO public.coffee_cafes (created_by, last_spawn_at) VALUES (auth.uid(), now() - interval '180 seconds') RETURNING id INTO v_cafe;
  INSERT INTO public.coffee_members (cafe_id, user_id) VALUES (v_cafe, auth.uid());
  INSERT INTO public.coffee_players (user_id, cafe_id, display_name) VALUES (auth.uid(), v_cafe, left(coalesce(nullif(trim(p_display_name), ''), 'Barista'), 24));
  INSERT INTO public.coffee_cats (cafe_id, name, look) VALUES (v_cafe, 'Mochi', '{"color":"orange"}');
  INSERT INTO public.coffee_upgrades (cafe_id, key, cost) VALUES (v_cafe, 'cat_corner', 300);
  INSERT INTO public.coffee_activity (cafe_id, user_id, kind) VALUES (v_cafe, auth.uid(), 'opened_cafe');
  RETURN v_cafe;
END $$;

-- Entra no café de outra pessoa com o código de convite.
CREATE OR REPLACE FUNCTION public.coffee_join_cafe(p_code TEXT, p_display_name TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.coffee_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'already in a cafe';
  END IF;
  SELECT id INTO v_cafe FROM public.coffee_cafes WHERE invite_code = upper(trim(p_code));
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'invalid invite code'; END IF;
  IF (SELECT count(*) FROM public.coffee_members WHERE cafe_id = v_cafe) >= 4 THEN RAISE EXCEPTION 'cafe is full'; END IF;
  INSERT INTO public.coffee_members (cafe_id, user_id) VALUES (v_cafe, auth.uid());
  INSERT INTO public.coffee_players (user_id, cafe_id, display_name) VALUES (auth.uid(), v_cafe, left(coalesce(nullif(trim(p_display_name), ''), 'Barista'), 24));
  INSERT INTO public.coffee_activity (cafe_id, user_id, kind) VALUES (v_cafe, auth.uid(), 'joined_cafe');
  RETURN v_cafe;
END $$;

-- Café "sempre aberto" sem servidor rodando: ao abrir o jogo (e a cada ~30 s enquanto alguém joga)
-- o app chama esta função, que calcula quantos clientes chegaram desde a última vez.
--  * 1 cliente a cada 90 s, no máximo 6 no café (fila com limite, nunca vira pilha de pendências)
--  * café vazio há mais de 1 min recebe pelo menos 2 (sempre há algo para fazer numa sessão curta)
--  * ~35% das vagas vão para clientes recorrentes de p_characters (o app manda primeiro quem tem
--    capítulo liberado para alguém); um mesmo personagem não aparece duas vezes ao mesmo tempo
--  * quem esperou demais (6–8 h) vai embora sem penalidade; atendimento abandonado volta para a fila em 10 min
-- A trava na linha do café impede clientes em dobro quando os dois abrem o jogo ao mesmo tempo.
-- (Mesmas regras de src/lib/coffee/store/localStore.ts.)
CREATE OR REPLACE FUNCTION public.coffee_spawn_arrivals(p_cafe UUID, p_characters TEXT[] DEFAULT '{}')
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c_spots CONSTANT TEXT[] := ARRAY['counter1','counter2','counter3','table1','table2','table3','table4','table5','table6'];
  c_cap CONSTANT INTEGER := 6;
  c_every CONSTANT INTEGER := 90;
  c_char_chance CONSTANT FLOAT := 0.35;
  v_last TIMESTAMPTZ;
  v_active INTEGER;
  v_n INTEGER;
  v_free TEXT[];
  v_char TEXT;
  i INTEGER;
BEGIN
  PERFORM public.coffee_require_member(p_cafe);
  SELECT last_spawn_at INTO v_last FROM public.coffee_cafes WHERE id = p_cafe FOR UPDATE;

  UPDATE public.coffee_customers SET status = 'left'
    WHERE cafe_id = p_cafe AND status = 'waiting' AND leave_at < now();
  UPDATE public.coffee_customers SET status = 'waiting', claimed_by = NULL, claimed_at = NULL
    WHERE cafe_id = p_cafe AND status = 'serving' AND claimed_at < now() - interval '10 minutes';

  SELECT count(*) INTO v_active FROM public.coffee_customers WHERE cafe_id = p_cafe AND status IN ('waiting', 'serving');
  v_n := floor(extract(epoch FROM now() - v_last) / c_every)::int;
  IF v_active = 0 AND now() - v_last > interval '1 minute' THEN v_n := greatest(v_n, 2); END IF;
  v_n := least(v_n, c_cap - v_active);

  IF v_n <= 0 THEN
    -- fila cheia: o relógio de chegada recomeça quando abrir vaga
    IF v_active >= c_cap THEN UPDATE public.coffee_cafes SET last_spawn_at = now() WHERE id = p_cafe; END IF;
    RETURN 0;
  END IF;

  SELECT array_agg(s ORDER BY random()) INTO v_free FROM unnest(c_spots) s
    WHERE s NOT IN (SELECT spot FROM public.coffee_customers WHERE cafe_id = p_cafe AND status IN ('waiting', 'serving'));
  v_n := least(v_n, coalesce(array_length(v_free, 1), 0));

  FOR i IN 1..v_n LOOP
    v_char := NULL;
    IF random() < c_char_chance THEN
      SELECT c INTO v_char FROM unnest(coalesce(p_characters, '{}')) WITH ORDINALITY AS t(c, ord)
        WHERE c NOT IN (SELECT character_id FROM public.coffee_customers
                        WHERE cafe_id = p_cafe AND status IN ('waiting', 'serving') AND character_id IS NOT NULL)
        ORDER BY ord LIMIT 1;
    END IF;
    INSERT INTO public.coffee_customers (cafe_id, spot, seed, character_id, leave_at)
    VALUES (p_cafe, v_free[i], floor(random() * 2147483647)::int, v_char, now() + interval '6 hours' + random() * interval '2 hours');
  END LOOP;
  UPDATE public.coffee_cafes SET last_spawn_at = now() WHERE id = p_cafe;
  RETURN v_n;
END $$;

-- "Trava" o cliente para quem começou a atender. Retorna false se outra pessoa já está atendendo
-- ou se quem chama já conversou com ele nesta visita.
CREATE OR REPLACE FUNCTION public.coffee_claim_customer(p_customer UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID; v_ok BOOLEAN;
BEGIN
  SELECT cafe_id INTO v_cafe FROM public.coffee_customers WHERE id = p_customer;
  IF v_cafe IS NULL THEN RETURN false; END IF;
  PERFORM public.coffee_require_member(v_cafe);
  UPDATE public.coffee_customers SET status = 'serving', claimed_by = auth.uid(), claimed_at = now()
    WHERE id = p_customer
      AND NOT (auth.uid() = ANY(served_by))
      AND (status = 'waiting' OR (status = 'serving' AND (claimed_by = auth.uid() OR claimed_at < now() - interval '10 minutes')))
  RETURNING true INTO v_ok;
  RETURN coalesce(v_ok, false);
END $$;

-- Desiste de atender (cliente volta a esperar).
CREATE OR REPLACE FUNCTION public.coffee_release_customer(p_customer UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.coffee_customers SET status = 'waiting', claimed_by = NULL, claimed_at = NULL
    WHERE id = p_customer AND status = 'serving' AND claimed_by = auth.uid();
END $$;

-- Dica paga: desconta moedas de forma atômica. Retorna o novo saldo (erro se não tiver saldo).
CREATE OR REPLACE FUNCTION public.coffee_spend_hint(p_cost INTEGER)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_coins INTEGER;
BEGIN
  IF p_cost NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'invalid cost'; END IF;
  UPDATE public.coffee_players SET coins = coins - p_cost, updated_at = now()
    WHERE user_id = auth.uid() AND coins >= p_cost RETURNING coins INTO v_coins;
  IF v_coins IS NULL THEN RAISE EXCEPTION 'not enough coins'; END IF;
  RETURN v_coins;
END $$;

-- Conclui o atendimento: grava o encontro, credita moedas/XP (mesma fórmula de
-- src/lib/coffee/activities.ts), registra quem conversou e escreve no mural. Tudo numa transação.
-- Cliente avulso sai depois de um atendimento; recorrente volta a esperar até todos os membros conversarem.
CREATE OR REPLACE FUNCTION public.coffee_finish_encounter(
  p_customer UUID, p_scene_ids TEXT[], p_character TEXT, p_chapter TEXT,
  p_stars INTEGER, p_activities INTEGER, p_mistakes INTEGER, p_hints INTEGER, p_duration_ms INTEGER,
  p_hearts_delta INTEGER, p_items JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cafe UUID; v_char TEXT; v_served UUID[]; v_all BOOLEAN; v_stars INTEGER; v_acts INTEGER; v_mist INTEGER;
  v_tip INTEGER; v_walkout BOOLEAN; v_coins INTEGER; v_xp INTEGER; v_player public.coffee_players;
BEGIN
  SELECT cafe_id, character_id, served_by INTO v_cafe, v_char, v_served FROM public.coffee_customers
    WHERE id = p_customer AND status = 'serving' AND claimed_by = auth.uid() FOR UPDATE;
  IF v_cafe IS NULL THEN RAISE EXCEPTION 'customer is not being served by you'; END IF;
  v_served := array_append(v_served, auth.uid());
  v_all := v_char IS NULL OR NOT EXISTS (SELECT 1 FROM public.coffee_members m WHERE m.cafe_id = v_cafe AND NOT (m.user_id = ANY(v_served)));

  v_stars := least(3, greatest(1, p_stars));
  v_acts := least(10, greatest(1, p_activities));
  v_mist := greatest(0, p_mistakes);
  -- pagamento (2 + 2 por atividade) + gorjeta (8, menos 3 por erro); 3+ erros: o cliente vai embora sem pagar
  v_walkout := v_mist >= 3;
  v_tip := CASE WHEN v_walkout THEN 0 ELSE greatest(0, 8 - 3 * v_mist) END;
  v_coins := CASE WHEN v_walkout THEN 0 ELSE 2 + v_acts * 2 + v_tip END;
  v_xp := v_stars * 5 + v_acts * 5;

  UPDATE public.coffee_customers SET
    served_by = v_served,
    status = CASE WHEN v_all THEN 'served' ELSE 'waiting' END,
    served_at = CASE WHEN v_all THEN now() ELSE served_at END,
    claimed_by = NULL, claimed_at = NULL
    WHERE id = p_customer;
  INSERT INTO public.coffee_encounters (cafe_id, customer_id, user_id, scene_ids, character_id, chapter_id, stars, activities,
                                        mistakes, hints, duration_ms, hearts_delta, coins_earned, xp_earned, items)
    VALUES (v_cafe, p_customer, auth.uid(), coalesce(p_scene_ids, '{}'), p_character, p_chapter, v_stars, v_acts,
            v_mist, greatest(0, p_hints), greatest(0, p_duration_ms), coalesce(p_hearts_delta, 0),
            v_coins, v_xp, coalesce(p_items, '[]'::jsonb));
  UPDATE public.coffee_players SET coins = coins + v_coins, xp = xp + v_xp, updated_at = now()
    WHERE user_id = auth.uid() RETURNING * INTO v_player;
  UPDATE public.coffee_cafes SET reputation = reputation + v_stars WHERE id = v_cafe;
  INSERT INTO public.coffee_activity (cafe_id, user_id, kind, data)
    VALUES (v_cafe, auth.uid(), CASE WHEN p_chapter IS NOT NULL THEN 'chapter' ELSE 'served' END,
            jsonb_build_object('stars', v_stars, 'character', p_character, 'chapter', p_chapter, 'scenes', p_scene_ids, 'walkout', v_walkout));

  RETURN jsonb_build_object('coins', v_coins, 'tip', v_tip, 'walkout', v_walkout, 'xp', v_xp, 'total_coins', v_player.coins, 'total_xp', v_player.xp);
END $$;

-- Contribui com moedas para uma melhoria compartilhada.
CREATE OR REPLACE FUNCTION public.coffee_contribute(p_upgrade UUID, p_amount INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_up public.coffee_upgrades; v_amount INTEGER; v_coins INTEGER;
BEGIN
  SELECT * INTO v_up FROM public.coffee_upgrades WHERE id = p_upgrade FOR UPDATE;
  IF v_up.id IS NULL THEN RAISE EXCEPTION 'upgrade not found'; END IF;
  PERFORM public.coffee_require_member(v_up.cafe_id);
  IF v_up.completed_at IS NOT NULL THEN RAISE EXCEPTION 'upgrade already completed'; END IF;
  v_amount := least(p_amount, v_up.cost - v_up.funded);
  IF v_amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;

  UPDATE public.coffee_players SET coins = coins - v_amount, updated_at = now()
    WHERE user_id = auth.uid() AND coins >= v_amount RETURNING coins INTO v_coins;
  IF v_coins IS NULL THEN RAISE EXCEPTION 'not enough coins'; END IF;

  INSERT INTO public.coffee_upgrade_contributions (upgrade_id, user_id, amount) VALUES (p_upgrade, auth.uid(), v_amount);
  UPDATE public.coffee_upgrades SET funded = funded + v_amount,
    completed_at = CASE WHEN funded + v_amount >= cost THEN now() ELSE NULL END
    WHERE id = p_upgrade RETURNING * INTO v_up;
  INSERT INTO public.coffee_activity (cafe_id, user_id, kind, data)
    VALUES (v_up.cafe_id, auth.uid(), CASE WHEN v_up.completed_at IS NOT NULL THEN 'upgrade_done' ELSE 'contributed' END,
            jsonb_build_object('upgrade', v_up.key, 'amount', v_amount));
  RETURN jsonb_build_object('funded', v_up.funded, 'cost', v_up.cost, 'completed', v_up.completed_at IS NOT NULL, 'coins', v_coins);
END $$;

-- Só usuários logados chamam as funções do jogo.
REVOKE EXECUTE ON FUNCTION public.coffee_my_cafe(), public.coffee_require_member(UUID), public.coffee_create_cafe(TEXT),
  public.coffee_join_cafe(TEXT, TEXT), public.coffee_spawn_arrivals(UUID, TEXT[]), public.coffee_claim_customer(UUID),
  public.coffee_release_customer(UUID), public.coffee_spend_hint(INTEGER),
  public.coffee_finish_encounter(UUID, TEXT[], TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, JSONB),
  public.coffee_contribute(UUID, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coffee_my_cafe(), public.coffee_create_cafe(TEXT),
  public.coffee_join_cafe(TEXT, TEXT), public.coffee_spawn_arrivals(UUID, TEXT[]), public.coffee_claim_customer(UUID),
  public.coffee_release_customer(UUID), public.coffee_spend_hint(INTEGER),
  public.coffee_finish_encounter(UUID, TEXT[], TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, JSONB),
  public.coffee_contribute(UUID, INTEGER)
  TO authenticated;

-- Tempo real: o outro jogador vê clientes, mural e melhorias mudando na hora.
ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_customers, public.coffee_activity, public.coffee_upgrades, public.coffee_players;
