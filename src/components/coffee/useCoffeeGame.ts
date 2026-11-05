import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHARACTERS, CHARACTER_BY_ID } from '@/content/coffee';
import type { SceneCustomer } from '@/game/bridge';
import { WALKOUT_MISTAKES, computeStars, performanceFeedback, targetMs, type ActivityResult } from '@/lib/coffee/activities';
import { applyEncounter, chapterStatus, heartsDelta } from '@/lib/coffee/arcs';
import { bubbleFor, planEncounter, sceneActivities, type Encounter } from '@/lib/coffee/director';
import { newToday, review, type Grade, type VocabState } from '@/lib/coffee/srs';
import type { Theme } from '@/content/coffee/types';
import type { CafeCustomer, CoffeeStore, Position, PuzzleRow, RemotePresence, Snapshot } from '@/lib/coffee/store/types';
import { dayKey, makePuzzle, puzzleFeedback, puzzleStars, totals, wordGrades, type PuzzleSummary, type SudokuProgress, type SudokuSize } from '@/lib/coffee/sudoku';
import { SUDOKU_WORD_BY_ID } from '@/content/coffee/sudokuWords';
import { customItemId, registerCustomItems } from '@/content/coffee/custom';
import type { CustomItemInput } from '@/lib/coffee/store/types';
import type { Appearance } from '@/lib/coffee/character';
import type { EncounterSummary } from './DialogueOverlay';
import belmont from '@/content/coffee/characters/belmont';
import { BELMONT_ID, negotiationDiscount, planLandlordVisit } from '@/lib/coffee/landlordVisit';

const SPAWN_POLL_MS = 60_000;
const GRADE_RANK: Record<Grade, number> = { fail: 0, ok: 1, good: 2 };

export type ActiveEncounter = { customer: CafeCustomer; encounter: Encounter };

// id do Belmont na cena (não é um cliente do banco)
export const LANDLORD_CUSTOMER_ID = 'landlord';

