import { describe, expect, it } from 'vitest';
import { ITEMS } from '@/content/coffee';
import { GLUE, GLUE_GROUPS, fillGap, type Drill } from '@/content/coffee/glue';
import { PATTERNS, PATTERN_CHUNKS } from '@/content/coffee/patterns';
import { buildQuiz, drillQuiz, pickSeedWord, waterQuiz } from './gardenWords';
import { fishLesson, nextPattern, unlockedCount, PATTERN_OPEN_AT_START } from './lakePatterns';
import type { VocabState } from './srs';

// cada exercício: frase com exatamente um ___ (ou pergunta "?"), 3 opções diferentes
function checkDrill(d: Drill, where: string) {
  const [s, a, ...wrong] = d;
  expect(wrong, where).toHaveLength(2);
  expect(new Set([a, ...wrong]).size, `${where}: opções repetidas`).toBe(3);
  if (s.startsWith('?')) expect(s.length, where).toBeGreaterThan(5);
  else {
    expect(s.split('___').length - 1, `${where}: precisa de um ___`).toBe(1);
    // a frase certa não pode ter espaço antes de apóstrofo ("I 'll")
    expect(fillGap(s, a), where).not.toMatch(/ '/);
  }
}

describe('palavras-cola (horta)', () => {
  it('ids únicos, todos os grupos com palavras e 3+ exercícios cada', () => {
    expect(new Set(GLUE.map((w) => w.id)).size).toBe(GLUE.length);
    for (const g of Object.keys(GLUE_GROUPS)) expect(GLUE.filter((w) => w.group === g).length, g).toBeGreaterThanOrEqual(5);
    for (const w of GLUE) {
      expect(w.id.startsWith('gl:')).toBe(true);
      expect(w.why.length).toBeGreaterThan(20);
      expect(w.drills.length, w.id).toBeGreaterThanOrEqual(3);
      w.drills.forEach((d, i) => checkDrill(d, `${w.id}#${i}`));
      expect(ITEMS[w.id]?.kind).toBe('glue');
    }
  });

  it('regar: cada rega muda o exercício e sempre traz o "por quê" e a frase certa', () => {
    const w = GLUE[0];
    const seen = new Set<string>();
    for (let s = 0; s < 3; s++) {
      const q = waterQuiz(w.id, s, () => 0.4)!;
      expect(q.options).toHaveLength(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.why).toBe(w.why);
      expect(q.full).toBeTruthy();
      seen.add(q.shown ?? q.prompt);
    }
    expect(seen.size).toBe(3);
  });

  it('maçã dourada: montar a frase com os mesmos pedaços da frase certa', () => {
    for (const w of GLUE) {
      const q = buildQuiz(w, () => 0.3);
      expect(q.build!.tokens.slice().sort()).toEqual(q.build!.answer.slice().sort());
      expect(q.build!.answer.join(' ')).toBe(q.full);
      expect(waterQuiz(w.id, 0, () => 0.3, true)!.type).toBe('build');
    }
  });

  it('sementes: primeiro as mais fáceis nunca vistas; depois as menos dominadas', () => {
    const first = pickSeedWord('herb', {}, new Set(), () => 0);
    expect(ITEMS[first].level).toBe('A2');
    const all: Record<string, VocabState> = Object.fromEntries(GLUE.map((w) => [w.id, { item_id: w.id, box: 5, due_at: '', first_seen_at: '', last_seen_at: '2026-01-01' } as unknown as VocabState]));
    all['gl:unless'] = { ...all['gl:unless'], box: 1 };
    expect(pickSeedWord('herb', all, new Set(), () => 0)).toBe('gl:unless');
  });

  it('pergunta "?": as opções são frases e a certa é a frase inteira', () => {
    const d: Drill = ['?Diga oi', 'Hi!', 'Ho!', 'Ha!'];
    const q = drillQuiz(d, 'porque sim', () => 0.2);
    expect(q.type).toBe('pick');
    expect(q.options[q.answer]).toBe('Hi!');
    expect(q.full).toBe('Hi!');
  });
});

describe('padrões do dia a dia (lago)', () => {
  it('cada família tem os 4 níveis com 3+ frases e 3 chunks; ids únicos', () => {
    expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(PATTERNS.length);
    expect(new Set(PATTERN_CHUNKS.map((c) => c.id)).size).toBe(PATTERN_CHUNKS.length);
    for (const p of PATTERNS) {
      expect(p.id.startsWith('pf:')).toBe(true);
      expect(p.chunks).toHaveLength(3);
      for (const tier of ['basic', 'negq', 'past', 'say'] as const) {
        expect(p.tiers[tier].length, `${p.id} ${tier}`).toBeGreaterThanOrEqual(3);
        p.tiers[tier].forEach((d, i) => checkDrill(d, `${p.id}.${tier}#${i}`));
      }
      expect(ITEMS[p.id]?.kind).toBe('pattern');
      for (const c of p.chunks) expect(ITEMS[c.id]?.kind).toBe('chunk');
    }
  });

  it('liberação: 4 no começo e um novo a cada 2 dias', () => {
    const day = (d: string) => new Date(`${d}T12:00:00-03:00`);
    expect(unlockedCount(day('2026-11-19'))).toBe(PATTERN_OPEN_AT_START);
    expect(unlockedCount(day('2026-11-20'))).toBe(PATTERN_OPEN_AT_START);
    expect(unlockedCount(day('2026-11-21'))).toBe(PATTERN_OPEN_AT_START + 1);
    expect(unlockedCount(day('2027-06-01'))).toBe(PATTERNS.length);
    expect(nextPattern(day('2026-11-19'))!.family.id).toBe(PATTERNS[PATTERN_OPEN_AT_START].id);
    expect(nextPattern(day('2027-06-01'))).toBeNull();
  });

  it('peixe: padrão liberado, nível pela raridade e um chunk ainda não pescado', () => {
    const now = new Date('2026-11-19T15:00:00-03:00');
    const open = new Set(PATTERNS.slice(0, PATTERN_OPEN_AT_START).map((p) => p.id));
    for (const rarity of ['common', 'uncommon', 'rare', 'legendary'] as const) {
      const l = fishLesson(rarity, {}, now, () => 0.3)!;
      expect(open.has(l.familyId)).toBe(true);
      expect(l.tier).toBe({ common: 'basic', uncommon: 'negq', rare: 'past', legendary: 'say' }[rarity]);
      expect(l.quiz.options).toHaveLength(3);
      expect(l.chunkId.startsWith('pc:')).toBe(true);
    }
    expect(fishLesson('junk', {}, now)).toBeNull();
    // chunk já pescado não se repete enquanto houver outro na família
    const fam = PATTERNS[0];
    const states = { [fam.chunks[0].id]: {} as VocabState, [fam.chunks[1].id]: {} as VocabState };
    for (let i = 0; i < 20; i++) {
      const l = fishLesson('common', states, now)!;
      if (l.familyId === fam.id) expect(l.chunkId).toBe(fam.chunks[2].id);
    }
  });
});
