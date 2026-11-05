// Arcos de clientes recorrentes: qual capítulo está disponível para cada jogador e corações.
import type { Chapter, Character } from '@/content/coffee/types';
import type { ActivityResult } from './activities';
import { gradeOf } from './activities';

export const MAX_HEARTS = 10;
export const DEFAULT_GAP_DAYS = 2;
const DAY = 86_400_000;

export type ArcState = {
  character_id: string;
  done: string[]; // ids de capítulos concluídos
  last_chapter_at: string | null;
  hearts: number; // 0..10
  unlocks: string[]; // marcos alcançados ('gift', 'photo')
};

export const emptyArc = (characterId: string): ArcState => ({ character_id: characterId, done: [], last_chapter_at: null, hearts: 0, unlocks: [] });

// Marcos de amizade (capítulos especiais são liberados pelo `minHearts` de cada capítulo).
export const MILESTONES: { hearts: number; unlock: string; label_pt: string }[] = [
  { hearts: 7, unlock: 'gift', label_pt: 'Presente para o café' },
  { hearts: 10, unlock: 'photo', label_pt: 'Foto no caderninho' },
];

export const isSpecial = (c: Chapter) => (c.minHearts ?? 0) > 0;

export type ChapterStatus =
  | { state: 'available'; chapter: Chapter }
  | { state: 'waiting'; chapter: Chapter; availableAt: Date }
  | { state: 'locked'; chapter: Chapter; needHearts: number }
  | { state: 'finished' };

// Próximo capítulo de um personagem para um jogador.
// Capítulos principais em ordem; quando acabam (ou estão esperando), especiais liberados por corações.
export function chapterStatus(char: Character, arc: ArcState | undefined, now: Date): ChapterStatus {
  const a = arc ?? emptyArc(char.id);
  const last = a.last_chapter_at ? new Date(a.last_chapter_at).getTime() : null;
  const readyAt = (c: Chapter) => (last === null ? 0 : last + (c.gapDays ?? DEFAULT_GAP_DAYS) * DAY);

  const main = char.chapters.find((c) => !isSpecial(c) && !a.done.includes(c.id));
  if (main && readyAt(main) <= now.getTime()) return { state: 'available', chapter: main };

  const special = char.chapters.find((c) => isSpecial(c) && !a.done.includes(c.id));
  if (special && a.hearts >= (special.minHearts ?? 0) && readyAt(special) <= now.getTime()) return { state: 'available', chapter: special };

  if (main) return { state: 'waiting', chapter: main, availableAt: new Date(readyAt(main)) };
  if (special && a.hearts < (special.minHearts ?? 0)) return { state: 'locked', chapter: special, needHearts: special.minHearts ?? 0 };
  if (special) return { state: 'waiting', chapter: special, availableAt: new Date(readyAt(special)) };
  return { state: 'finished' };
}

// Corações ganhos num encontro: as reações de tom (choose_reply) + 1 a cada 2 atividades acertadas de primeira.
export function heartsDelta(results: ActivityResult[]): number {
  const tone = results.reduce((s, r) => s + r.hearts, 0);
  const firstTry = results.filter((r) => gradeOf(r) === 'good').length;
  return tone + Math.floor(firstTry / 2);
}

export function applyEncounter(
  arc: ArcState | undefined,
  characterId: string,
  chapterId: string | null,
  delta: number,
  now: Date,
): { arc: ArcState; newUnlocks: string[] } {
  const a = arc ?? emptyArc(characterId);
  const hearts = Math.max(0, Math.min(MAX_HEARTS, a.hearts + delta));
  const newUnlocks = MILESTONES.filter((m) => hearts >= m.hearts && !a.unlocks.includes(m.unlock)).map((m) => m.unlock);
  return {
    arc: {
      ...a,
      hearts,
      done: chapterId && !a.done.includes(chapterId) ? [...a.done, chapterId] : a.done,
      last_chapter_at: chapterId ? now.toISOString() : a.last_chapter_at,
      unlocks: [...a.unlocks, ...newUnlocks],
    },
    newUnlocks,
  };
}