// Liga o armazenamento (local ou Supabase) às regras do jogo: chegada de clientes, escolha do
// encontro pelo SRS, e gravação do resultado (SRS, corações, moedas).
export function useCoffeeGame(store: CoffeeStore) {
  // undefined = carregando · null = ainda não está num café · Snapshot = jogando
  const [loaded, setLoaded] = useState<Snapshot | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const snap = loaded ?? null;
  const snapRef = useRef<Snapshot | null>(null);
  snapRef.current = snap;
  // as palavras escritas à mão entram no registro de itens antes de qualquer tela usar o snapshot
  const setSnap = useCallback(
    (s: Snapshot | null) => {
      if (s) registerCustomItems(s.customItems.filter((c) => c.user_id === store.userId));
      setLoaded(s);
    },
    [store],
  );

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
    let busy = false;
    const off = store.subscribe(() => alive && refresh());
    // Chegada de clientes: só com a aba visível, sem sobrepor chamadas, e uma única RPC por vez.
    // Clientes novos chegam pelo tempo real (subscribe → refresh); a carga completa só acontece
    // na abertura e quando a aba volta a ficar visível.
    const tick = async (full: boolean) => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const s = full || !snapRef.current ? await store.load() : snapRef.current;
        if (s) await store.spawn(candidates(s));
        if (alive) setSnap(s ? await store.load() : null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        busy = false;
      }
    };
    const onVisible = () => !document.hidden && tick(true);
    tick(true);
    const id = window.setInterval(() => tick(false), SPAWN_POLL_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      off();
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [store, refresh, candidates, setSnap]);

  const sceneCustomers = useMemo<SceneCustomer[]>(() => {
    if (!snap) return [];
    const now = store.now();
    const list: SceneCustomer[] = snap.customers.map((c) => {
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
    // Belmont Sulphur: só para mim, parado na porta, enquanto a conta de hoje estiver aberta
    if (snap.landlord?.ready)
      list.push({
        id: LANDLORD_CUSTOMER_ID,
        spotId: 'landlord',
        seed: 666,
        status: 'waiting',
        busy: false,
        doneForMe: false,
        arriving: false,
        bubble: 'bill',
        name: belmont.name,
        look: belmont.look,
      });
    return list;
  }, [snap, store]);

  // Começa um atendimento: trava o cliente e escolhe o encontro para este jogador.
  const begin = useCallback(
    async (customerId: string): Promise<ActiveEncounter | 'busy' | null> => {
      const s = snapRef.current;
      if (s && customerId === LANDLORD_CUSTOMER_ID) {
        if (!s.landlord?.ready) return null;
        const p = s.partner;
        const encounter = planLandlordVisit({
          arcs: s.arcs,
          recentScenes: s.me.recent_scenes,
          bill: s.landlord,
          partner: p ? { name: p.display_name, pronoun: p.pronoun } : null,
          bookedByMe: s.landlord.booked_by_me,
          feed: s.feed,
          userId: store.userId,
          now: store.now(),
        });
        const customer: CafeCustomer = { id: LANDLORD_CUSTOMER_ID, spot: 'landlord', seed: 666, character_id: BELMONT_ID, status: 'serving', claimed_by: store.userId, served_by: [], arrived_at: store.now().toISOString() };
        return { customer, encounter };
      }
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
      const stars = computeStars(total);
      const perfect = results.filter((r) => !r.revealed && r.mistakes === 0 && r.hints === 0).length;
      const weak = [...grades].filter(([, g]) => g !== 'good').map(([id]) => id);

      // Belmont: em vez de receber, você paga a conta do dia (sem corações e sem cliente indo embora)
      if (enc.kind === 'landlord') {
        if (enc.chapterId) await store.saveArc(applyEncounter(s.arcs[BELMONT_ID], BELMONT_ID, enc.chapterId, 0, now).arc);
        const booked = results.find((r) => r.activityId === 'booked')?.value;
        const pay = await store.landlordPay({
          stars,
          activities: activities.length,
          mistakes: total.mistakes,
          discount: negotiationDiscount(results),
          bookedByMe: booked ? booked === 'me' : null,
          chapterId: enc.chapterId,
        });
        await store.savePlayer({
          recent_scenes: [...enc.scenes.map((sc) => sc.id), ...s.me.recent_scenes].slice(0, 15),
          last_theme: enc.scenes[enc.scenes.length - 1].theme,
        });
        return {
          stars,
          coins: 0,
          tip: 0,
          walkout: false,
          mistakes: total.mistakes,
          xp: pay.xp,
          heartsDelta: null,
          hearts: null,
          newUnlocks: [],
          items: [...grades.keys()],
          weak,
          chapterTitle: belmont.chapters.find((c) => c.id === enc.chapterId)?.title_pt ?? null,
          feedback: performanceFeedback({ stars, activities: activities.length, perfect, mistakes: total.mistakes, hints: total.hints, revealed: total.revealed, walkout: false, fast: false }),
          rent: pay,
        };
      }

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
        weak,
        chapterTitle: chapter?.title_pt ?? null,
        feedback: performanceFeedback({
          stars,
          activities: activities.length,
          perfect,
          mistakes: total.mistakes,
          hints: total.hints,
          revealed: total.revealed,
          walkout: fin.walkout,
          fast: durationMs <= targetMs(activities),
        }),
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

  // ── mesa de jogos (Sudoku de inglês) ────────────────────────────────────
  // O puzzle do dia nasce com semente (jogador + dia + tamanho) e fica salvo; reabrir devolve o mesmo.
  const startPuzzle = useCallback(
    async (size: SudokuSize): Promise<PuzzleRow> => {
      const s = snapRef.current!;
      const now = store.now();
      const today = dayKey(now);
      const existing = s.puzzles.find((p) => p.day === today && p.size === size);
      if (existing) return existing;
      const row = await store.startPuzzle(size, makePuzzle(size, s.items, now, `${store.userId}:${today}:${size}`));
      await refresh();
      return row;
    },
    [store, refresh],
  );

  const savePuzzle = useCallback((id: string, progress: SudokuProgress) => store.savePuzzleProgress(id, progress), [store]);

  const finishPuzzle = useCallback(
    async (row: PuzzleRow, progress: SudokuProgress): Promise<PuzzleSummary> => {
      const s = snapRef.current!;
      const now = store.now();
      const grades = wordGrades(row.data, progress, SUDOKU_WORD_BY_ID);
      await store.saveItems(grades.map((g) => review(s.items[g.item_id], g.item_id, g.grade, now)));
      const stars = puzzleStars(progress);
      const t = totals(progress);
      const reward = await store.finishPuzzle(row.id, { stars, mistakes: t.mistakes, hints: t.hints, words: row.data.words.length, progress });
      await refresh();
      const clean = row.data.words.filter((id) => !progress.mistakes[id] && !progress.hints[id]).length;
      return {
        stars,
        coins: reward.coins,
        xp: reward.xp,
        items: grades.map((g) => g.item_id),
        weak: grades.filter((g) => g.grade !== 'good').map((g) => g.item_id),
        feedback: puzzleFeedback(stars, clean, row.data.words.length, t),
      };
    },
    [store, refresh],
  );

  // ── caderninho escrito à mão ────────────────────────────────────────────
  // Palavra nova já entra na revisão (vencida agora, caixa 1) para aparecer em "Revisar".
  const addWord = useCallback(
    async (input: CustomItemInput) => {
      const clean: CustomItemInput = {
        en: input.en.trim(),
        pt: input.pt.trim(),
        example: input.example?.trim() || null,
        source: input.source?.trim() || null,
      };
      const item = await store.addCustomItem(clean);
      const now = store.now().toISOString();
      await store.saveItems([{ item_id: customItemId(item), box: 1, due_at: now, correct: 0, wrong: 0, first_seen_at: now, last_seen_at: now }]);
      await refresh();
    },
    [store, refresh],
  );

  const deleteWord = useCallback(
    async (id: string) => {
      await store.deleteCustomItem(id);
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
  const cafeId = snap?.cafe.id;
  useEffect(() => {
    if (!cafeId || !myName) return;
    presence.current = store.joinPresence(cafeId, { name: myName, appearance: JSON.parse(lookKey) as Appearance | null }, setOthers);
    return () => {
      presence.current?.leave();
      presence.current = null;
      setOthers([]);
    };
  }, [store, cafeId, myName, lookKey]);
  const move = useCallback((p: Position) => presence.current?.move(p), []);

  return { snap, loading: loaded === undefined, needsCafe: loaded === null, error, refresh, sceneCustomers, begin, complete, contribute, gradeItems, others, move, startPuzzle, savePuzzle, finishPuzzle, addWord, deleteWord };
}
