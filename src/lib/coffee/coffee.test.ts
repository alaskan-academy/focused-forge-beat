import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CUSTOMER_SPOTS, DOOR, MAP_ROWS, MAP_W, PLAYER_START, findPath, isWalkable, serveTiles } from './map';
import { BOX_INTERVAL_DAYS, isDue, newToday, review, type VocabState } from './srs';
import { DEFAULT_APPEARANCE, appearanceFromSeed, normalizeAppearance } from './character';
import { checkFreeWrite, checkGroup, checkOrder, checkTyped, computeStars, emptySelection, encounterCoins, gapMode, gradeOf, levelFromXp, performanceFeedback } from './activities';
import { feedText } from './feed';
import { chunkStatus } from './chunkSchedule';
import { UPDATE_NOTES, buildIdFromHtml, currentBuildId, latestBuildId, pickUpdateNote } from './updateCheck';
import { CHUNKS } from '@/content/coffee/chunks';
import { applyEncounter, chapterStatus, emptyArc, heartsDelta } from './arcs';
import { bubbleFor, planEncounter, sceneItems, type PlayerContext } from './director';
import { LocalStore } from './store/localStore';
import { CHARACTER_BY_ID, ORDERS, TALKS } from '@/content/coffee';
import type { FreeWrite, Gap } from '@/content/coffee/types';

const NOW = new Date('2026-11-04T12:00:00Z');
const DAY = 86_400_000;
const at = (days: number) => new Date(NOW.getTime() + days * DAY);

// rng determinístico para os testes
function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('mapa', () => {
  it('todas as linhas têm a mesma largura e a porta é andável', () => {
    MAP_ROWS.forEach((r) => expect(r.length).toBe(MAP_W));
    expect(isWalkable(DOOR.x, DOOR.y)).toBe(true);
  });

  it('jogador chega a todos os lugares de cliente e a porta também', () => {
    for (const s of CUSTOMER_SPOTS) {
      expect(isWalkable(s.x, s.y), s.id).toBe(true);
      expect(findPath(DOOR, s).length, `porta → ${s.id}`).toBeGreaterThan(0);
      const tiles = serveTiles(s);
      expect(tiles.length, `atender ${s.id}`).toBeGreaterThan(0);
      expect(tiles.some((t) => findPath(PLAYER_START, t).length > 0 || (t.x === PLAYER_START.x && t.y === PLAYER_START.y))).toBe(true);
    }
  });

  it('o caminho só passa por tiles andáveis e termina perto de um destino sólido', () => {
    const path = findPath(PLAYER_START, { x: 4, y: 6 }); // mesa
    expect(path.length).toBeGreaterThan(0);
    path.forEach((p) => expect(isWalkable(p.x, p.y)).toBe(true));
    const end = path[path.length - 1];
    expect(Math.abs(end.x - 4) + Math.abs(end.y - 6)).toBe(1);
  });

  it('dá para atender cliente do balcão por trás do balcão', () => {
    expect(serveTiles({ x: 2, y: 5 })).toContainEqual({ x: 2, y: 3 });
  });
});

describe('SRS (Leitner)', () => {
  it('item novo: acerto de primeira vai para a caixa 2 (amanhã); erro fica na 1 (hoje)', () => {
    const good = review(undefined, 'latte', 'good', NOW);
    expect(good.box).toBe(2);
    expect(new Date(good.due_at).getTime() - NOW.getTime()).toBe(BOX_INTERVAL_DAYS[2] * DAY);
    const fail = review(undefined, 'latte', 'fail', NOW);
    expect(fail.box).toBe(1);
    expect(isDue(fail, NOW)).toBe(false);
    expect(isDue(fail, new Date(NOW.getTime() + 30 * 60_000))).toBe(true);
  });

  it('good sobe, ok mantém, fail desce duas (mínimo 1), com teto 5', () => {
    let s = review(undefined, 'x', 'good', NOW); // 2
    s = review(s, 'x', 'good', NOW); // 3
    s = review(s, 'x', 'good', NOW); // 4
    expect(s.box).toBe(4);
    expect(review(s, 'x', 'ok', NOW).box).toBe(4);
    expect(review(s, 'x', 'fail', NOW).box).toBe(2);
    expect(review({ ...s, box: 1 }, 'x', 'fail', NOW).box).toBe(1);
    expect(review({ ...s, box: 5 }, 'x', 'good', NOW).box).toBe(5);
    expect(s.correct).toBe(3);
  });

  it('conta itens novos de hoje', () => {
    const a = review(undefined, 'a', 'good', NOW);
    const b = { ...review(undefined, 'b', 'good', NOW), first_seen_at: '2026-10-01T10:00:00Z' };
    expect(newToday([a, b], NOW)).toBe(1);
  });
});

