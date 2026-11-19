// Palavras da horta: cada semente traz uma palavra-cola (artigos, conectores, auxiliares, "to",
// condições, frases para não travar e as pequenas que confundem) e regar é um exercício rápido
// com ela, sempre com o "por quê". A maçã dourada pede para montar a frase inteira.
// Plantas antigas (de antes das palavras-cola) continuam com a palavra delas e o exercício antigo.
import { ITEMS, type LearnItem } from '@/content/coffee';
import { GLUE, GLUE_BY_ID, fillGap, showOption, type Drill, type GlueWord } from '@/content/coffee/glue';
import type { VocabState } from './srs';
import type { CropKind } from './garden';

const LEVEL_ORDER: Record<string, number> = { A1: 0, A2: 1, 'A2+': 2, B1: 3, B2: 4 };

// Escolhe a palavra-cola de uma semente: primeiro as nunca vistas (do nível mais fácil), sem repetir
// as que já estão plantadas; se você já viu tudo, as que você menos domina.
export function pickSeedWord(_kind: CropKind, items: Record<string, VocabState>, planted: Set<string>, rand: () => number = Math.random): string {
  const pool: GlueWord[] = GLUE.filter((w) => !planted.has(w.id));
  const fresh = pool.filter((w) => !items[w.id]);
  if (fresh.length) {
    const minLevel = Math.min(...fresh.map((w) => LEVEL_ORDER[w.level] ?? 9));
    const easy = fresh.filter((w) => (LEVEL_ORDER[w.level] ?? 9) <= minLevel);
    return easy[Math.floor(rand() * easy.length)].id;
  }
  const weakest = [...pool].sort((a, b) => (items[a.id]?.box ?? 0) - (items[b.id]?.box ?? 0) || (items[a.id]?.last_seen_at ?? '').localeCompare(items[b.id]?.last_seen_at ?? ''));
  const top = weakest.slice(0, 5);
  return (top[Math.floor(rand() * top.length)] ?? GLUE[0]).id;
}

export type WaterQuiz = {
  type: 'meaning' | 'listen' | 'gap' | 'pick' | 'build';
  prompt: string; // em português (o que fazer)
  shown: string | null; // frase/palavra mostrada (null no "ouça")
  speak: string | null; // texto para o 🔊 (antes de responder)
  options: string[];
  answer: number;
  why?: string; // a regra em uma linha (aparece depois de responder)
  full?: string; // a frase certa inteira (para ouvir depois)
  build?: { tokens: string[]; answer: string[] }; // montar a frase: pedaços embaralhados e a ordem certa
};

export function shuffle<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Um exercício (palavra-cola ou padrão do lago) vira pergunta de múltipla escolha.
export function drillQuiz(d: Drill, why: string, rand: () => number = Math.random): WaterQuiz {
  const [s, a, ...wrong] = d;
  const options = shuffle([a, ...wrong], rand);
  if (s.startsWith('?')) return { type: 'pick', prompt: s.slice(1), shown: null, speak: null, options, answer: options.indexOf(a), why, full: a };
  return { type: 'gap', prompt: 'Complete a frase', shown: s, speak: null, options: options.map(showOption), answer: options.indexOf(a), why, full: fillGap(s, a) };
}

// Montar a frase (maçã dourada): a frase certa de um exercício, em pedaços embaralhados.
export function buildQuiz(w: GlueWord, rand: () => number = Math.random): WaterQuiz {
  const sentences = w.drills.map(([s, a]) => (s.startsWith('?') ? a : fillGap(s, a))).filter((t) => t.split(' ').length >= 3 && t.split(' ').length <= 10);
  const full = sentences[Math.floor(rand() * sentences.length)] ?? fillGap(w.drills[0][0], w.drills[0][1]);
  const answer = full.split(' ');
  let tokens = shuffle([...answer], rand);
  // embaralhado igual ao certo? gira um pouco
  if (tokens.join(' ') === full && tokens.length > 1) tokens = [...tokens.slice(1), tokens[0]];
  return { type: 'build', prompt: w.en.startsWith('∅') ? 'Monte a frase' : `Monte a frase (com “${w.en}”)`, shown: null, speak: null, options: [], answer: -1, why: w.why, full, build: { tokens, answer } };
}

// Exercício de regar para a palavra `itemId`. `stage` alterna o exercício (cada rega é diferente).
// `golden`: maçã dourada → montar a frase.
export function waterQuiz(itemId: string, stage: number, rand: () => number = Math.random, golden = false): WaterQuiz | null {
  const glue = GLUE_BY_ID[itemId];
  if (glue) {
    if (golden) return buildQuiz(glue, rand);
    return drillQuiz(glue.drills[stage % glue.drills.length], glue.why, rand);
  }
  return legacyQuiz(itemId, stage, rand);
}

// ── plantas antigas: vocabulário e chunks (o exercício de antes) ──
const POOL: LearnItem[] = Object.values(ITEMS).filter((i) => (i.kind === 'vocab' || i.kind === 'chunk' || i.kind === 'word') && !!i.en && !i.id.startsWith('f:'));
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function legacyQuiz(itemId: string, stage: number, rand: () => number): WaterQuiz | null {
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
