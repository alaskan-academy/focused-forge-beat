import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CHARACTER_BY_ID } from '@/content/coffee';
import type { SceneCustomer } from '@/game/bridge';
import { WALKOUT_MISTAKES, computeStars, targetMs, type ActivityResult } from '@/lib/coffee/activities';
import { applyEncounter, chapterStatus, heartsDelta } from '@/lib/coffee/arcs';
import { bubbleFor, planEncounter, sceneActivities, type Encounter } from '@/lib/coffee/director';
import { newToday, review, type Grade, type VocabState } from '@/lib/coffee/srs';
import type { Theme } from '@/content/coffee/types';
import type { CafeCustomer, CoffeeStore, Position, RemotePresence, Snapshot } from '@/lib/coffee/store/types';
import type { Appearance } from '@/lib/coffee/character';
import type { EncounterSummary } from './DialogueOverlay';

const SPAWN_POLL_MS = 30_000;
const GRADE_RANK: Record<Grade, number> = { fail: 0, ok: 1, good: 2 };

export type ActiveEncounter = { customer: CafeCustomer; encounter: Encounter };

// Liga o armazenamento (local ou Supabase) às regras do jogo: chegada de clientes, escolha do
// encontro pelo SRS, e gravação do resultado (SRS, corações, moedas).
export function useCoffeeGame(store: CoffeeStore) {
  // undefined = carregando · null = ainda não está num café · Snapshot = jogando
  const [loaded, setLoaded] = useState<Snapshot | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const snap = loaded ?? null;
  const snapRef = useRef<Snapshot | null>(null);
  snapRef.current = snap;
  const setSnap = setLoaded;

  const refresh = useCallback(async () => {
    try {
      setSnap(await store.load());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [store, setSnap]);

  // personagens que podem visitar: quem tem capítulo liberado para mim vem primeiro
  const candidates = useCallback(
    (s: Snapshot) => {
      const now = store.now();
      return [...CHARACTERS]
        .sort((a, b) => Number(chapterStatus(b, s.arcs[b.id], now).state === 'available') - Number(chapterStatus(a, s.arcs[a.id], now).state === 'available'))
        .map((c) => c.id);
    },
    [store],
  );

  useEffect(() => {
    let alive = true;
    const off = store.subscribe(() => alive && refresh());
    const spawn = async () => {
      try {
        const s = await store.load();
        if (s) await store.spawn(candidates(s));
        if (alive) setSnap(s ? await store.load() : null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    };
    spawn();
    const id = window.setInterval(spawn, SPAWN_POLL_MS);
    return () => {
      alive = false;
      off();
      window.clearInterval(id);
    };
  }, [store, refresh, candidates, setSnap]);

  const sceneCustomers = useMemo<SceneCustomer[]>(() => {
    if (!snap) return [];
    const now = store.now();
    return snap.customers.map((c) => {
      const char = c.character_id ? CHARACTER_BY_ID[c.character_id] : undefined;
      return {
        id: c.id,
        spotId: c.spot,
        seed: c.seed,
        status: c.status,
        busy: c.status === 'serving' && c.claimed_by !== store.userId,
        doneForMe: c.served_by.includes(store.userId),
        arriving: now.getTime() - new Date(c.arrived_at).getTime() < 10_000,
        bubble: bubbleFor(c.character_id, snap.arcs, now),
        name: char?.name,
        look: char?.look,
      };
    });
  }, [snap, store]);

  // Começa um atendimento: trava o cliente e escolhe o encontro para este jogador.
  const begin = useCallback(
    async (customerId: string): Promise<ActiveEncounter | 'busy' | null> => {
      const s = snapRef.current;
      const customer = s?.customers.find((c) => c.id === customerId);
      if (!s || !customer) return null;
      if (!(await store.claim(customerId))) return 'busy';
      // recorrente que a outra pessoa ainda não viu nesta visita: termina perguntando por ela
      const p = s.partner;
      const waitingFor = customer.character_id && p && !customer.served_by.includes(p.user_id) ? { name: p.display_name, pronoun: p.pronoun } : null;
      const encounter = planEncounter(customer.character_id, {
        states: s.items,
        arcs: s.arcs,
        recentScenes: s.me.recent_scenes,
        lastTheme: (s.me.last_theme as Theme | null) ?? null,
        newToday: newToday(Object.values(s.items), store.now()),
      }, store.now(), Math.random, waitingFor);
      return { customer, encounter };
    },
    [store],
  );

  // Grava o resultado: SRS por item, corações, moedas/XP e histórico de cenas.
  const complete = useCallback(
    async (active: ActiveEncounter, results: ActivityResult[], durationMs: number): Promise<EncounterSummary> => {
      const s = snapRef.current!;
      const now = store.now();
      const { encounter: enc, customer } = active;
      const activities = enc.scenes.flatMap(sceneActivities);

      // nota por item = pior nota entre as atividades que o treinaram
      const grades = new Map<string, Grade>();
      activities.forEach((a, i) => {
        const r = results[i];
        if (!r) return;
        const g: Grade = r.revealed || r.mistakes >= 2 ? 'fail' : r.mistakes === 1 || r.hints > 0 ? 'ok' : 'good';
        for (const id of a.items) {
          const prev = grades.get(id);
          if (!prev || GRADE_RANK[g] < GRADE_RANK[prev]) grades.set(id, g);
        }
      });
      const newStates: VocabState[] = [...grades].map(([id, g]) => review(s.items[id], id, g, now));
      await store.saveItems(newStates);

      const total = results.reduce(
        (acc, r) => ({ mistakes: acc.mistakes + r.mistakes, hints: acc.hints + r.hints, revealed: acc.revealed + (r.revealed ? 1 : 0) }),
        { mistakes: 0, hints: 0, revealed: 0 },
      );
      const stars = computeStars({ ...total, durationMs, targetMs: targetMs(activities) });

      let hearts: number | null = null;
      let delta: number | null = null;
      let newUnlocks: string[] = [];
      const walkout = total.mistakes >= WALKOUT_MISTAKES;
      if (enc.characterId) {
        // errou demais: o cliente sai chateado e a amizade cai um pouco
        delta = heartsDelta(results) - (walkout ? 1 : 0);
        const res = applyEncounter(s.arcs[enc.characterId], enc.characterId, enc.chapterId, delta, now);
        hearts = res.arc.hearts;
        newUnlocks = res.newUnlocks;
        await store.saveArc(res.arc);
      }

      const fin = await store.finish({
        customerId: customer.id,
        sceneIds: enc.scenes.map((sc) => sc.id),
        characterId: enc.characterId,
        chapterId: enc.chapterId,
        stars,
        activities: activities.length,
        mistakes: total.mistakes,
        hints: total.hints,
        durationMs,
        heartsDelta: delta ?? 0,
        items: [...grades].map(([item_id, grade]) => ({ item_id, grade })),
      });
      await store.savePlayer({
        recent_scenes: [...enc.scenes.map((sc) => sc.id), ...s.me.recent_scenes].slice(0, 15),
        last_theme: enc.scenes[enc.scenes.length - 1].theme,
      });

      const chapter = enc.chapterId ? CHARACTER_BY_ID[enc.characterId!]?.chapters.find((c) => c.id === enc.chapterId) : undefined;
      return {
        stars,
        coins: fin.coins,
        tip: fin.tip,
        walkout: fin.walkout,
        mistakes: total.mistakes,
        xp: fin.xp,
        heartsDelta: delta,
        hearts,
        newUnlocks,
        items: [...grades.keys()],
        chapterTitle: chapter?.title_pt ?? null,
      };
    },
    [store],
  );

  // ── revisão e chunks: notas que vão direto para o SRS ─────────────────────
  const gradeItems = useCallback(
    async (updates: { itemId: string; grade: Grade }[]) => {
      const s0 = snapRef.current;
      if (!s0) return;
      const now = store.now();
      await store.saveItems(updates.map((u) => review(s0.items[u.itemId], u.itemId, u.grade, now)));
      await refresh();
    },
    [store, refresh],
  );

  // ── melhoria compartilhada ──────────────────────────────────────────────
  const contribute = useCallback(
    async (amount: number) => {
      const u = snapRef.current?.upgrade;
      if (!u) return;
      await store.contribute(u.id, amount);
      await refresh();
    },
    [store, refresh],
  );

  // ── presença: onde a outra pessoa está agora ────────────────────────────
  const [others, setOthers] = useState<RemotePresence[]>([]);
  const presence = useRef<{ move(p: Position): void; leave(): void } | null>(null);
  const myName = snap?.me.display_name;
  const myLook = snap?.me.appearance ?? null;
  const lookKey = JSON.stringify(myLook);
  const hasCafe = !!snap;
  useEffect(() => {
    if (!hasCafe || !myName) return;
    presence.current = store.joinPresence({ name: myName, appearance: JSON.parse(lookKey) as Appearance | null }, setOthers);
    return () => {
      presence.current?.leave();
      presence.current = null;
      setOthers([]);
    };
  }, [store, hasCafe, myName, lookKey]);
  const move = useCallback((p: Position) => presence.current?.move(p), []);

  return { snap, loading: loaded === undefined, needsCafe: loaded === null, error, refresh, sceneCustomers, begin, complete, contribute, gradeItems, others, move };
}