describe('atividades', () => {
  it('confere pedido montado e pedido em grupo', () => {
    const spec = { size: 'large', drink: 'latte', milk: ['oat milk', 'almond milk'] };
    expect(checkOrder(spec, { ...emptySelection(), size: 'large', drink: 'latte', milk: 'almond milk' }).ok).toBe(true);
    expect(checkOrder(spec, { ...emptySelection(), size: 'small', drink: 'latte', milk: 'oat milk' }).wrong).toEqual(['size']);
    expect(checkGroup({ latte: 2, 'green tea': 1 }, { latte: 2, 'green tea': 1 }).ok).toBe(true);
    expect(checkGroup({ latte: 2 }, { latte: 1, brownie: 1 }).wrong.sort()).toEqual(['brownie', 'latte']);
  });

  it('digitação aceita maiúsculas, várias formas e 1 letra errada em palavras longas', () => {
    expect(checkTyped('Open Until', ['open until'])).toBe('exact');
    expect(checkTyped('practise', ['practice', 'practise'])).toBe('exact');
    expect(checkTyped('open untill', ['open until'])).toBe('typo');
    expect(checkTyped('tide', ['tired'])).toBe('wrong');
  });

  it('escrita livre vale pelo sentido (palavras-chave), não pela gramática', () => {
    const a = { keywords: [['should', 'maybe', 'try']] } as FreeWrite;
    expect(checkFreeWrite(a, 'you should talk with him').ok).toBe(true);
    expect(checkFreeWrite(a, 'maybe him talk good').ok).toBe(true);
    expect(checkFreeWrite(a, 'I like pizza').ok).toBe(false);
    expect(checkFreeWrite(a, 'should').ok).toBe(false); // uma palavra só não vale
  });

  it('lacuna com opções vira digitada quando os itens estão na caixa 3+', () => {
    const gap = { options: ['a', 'b'], items: ['g:should_advice'] } as unknown as Gap;
    expect(gapMode(gap, {})).toBe('options');
    const st = { ...review(undefined, 'g:should_advice', 'good', NOW), box: 3 };
    expect(gapMode(gap, { 'g:should_advice': st })).toBe('typed');
  });

  it('nota, estrelas e nível', () => {
    expect(gradeOf({ activityId: 'x', mistakes: 0, hints: 0, revealed: false, hearts: 0 })).toBe('good');
    expect(gradeOf({ activityId: 'x', mistakes: 0, hints: 1, revealed: false, hearts: 0 })).toBe('ok');
    expect(gradeOf({ activityId: 'x', mistakes: 0, hints: 0, revealed: true, hearts: 0 })).toBe('fail');
    expect(computeStars({ mistakes: 0, hints: 0, revealed: 0 })).toBe(3);
    expect(computeStars({ mistakes: 0, hints: 2, revealed: 0 })).toBe(2);
    expect(computeStars({ mistakes: 1, hints: 1, revealed: 0 })).toBe(2);
    expect(computeStars({ mistakes: 2, hints: 0, revealed: 0 })).toBe(1);
    expect(computeStars({ mistakes: 0, hints: 0, revealed: 1 })).toBe(1);
  });

  it('feedback: diz o que faltou para 3 estrelas e elogia sem cobrar tempo', () => {
    const base = { activities: 3, perfect: 2, mistakes: 1, hints: 1, revealed: 0, walkout: false, fast: false };
    const f2 = performanceFeedback({ ...base, stars: 2 });
    expect(f2.notes).toContain('2 de 3 atividades de primeira');
    expect(f2.notes).toContain('Para ⭐⭐⭐: evitar 1 erro e não usar a dica.');
    const f3 = performanceFeedback({ ...base, stars: 3, perfect: 3, mistakes: 0, hints: 0, fast: true });
    expect(f3.headline).toContain('rápido');
    expect(f3.notes.some((n) => n.startsWith('Para'))).toBe(false);
    expect(performanceFeedback({ ...base, stars: 1, mistakes: 3, walkout: true }).notes.some((n) => n.startsWith('Para'))).toBe(false);
    expect(levelFromXp(250).level).toBe(3);
  });
});

describe('punição: gorjeta e cliente indo embora', () => {
  it('gorjeta cai 3 por erro; com 3 erros o cliente sai sem pagar', () => {
    expect(encounterCoins(3, 0)).toEqual({ pay: 8, tip: 8, walkout: false, total: 16 });
    expect(encounterCoins(3, 1).tip).toBe(5);
    expect(encounterCoins(3, 2).tip).toBe(2);
    expect(encounterCoins(3, 3)).toEqual({ pay: 0, tip: 0, walkout: true, total: 0 });
  });
});

