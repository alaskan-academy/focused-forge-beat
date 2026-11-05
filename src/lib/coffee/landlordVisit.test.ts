import { describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { LANDLORD_CUSTOMER_ID, useCoffeeGame } from '@/components/coffee/useCoffeeGame';
import { sceneActivities } from './director';
import { memoryScene, negotiationDiscount, personalizeBelmont, planLandlordVisit } from './landlordVisit';
import { LocalStore } from './store/localStore';
import { BELMONT_BILLS } from '@/content/coffee/characters/belmont';
import type { LandlordBill } from './landlord';
import type { ActivityResult } from './activities';

const bill: LandlordBill = { ready: true, first: false, visits: 1, earned: 60, errors: 4, upgrades: 0, rent: 19, error_fee: 4, debt: 12, total: 35, coins: 20, booked_by_me: true };
const now = new Date('2026-11-06T15:00:00Z');
const partner = { name: 'Jessica', pronoun: 'she' as const };

describe('Belmont: montagem da visita', () => {
  it('primeira visita = capítulo 1 sozinho (ele já leva tudo nele)', () => {
    const enc = planLandlordVisit({ arcs: {}, recentScenes: [], bill: { ...bill, first: true, visits: 0 }, partner, bookedByMe: null, feed: [], userId: 'me', now });
    expect(enc).toMatchObject({ kind: 'landlord', characterId: 'belmont', chapterId: 'belmont-1' });
    expect(enc.scenes).toHaveLength(1);
    expect(JSON.stringify(enc.scenes)).toContain('You, or Jessica?');
    expect(JSON.stringify(enc.scenes)).toContain('That\'s 20 coins');
  });

  it('depois: visita + pergunta do que você fez + conta com os números de hoje', () => {
    const feed = [{ id: 'f', user_id: 'me', kind: 'served', data: { character: 'tom' }, created_at: '2026-11-06T10:00:00Z' }];
    const arcs = { belmont: { character_id: 'belmont', done: ['belmont-1', 'belmont-2', 'belmont-3', 'belmont-4', 'belmont-5'], last_chapter_at: '2026-11-01T00:00:00Z', hearts: 0, unlocks: [] } };
    const enc = planLandlordVisit({ arcs, recentScenes: [], bill, partner, bookedByMe: true, feed, userId: 'me', now });
    expect(enc.chapterId).toBeNull();
    expect(enc.scenes.map((s) => s.id)).toEqual([expect.stringMatching(/^belmont-v-/), 'belmont-memory', expect.stringMatching(/^belmont-bill-/)]);
    const text = JSON.stringify(enc.scenes);
    expect(text).not.toMatch(/\{(rent|fee|debt|total|earned|errors|coins|partner|Sub|Booker|booker)\}/);
    expect(text).toContain('Total: 35');
    const memory = sceneActivities(enc.scenes[1])[0];
    expect(memory.type === 'comprehension' && memory.options[memory.answer]).toBe('Tom');
  });

  it('{booker}: "you" se foi você que reservou, senão o nome da outra pessoa', () => {
    const scene = { id: 'x', kind: 'regular' as const, theme: 'life' as const, level: 'B1' as const, steps: [{ say: '{Booker} booked it.', pt: '{Booker_pt} reservou.' }] };
    expect(JSON.stringify(personalizeBelmont(scene, { bill, partner, bookedByMe: true }))).toContain('You booked it.');
    expect(JSON.stringify(personalizeBelmont(scene, { bill, partner, bookedByMe: false }))).toContain('Jessica booked it.');
  });

  it('sem conversa recente, não há pergunta de memória', () => {
    expect(memoryScene({ feed: [], userId: 'me', now })).toBeNull();
  });

  it('desconto: negociar certo de primeira vale 5', () => {
    const r = (mistakes: number): ActivityResult[] => [{ activityId: 'negotiate', mistakes, hints: 0, revealed: false, hearts: 0 }];
    expect(negotiationDiscount(r(0))).toBe(5);
    expect(negotiationDiscount(r(1))).toBe(0);
    expect(BELMONT_BILLS.every((b) => sceneActivities(b).some((a) => a.id === 'negotiate'))).toBe(true);
  });
});

describe('Belmont: no jogo (dados locais)', () => {
  it('aparece só depois de jogar no dia, leva tudo na 1ª visita, guarda quem reservou e cobra com dívida na 2ª', async () => {
    localStorage.clear();
    const store = new LocalStore();
    const { result } = renderHook(() => useCoffeeGame(store));
    await waitFor(() => expect(result.current.snap).toBeTruthy());
    expect(result.current.sceneCustomers.some((c) => c.id === LANDLORD_CUSTOMER_ID)).toBe(false);

    // jogou hoje → ele aparece na porta
    store.callLandlord();
    await act(() => result.current.refresh());
    const door = result.current.sceneCustomers.find((c) => c.id === LANDLORD_CUSTOMER_ID);
    expect(door).toMatchObject({ bubble: 'bill', name: 'Belmont Sulphur', spotId: 'landlord' });

    // 1ª visita: capítulo 1, responde "She did." e perde todas as moedas
    const coins = result.current.snap!.me.coins;
    const active = (await result.current.begin(LANDLORD_CUSTOMER_ID)) as Exclude<Awaited<ReturnType<typeof result.current.begin>>, 'busy' | null>;
    expect(active.encounter.chapterId).toBe('belmont-1');
    const results: ActivityResult[] = sceneActivities(active.encounter.scenes[0]).map((a) => ({
      activityId: a.id,
      mistakes: 0,
      hints: 0,
      revealed: false,
      hearts: 0,
      ...(a.id === 'booked' ? { value: 'partner' } : {}),
    }));
    let summary!: Awaited<ReturnType<typeof result.current.complete>>;
    await act(async () => {
      summary = await result.current.complete(active, results, 60_000);
    });
    expect(summary.rent).toMatchObject({ first: true, paid: coins, debt: 0 });
    expect(result.current.snap!.me.coins).toBe(0);
    expect(result.current.snap!.landlord).toMatchObject({ ready: false, booked_by_me: false });
    expect(result.current.snap!.arcs.belmont.done).toContain('belmont-1');
    expect(result.current.sceneCustomers.some((c) => c.id === LANDLORD_CUSTOMER_ID)).toBe(false);

    // dia seguinte, sem dinheiro: aluguel vira dívida
    store.advanceDays(1);
    store.callLandlord();
    await act(() => result.current.refresh());
    const second = (await result.current.begin(LANDLORD_CUSTOMER_ID)) as typeof active;
    expect(second.encounter.chapterId).toBe('belmont-2');
    expect(JSON.stringify(second.encounter.scenes[0])).toContain('Jessica booked it as a gift');
    await act(async () => {
      summary = await result.current.complete(second, [], 60_000);
    });
    expect(summary.rent).toMatchObject({ first: false, paid: 0, rent: 10, debt: 10 });
    expect(result.current.snap!.landlord!.debt).toBe(10);
  });
});
