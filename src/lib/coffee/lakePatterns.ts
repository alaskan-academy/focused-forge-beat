// Lago: cada peixe fisgado treina um padrão do dia a dia (there is/are, should, could, would…)
// e traz um chunk ligado a ele. Quanto mais raro o peixe, mais difícil a variação.
// Os padrões vão sendo liberados com o tempo (mesma data para os dois): 4 já abertos e um novo
// a cada PATTERN_EVERY_DAYS dias, na ordem de content/coffee/patterns.ts.
import { PATTERNS, type PatternFamily, type PatternTier } from '@/content/coffee/patterns';
import { drillQuiz, type WaterQuiz } from './gardenWords';
import type { Rarity } from './fishing';
import type { VocabState } from './srs';

export const PATTERN_START = '2026-11-19'; // dia em que o lago começou a ensinar padrões (Brasília)
export const PATTERN_EVERY_DAYS = 2;
export const PATTERN_OPEN_AT_START = 4;

const DAY = 86_400_000;
const startMs = () => new Date(`${PATTERN_START}T00:00:00-03:00`).getTime();

export function unlockedCount(now: Date): number {
  const days = Math.floor((now.getTime() - startMs()) / DAY);
  return Math.min(PATTERNS.length, PATTERN_OPEN_AT_START + Math.max(0, Math.floor(days / PATTERN_EVERY_DAYS)));
}

export function unlockedPatterns(now: Date): PatternFamily[] {
  return PATTERNS.slice(0, unlockedCount(now));
}

// próximo padrão a ser liberado e quando (null = todos já abertos)
export function nextPattern(now: Date): { family: PatternFamily; at: Date } | null {
  const n = unlockedCount(now);
  if (n >= PATTERNS.length) return null;
  const at = new Date(startMs() + (n - PATTERN_OPEN_AT_START + 1) * PATTERN_EVERY_DAYS * DAY);
  return { family: PATTERNS[n], at };
}

export const RARITY_TIER: Record<Exclude<Rarity, 'junk'>, PatternTier> = { common: 'basic', uncommon: 'negq', rare: 'past', legendary: 'say' };

export type FishLesson = { familyId: string; chunkId: string; tier: PatternTier; quiz: WaterQuiz };

// Escolhe o padrão do peixe: um dos que você menos domina entre os liberados (o mais novo tem
// preferência quando ainda nem foi visto), uma frase do nível da raridade e um chunk ainda não pescado.
export function fishLesson(rarity: Rarity, states: Record<string, VocabState>, now: Date, rand: () => number = Math.random): FishLesson | null {
  if (rarity === 'junk') return null;
  const open = unlockedPatterns(now);
  if (!open.length) return null;
  const unseen = open.filter((p) => !states[p.id]);
  const ranked = [...open].sort((a, b) => (states[a.id]?.box ?? -1) - (states[b.id]?.box ?? -1) || (states[a.id]?.last_seen_at ?? '').localeCompare(states[b.id]?.last_seen_at ?? ''));
  const pool = unseen.length && rand() < 0.6 ? unseen : ranked.slice(0, 3);
  const family = pool[Math.floor(rand() * pool.length)];
  const tier = RARITY_TIER[rarity];
  const drills = family.tiers[tier];
  const quiz = drillQuiz(drills[Math.floor(rand() * drills.length)], family.pt, rand);
  const fresh = family.chunks.filter((c) => !states[c.id]);
  const chunks = fresh.length ? fresh : family.chunks;
  return { familyId: family.id, chunkId: chunks[Math.floor(rand() * chunks.length)].id, tier, quiz };
}

// quanto você domina de um padrão (caixa do SRS de 0 a 5) — para o álbum
export function patternMastery(p: PatternFamily, states: Record<string, VocabState>) {
  return { box: states[p.id]?.box ?? 0, seen: !!states[p.id], chunks: p.chunks.filter((c) => states[c.id]).length };
}