describe('arcos e corações', () => {
  const maya = CHARACTER_BY_ID.maya;

  it('primeiro capítulo está disponível; o próximo só depois de 2 dias', () => {
    const s0 = chapterStatus(maya, undefined, NOW);
    expect(s0.state === 'available' && s0.chapter.id).toBe('maya-1');
    const { arc } = applyEncounter(undefined, 'maya', 'maya-1', 1, NOW);
    expect(chapterStatus(maya, arc, at(1)).state).toBe('waiting');
    const s2 = chapterStatus(maya, arc, at(2));
    expect(s2.state === 'available' && s2.chapter.id).toBe('maya-2');
  });

  it('capítulo especial só aparece com corações suficientes', () => {
    let arc = emptyArc('maya');
    ['maya-1', 'maya-2', 'maya-3', 'maya-4'].forEach((id, i) => (arc = applyEncounter(arc, 'maya', id, 0, at(i * 2)).arc));
    expect(chapterStatus(maya, arc, at(10)).state).toBe('locked');
    arc = { ...arc, hearts: 5 };
    const s = chapterStatus(maya, arc, at(10));
    expect(s.state === 'available' && s.chapter.id).toBe('maya-s1');
    arc = applyEncounter(arc, 'maya', 'maya-s1', 0, at(10)).arc;
    expect(chapterStatus(maya, arc, at(20)).state).toBe('finished');
  });

  it('corações: tom das respostas + 1 a cada 2 acertos de primeira, de 0 a 10, com marcos', () => {
    const r = (mistakes: number, hearts = 0) => ({ activityId: 'a', mistakes, hints: 0, revealed: false, hearts });
    expect(heartsDelta([r(0, 1), r(0), r(1, -1)])).toBe(1);
    const { arc, newUnlocks } = applyEncounter({ ...emptyArc('tom'), hearts: 6 }, 'tom', null, 3, NOW);
    expect(arc.hearts).toBe(9);
    expect(newUnlocks).toEqual(['gift']);
    expect(applyEncounter(arc, 'tom', null, 5, NOW).arc.hearts).toBe(10);
    expect(applyEncounter(arc, 'tom', null, -20, NOW).arc.hearts).toBe(0);
  });
});

describe('diretor', () => {
  const ctx = (patch: Partial<PlayerContext> = {}): PlayerContext => ({ states: {}, arcs: {}, recentScenes: [], lastTheme: null, newToday: 0, ...patch });
  const allSeen = () => {
    const states: Record<string, VocabState> = {};
    for (const s of [...ORDERS, ...TALKS]) for (const id of sceneItems(s)) states[id] = { ...review(undefined, id, 'good', NOW), due_at: at(30).toISOString() };
    return states;
  };

  it('personagem com capítulo liberado conta o capítulo; senão faz um bate-papo de fiel', () => {
    const e1 = planEncounter('tom', ctx(), NOW);
    expect(e1.kind).toBe('chapter');
    expect(e1.chapterId).toBe('tom-1');
    expect(bubbleFor('tom', {}, NOW)).toBe('book');
    const arcs = { tom: applyEncounter(undefined, 'tom', 'tom-1', 1, NOW).arc };
    const e2 = planEncounter('tom', ctx({ arcs }), at(1));
    expect(e2.kind).toBe('regular');
    expect(bubbleFor('tom', arcs, at(1))).toBe('talk');
    const e3 = planEncounter('tom', ctx({ arcs, recentScenes: [e2.scenes[0].id] }), at(1));
    expect(e3.scenes[0].id).not.toBe(e2.scenes[0].id);
  });

  it('cliente avulso: prefere a cena com itens vencidos do jogador', () => {
    const target = ORDERS.find((o) => o.id === 'ord-complaint-01')!;
    const states = allSeen();
    for (const id of sceneItems(target)) states[id] = { ...states[id], due_at: at(-3).toISOString() };
    expect(planEncounter(null, ctx({ states }), NOW, seq(0.5, 0.1)).scenes[0].id).toBe(target.id);
  });

  it('não repete a cena mais recente', () => {
    const first = planEncounter(null, ctx(), NOW, seq(0.5, 0)).scenes[0].id;
    expect(planEncounter(null, ctx({ recentScenes: [first] }), NOW, seq(0.5, 0)).scenes[0].id).not.toBe(first);
  });

  it('recorrente que a outra pessoa ainda não viu termina com uma despedida personalizada', () => {
    const e = planEncounter('maya', ctx(), NOW, Math.random, { name: 'Jessica', pronoun: 'she' });
    expect(e.scenes.map((s) => s.kind)).toEqual(['chapter', 'handoff']);
    const text = JSON.stringify(e.scenes[1]);
    expect(text).toContain('Jessica');
    expect(text).not.toMatch(/\{(partner|sub|Sub|obj|pos|ela|Ela)\}/);
    // sem a outra pessoa esperando, não tem despedida; cliente avulso nunca tem
    expect(planEncounter('maya', ctx(), NOW).scenes.map((s) => s.kind)).toEqual(['chapter']);
    expect(planEncounter(null, ctx(), NOW, Math.random, { name: 'Jessica', pronoun: 'she' }).scenes.every((s) => s.kind !== 'handoff')).toBe(true);
  });

  it('conversa com withOrder emenda um pedido', () => {
    const talk = TALKS.find((t) => t.withOrder)!;
    const states = allSeen();
    for (const id of sceneItems(talk)) states[id] = { ...states[id], due_at: at(-3).toISOString() };
    const e = planEncounter(null, ctx({ states }), NOW, seq(0.05, 0.1));
    expect(e.scenes.map((s) => s.kind)).toEqual(['talk', 'order']);
  });
});

