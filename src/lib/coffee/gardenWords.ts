// Palavras da horta: cada semente traz uma palavra/expressão nova (que você ainda não estudou) e
// regar é um exercício rápido com ela. As douradas sempre trazem um chunk.
import { ITEMS, type LearnItem } from '@/content/coffee';
import type { VocabState } from './srs';
import type { CropKind } from './garden';

const LEVEL_ORDER: Record<string, number> = { A1: 0, A2: 1, 'A2+': 2, B1: 3, B2: 4 };

// itens que podem virar semente (com texto em inglês e tradução)
const POOL: LearnItem[] = Object.values(ITEMS).filter((i) => (i.kind === 'vocab' || i.kind === 'chunk' || i.kind === 'word') && !!i.en && !i.id.startsWith('f:'));

// Escolhe a palavra de uma semente: primeiro as nunca vistas (do nível mais fácil), sem repetir
// as que já estão plantadas; se você já viu tudo, as mais antigas da revisão.
export function pickSeedWord(kind: CropKind, items: Record<string, VocabState>, planted: Set<string>, rand: () => number = Math.random): string {
  const pool = POOL.filter((i) => (kind === 'golden' ? i.kind === 'chunk' : true) && !planted.has(i.id));
  const fresh = pool.filter((i) => !items[i.id]);
  if (fresh.length) {
    const minLevel = Math.min(...fresh.map((i) => LEVEL_ORDER[i.level] ?? 9));
    const easy = fresh.filter((i) => (LEVEL_ORDER[i.level] ?? 9) <= minLevel + 1);
    return easy[Math.floor(rand() * easy.length)].id;
  }
  const seen = [...pool].sort((a, b) => (items[a.id]?.last_seen_at ?? '').localeCompare(items[b.id]?.last_seen_at ?? ''));
  return (seen[0] ?? POOL[0]).id;
}

export type WaterQuiz = {
  type: 'meaning' | 'listen' | 'gap';
  prompt: string; // em português (o que fazer)
  shown: string | null; // frase/palavra mostrada (null no "ouça")
  speak: string | null; // texto para o 🔊
  options: string[];
  answer: number;
};

function shuffle<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Exercício de regar para a palavra `itemId`. `stage` alterna o tipo (cada rega é diferente).
export function waterQuiz(itemId: string, stage: number, rand: () => number = Math.random): WaterQuiz | null {
  const item = ITEMS[itemId];
  if (!item?.en) return null;
  const others = shuffle(
    POOL.filter((i) => i.id !== itemId && i.en!.toLowerCase() !== item.en!.toLowerCase() && i.pt !== item.pt),
    rand,
  );
  const en = item.en;
  const gapOk = !!item.example && new RegExp(`\\b${escape(en)}\\b`, 'i').test(item.example);
  const kinds: WaterQuiz['type'][] = gapOk ? ['meaning', 'listen', 'gap'] : ['meaning', 'listen', 'meaning'];
  const type = kinds[stage % kinds.length];

  if (type === 'meaning') {
    const options = shuffle([item.pt, ...others.slice(0, 2).map((o) => o.pt)], rand);
    return { type, prompt: 'O que significa?', shown: en, speak: en, options, answer: options.indexOf(item.pt) };
  }
  if (type === 'listen') {
    const options = shuffle([en, ...others.slice(0, 2).map((o) => o.en!)], rand);
    return { type, prompt: 'Ouça e escolha o que você ouviu', shown: null, speak: en, options, answer: options.indexOf(en) };
  }
  const sentence = item.example!.replace(new RegExp(`\\b${escape(en)}\\b`, 'i'), '___');
  const options = shuffle([en, ...others.slice(0, 2).map((o) => o.en!)], rand);
  return { type, prompt: 'Complete a frase', shown: sentence, speak: null, options, answer: options.indexOf(en) };
}
