// Atalhos para escrever conteúdo com menos repetição. Geram exatamente o formato de types.ts.
// Convenção: nas perguntas de escolha, a resposta certa vem PRIMEIRO (o jogo embaralha).
import { formatPrice, MENU_BY_NAME } from './menu';
import type { Chapter, Level, Line, Mood, OrderSpec, OrderType, ReplyOption, Scene, Step, Theme } from './types';

export const say = (text: string, pt: string, mood?: Mood, speaker?: string): Line => ({ say: text, pt, ...(mood ? { mood } : {}), ...(speaker ? { speaker } : {}) });

// opção certa / errada de choose_reply
export const ok = (text: string, reaction?: Line, hearts?: number): ReplyOption => ({ text, correct: true, ...(reaction ? { reaction } : {}), ...(hearts ? { hearts } : {}) });
export const no = (text: string, why_pt: string, hearts?: number, reaction?: Line): ReplyOption => ({ text, why_pt, ...(hearts ? { hearts } : {}), ...(reaction ? { reaction } : {}) });

export const choose = (id: string, items: string[], options: ReplyOption[], prompt_pt?: string): Step => ({
  activity: { id, type: 'choose_reply', items, options, ...(prompt_pt ? { prompt_pt } : {}) },
});

export const build = (id: string, items: string[], text: string, pt: string, distractors: string[]): Step => ({
  activity: { id, type: 'build_reply', items, text, pt, distractors },
});

// lacuna: `answers` = string ou lista (a primeira é a principal); `options` opcional (deve conter uma resposta só)
export const gap = (
  id: string,
  items: string[],
  who: 'player' | 'customer',
  before: string,
  answers: string | string[],
  after: string,
  pt: string,
  options?: string[],
): Step => ({
  activity: { id, type: 'gap', items, who, before, after, answers: Array.isArray(answers) ? answers : [answers], pt, ...(options ? { options } : {}) },
});

export const ask = (id: string, items: string[], question: string, options: string[], why_pt?: string): Step => ({
  activity: { id, type: 'comprehension', items, question, options, answer: 0, ...(why_pt ? { why_pt } : {}) },
});

// achar o erro: marque a palavra errada com *asteriscos* ("Did you *went*?") e dê a frase certa
export const spot = (id: string, items: string[], sentence: string, fix: string, why_pt: string): Step => ({
  activity: { id, type: 'spot_error', items, sentence, fix, why_pt },
});

export const recall = (id: string, from: string, items: string[], question: string, options: string[]): Step => ({
  activity: { id, type: 'recall', from, items, question, options, answer: 0 },
});

export const write = (id: string, items: string[], prompt: string, prompt_pt: string, keywords: string[][], examples: string[]): Step => ({
  activity: { id, type: 'free_write', items, prompt, prompt_pt, keywords, examples },
});

export const order = (id: string, items: string[], spec: OrderSpec): Step => ({ activity: { id, type: 'build_order', items, order: spec } });

export const group = (id: string, items: string[], spec: Record<string, number>, choices: string[]): Step => ({
  activity: { id, type: 'group_order', items, order: spec, choices },
});

export const safe = (id: string, items: string[], question: string, avoid: string[], options: string[], why_pt?: string): Step => ({
  activity: { id, type: 'safe_pick', items, question, avoid, options, answer: 0, ...(why_pt ? { why_pt } : {}) },
});

export const recommend = (id: string, items: string[], question: string, wants: string[], options: string[], why_pt?: string): Step => ({
  activity: { id, type: 'recommend', items, question, wants, options, answer: 0, ...(why_pt ? { why_pt } : {}) },
});

// troco: a opção certa é calculada; `wrong` são valores errados em centavos
export const change = (id: string, items: string[], question: string, price_cents: number, paid_cents: number, wrong: number[]): Step => ({
  activity: {
    id,
    type: 'change',
    items,
    question,
    price_cents,
    paid_cents,
    options: [formatPrice(paid_cents - price_cents), ...wrong.map(formatPrice)],
    answer: 0,
  },
});

export const price = (name: string) => MENU_BY_NAME[name]?.price_cents ?? 0;

type Extra = { gapDays?: number; minHearts?: number; long?: boolean };

export const chapter = (
  id: string,
  title_pt: string,
  summary_pt: string,
  theme: Theme,
  level: Level,
  steps: Step[],
  extra: Extra = {},
): Chapter => ({ id, kind: 'chapter', title_pt, summary_pt, theme, level, steps, ...extra });

export const regular = (id: string, theme: Theme, level: Level, steps: Step[]): Scene => ({ id, kind: 'regular', theme, level, steps });

export const talk = (id: string, theme: Theme, level: Level, steps: Step[], withOrder = false): Scene => ({
  id,
  kind: 'talk',
  theme,
  level,
  steps,
  ...(withOrder ? { withOrder } : {}),
});

export const ord = (id: string, orderType: OrderType, theme: Theme, level: Level, steps: Step[], phone = false): Scene => ({
  id,
  kind: 'order',
  orderType,
  theme,
  level,
  steps,
  ...(phone ? { channel: 'phone' as const } : {}),
});