describe('armazenamento local', () => {
  beforeEach(() => localStorage.clear());

  it('café vazio recebe 2 clientes; fila tem limite; relógio avança', async () => {
    const store = new LocalStore();
    await store.spawn([]);
    expect((await store.load())!.customers.length).toBe(2);
    store.advanceDays(1);
    expect(store.clockOffsetDays()).toBe(1);
    for (let i = 0; i < 12; i++) store.callCustomer(null);
    expect((await store.load())!.customers.length).toBeLessThanOrEqual(CUSTOMER_SPOTS.length);
  });

  it('recorrente: cada um conversa uma vez; ele só vai embora depois dos dois', async () => {
    const store = new LocalStore();
    store.callCustomer('tom');
    const [c] = (await store.load())!.customers;
    expect(await store.claim(c.id)).toBe(true);
    const base = { sceneIds: ['tom-1'], characterId: 'tom', chapterId: 'tom-1', stars: 3 as const, activities: 3, mistakes: 0, hints: 0, durationMs: 1000, heartsDelta: 1, items: [] };
    await store.finish({ customerId: c.id, ...base });
    const after = (await store.load())!.customers;
    expect(after).toHaveLength(1); // continua esperando a Jessica
    expect(after[0].served_by).toEqual([store.userId]);
    expect(after[0].status).toBe('waiting');
    expect(await store.claim(c.id)).toBe(false); // eu já conversei nesta visita
    store.partnerServesAll();
    expect((await store.load())!.customers).toEqual([]);
  });

  it('jogando sozinho, o recorrente sai depois de um atendimento', async () => {
    const store = new LocalStore();
    store.togglePartner();
    store.callCustomer('tom');
    const [c] = (await store.load())!.customers;
    await store.claim(c.id);
    await store.finish({ customerId: c.id, sceneIds: ['tom-1'], characterId: 'tom', chapterId: 'tom-1', stars: 3, activities: 3, mistakes: 0, hints: 0, durationMs: 1, heartsDelta: 0, items: [] });
    expect((await store.load())!.customers).toEqual([]);
  });

  it('atender: trava o cliente, credita moedas e tira da fila', async () => {
    const store = new LocalStore();
    store.togglePartner(); // sozinho: o recorrente sai depois de um atendimento
    store.callCustomer('maya');
    const [c] = (await store.load())!.customers;
    expect(c.character_id).toBe('maya');
    expect(await store.claim(c.id)).toBe(true);
    const res = await store.finish({
      customerId: c.id,
      sceneIds: ['maya-1'],
      characterId: 'maya',
      chapterId: 'maya-1',
      stars: 3,
      activities: 3,
      mistakes: 0,
      hints: 0,
      durationMs: 1000,
      heartsDelta: 2,
      items: [],
    });
    expect(res.coins).toBeGreaterThan(0);
    const snap = (await store.load())!;
    expect(snap.customers).toEqual([]);
    expect(snap.me.coins).toBe(30 + res.coins);
    await expect(store.spendCoins(999)).rejects.toThrow();
  });
});

describe('chunk do dia (a cada 12 h)', () => {
  it('primeiro chunk liberado; o próximo só 12 h depois, sem pular nenhum', () => {
    const s0 = chunkStatus({}, NOW);
    expect(s0.available).toBe(true);
    expect(s0.next?.id).toBe(CHUNKS[0].id);
    const states = { [CHUNKS[0].id]: review(undefined, CHUNKS[0].id, 'good', NOW) };
    const s1 = chunkStatus(states, new Date(NOW.getTime() + 11 * 3_600_000));
    expect(s1.available).toBe(false);
    expect(s1.next?.id).toBe(CHUNKS[1].id);
    expect(s1.availableAt?.getTime()).toBe(NOW.getTime() + 12 * 3_600_000);
    // dias sem jogar: o próximo da fila continua sendo o 2º (não pula)
    const s2 = chunkStatus(states, at(5));
    expect(s2.available).toBe(true);
    expect(s2.next?.id).toBe(CHUNKS[1].id);
    expect(s2.learned.map((c) => c.id)).toEqual([CHUNKS[0].id]);
  });
});

describe('mural e melhoria compartilhada', () => {
  beforeEach(() => localStorage.clear());

  it('contribuir desconta moedas, registra no mural e conclui o Cantinho do gato', async () => {
    const store = new LocalStore();
    store.addCoins(500);
    const before = (await store.load())!;
    await store.contribute(before.upgrade!.id, 100);
    let snap = (await store.load())!;
    expect(snap.me.coins).toBe(before.me.coins - 100);
    expect(snap.upgrade!.contributions[store.userId]).toBe(100);
    expect(feedText(snap.feed[0], () => 'Lucas')).toContain('100');
    await store.contribute(snap.upgrade!.id, 999); // só o que falta
    snap = (await store.load())!;
    expect(snap.upgrade!.funded).toBe(300);
    expect(snap.upgrade!.completed_at).not.toBeNull();
    expect(feedText(snap.feed[0], () => 'Lucas')).toContain('completou');
    await expect(store.contribute(snap.upgrade!.id, 10)).rejects.toThrow();
  });

  it('atendimento com 3 erros não paga e aparece no mural', async () => {
    const store = new LocalStore();
    store.togglePartner();
    store.callCustomer(null);
    const c = (await store.load())!.customers[0];
    await store.claim(c.id);
    const res = await store.finish({ customerId: c.id, sceneIds: ['ord-basic-01'], characterId: null, chapterId: null, stars: 1, activities: 2, mistakes: 3, hints: 0, durationMs: 1, heartsDelta: 0, items: [] });
    expect(res).toMatchObject({ coins: 0, walkout: true });
    const snap = (await store.load())!;
    expect(feedText(snap.feed[0], () => 'Lucas')).toContain('sem pagar');
  });
});

describe('personagem', () => {
  it('normaliza dados quebrados para algo válido', () => {
    expect(normalizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance({ hair: { style: 'moicano', color: 'red' } }).hair).toEqual(DEFAULT_APPEARANCE.hair);
  });

  it('aparência por semente é determinística', () => {
    expect(appearanceFromSeed(42)).toEqual(appearanceFromSeed(42));
  });
});

describe('aviso de versão nova', () => {
  it('lê o id da versão no index.html e no documento', () => {
    expect(buildIdFromHtml('<script type="module" crossorigin src="/assets/index-Cw4kMdaz.js"></script>')).toBe('/assets/index-Cw4kMdaz.js');
    expect(buildIdFromHtml('<script src="/src/main.tsx"></script>')).toBeNull();
    const doc = new DOMParser().parseFromString('<html><head><script src="/assets/index-Ab_1.js"></script></head></html>', 'text/html');
    expect(currentBuildId(doc)).toBe('/assets/index-Ab_1.js');
  });

  it('busca a versão publicada sem cache', async () => {
    const fetcher = vi.fn(async (_url: string, _init?: RequestInit) => new Response('<script src="/assets/index-NEW1.js"></script>'));
    expect(await latestBuildId(fetcher as unknown as typeof fetch)).toBe('/assets/index-NEW1.js');
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: 'no-store' });
  });

  it('sorteia entre os 5 avisos; o da fofoca só com parceiro e com o nome dele', () => {
    expect(UPDATE_NOTES).toHaveLength(5);
    const seen = new Set(Array.from({ length: 5 }, (_, i) => pickUpdateNote('Jessica', () => i / 5).title));
    expect(seen.size).toBe(5);
    expect(pickUpdateNote('Jessica', () => 0.99).body).toContain('Jessica já está jogando');
    for (let i = 0; i < 4; i++) expect(pickUpdateNote(null, () => i / 4 + 0.01).body).not.toContain('{partner}');
    expect(UPDATE_NOTES[0].body).toContain('Elias');
  });
});
