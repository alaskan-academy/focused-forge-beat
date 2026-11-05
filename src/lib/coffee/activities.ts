// Regras das atividades (sem UI): conferir respostas, decidir o modo e pontuar.
import { MULTI_FIELDS, SINGLE_FIELDS } from '@/content/coffee/menu';
import type { Activity, FreeWrite, Gap, OrderSpec } from '@/content/coffee/types';
import type { Grade, VocabState } from './srs';

// ── Montar o pedido ─────────────────────────────────────────────────────────

export type OrderSelection = {
  size?: string;
  drink?: string;
  temp?: string;
  milk?: string;
  where?: string;
  extras: string[];
  food: string[];
};

export const emptySelection = (): OrderSelection => ({ extras: [], food: [] });

export function orderFields(spec: OrderSpec): (keyof OrderSpec)[] {
  return [...SINGLE_FIELDS, ...MULTI_FIELDS].filter((f) => spec[f] !== undefined);
}

export function checkOrder(spec: OrderSpec, sel: OrderSelection): { ok: boolean; wrong: (keyof OrderSpec)[] } {
  const wrong: (keyof OrderSpec)[] = [];
  for (const f of SINGLE_FIELDS) {
    const want = spec[f];
    if (want === undefined) continue;
    const accepted = Array.isArray(want) ? want : [want];
    if (!sel[f] || !accepted.includes(sel[f]!)) wrong.push(f);
  }
  for (const f of MULTI_FIELDS) {
    const want = spec[f];
    if (want === undefined) continue;
    const got = sel[f];
    if (got.length !== want.length || !want.every((w) => got.includes(w))) wrong.push(f);
  }
  return { ok: wrong.length === 0, wrong };
}

export function checkGroup(want: Record<string, number>, got: Record<string, number>): { ok: boolean; wrong: string[] } {
  const names = new Set([...Object.keys(want), ...Object.keys(got)]);
  const wrong = [...names].filter((n) => (want[n] ?? 0) !== (got[n] ?? 0));
  return { ok: wrong.length === 0, wrong };
}

// ── Frases ──────────────────────────────────────────────────────────────────

export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export type Tile = { id: number; text: string };

export function shuffle<T>(list: T[], rng: () => number = Math.random): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function buildTiles(text: string, distractors: string[], rng: () => number = Math.random): Tile[] {
  return shuffle(
    [...tokenize(text), ...distractors].map((t, id) => ({ id, text: t })),
    rng,
  );
}

export function checkTiles(text: string, chosen: string[]): boolean {
  const want = tokenize(text);
  return chosen.length === want.length && chosen.every((w, i) => w === want[i]);
}

export function correctPrefix(text: string, chosen: string[]): number {
  const want = tokenize(text);
  let i = 0;
  while (i < chosen.length && i < want.length && chosen[i] === want[i]) i++;
  return i;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' -]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

// 'exact' = certo; 'typo' = quase (1 letra em palavra de 5+ letras); 'wrong' = errado.
export function checkTyped(input: string, answers: string[]): 'exact' | 'typo' | 'wrong' {
  const a = norm(input);
  if (answers.some((b) => norm(b) === a)) return 'exact';
  if (answers.some((b) => norm(b).length >= 5 && levenshtein(a, norm(b)) <= 1)) return 'typo';
  return 'wrong';
}

// Escrita livre: precisa de pelo menos uma palavra de cada grupo. Nunca reprova por gramática.
export function checkFreeWrite(a: FreeWrite, text: string): { ok: boolean; missing: number } {
  const t = ` ${norm(text)} `;
  const words = norm(text).split(' ').filter(Boolean);
  if (words.length < 2) return { ok: false, missing: a.keywords.length };
  const missing = a.keywords.filter((group) => !group.some((k) => t.includes(norm(k)))).length;
  return { ok: missing === 0, missing };
}

// ── Modo e dificuldade ──────────────────────────────────────────────────────

export const TYPED_FROM_BOX = 3;

// Lacuna com opções vira digitação quando o jogador já domina todos os itens dela (caixa 3+).
export function gapMode(a: Gap, states: Record<string, VocabState>): 'options' | 'typed' {
  if (!a.options?.length) return 'typed';
  const mastered = a.items.length > 0 && a.items.every((id) => (states[id]?.box ?? 0) >= TYPED_FROM_BOX);
  return mastered ? 'typed' : 'options';
}

// ── Pontuação ───────────────────────────────────────────────────────────────

export type ActivityResult = {
  activityId: string;
  mistakes: number;
  hints: number;
  revealed: boolean; // desistiu / mostrou a resposta
  hearts: number; // efeito em corações (choose_reply)
  value?: string; // escolha pessoal (choose_reply com `either`), ex.: quem reservou a cabana
};

export function gradeOf(r: ActivityResult): Grade {
  if (r.revealed || r.mistakes >= 2) return 'fail';
  if (r.mistakes === 1 || r.hints > 0) return 'ok';
  return 'good';
}

export const HINT_LINE_COST = 3; // traduzir uma fala
export const HINT_WORD_COST = 2; // traduzir uma palavra/expressão

// Tempo "ágil" de um atendimento: só vira elogio no resumo, nunca tira estrela
// (ler a história com calma faz parte do aprendizado).
export function targetMs(activities: Activity[]): number {
  return 10_000 + activities.length * 20_000;
}

// Estrelas: só a precisão conta.
//  ⭐⭐⭐ nenhum erro, nenhuma dica, nenhuma resposta revelada
//  ⭐⭐  no máximo 1 erro e nenhuma resposta revelada (dicas pagas são permitidas)
//  ⭐   o resto
export function computeStars(r: { mistakes: number; hints: number; revealed: number }): 1 | 2 | 3 {
  if (r.revealed === 0 && r.mistakes === 0 && r.hints === 0) return 3;
  if (r.revealed === 0 && r.mistakes <= 1) return 2;
  return 1;
}

export type Feedback = { headline: string; notes: string[] };

// Comentário curto sobre o desempenho, para o resumo do atendimento.
export function performanceFeedback(r: {
  stars: 1 | 2 | 3;
  activities: number;
  perfect: number; // atividades sem erro, dica nem resposta revelada
  mistakes: number;
  hints: number;
  revealed: number;
  walkout: boolean;
  fast: boolean;
}): Feedback {
  const notes: string[] = [];
  let headline: string;
  if (r.walkout) headline = 'Esse foi difícil. Acontece! Os itens que você errou voltam logo na revisão.';
  else if (r.stars === 3) headline = r.fast ? 'Perfeito e rápido! ⚡' : 'Perfeito! Nenhum erro, nenhuma dica.';
  else if (r.stars === 2) headline = 'Muito bom! Faltou pouco para as 3 estrelas.';
  else headline = 'Valeu o esforço! Cada erro aqui vira treino na revisão.';

  notes.push(`${r.perfect} de ${r.activities} ${r.activities === 1 ? 'atividade' : 'atividades'} de primeira`);
  if (!r.walkout && r.stars < 3) {
    const need: string[] = [];
    if (r.revealed > 0) need.push(r.revealed === 1 ? 'não revelar a resposta' : 'não revelar respostas');
    if (r.mistakes > 0) need.push(r.mistakes === 1 ? 'evitar 1 erro' : `evitar ${r.mistakes} erros`);
    if (r.hints > 0) need.push(r.hints === 1 ? 'não usar a dica' : 'não usar dicas');
    if (need.length) notes.push(`Para ⭐⭐⭐: ${joinPt(need)}.`);
  }
  if (r.stars === 3 && !r.fast) notes.push('Ler com calma vale: a história também é treino de inglês.');
  return { headline, notes };
}

function joinPt(parts: string[]) {
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

// Moedas de um atendimento = pagamento + gorjeta. Mesmos números da função SQL
// coffee_finish_encounter (o servidor é quem credita de verdade).
//  - pagamento: 2 + 2 por atividade
//  - gorjeta: 8, menos 3 por erro (1 erro → 5, 2 erros → 2)
//  - 3 erros ou mais: o cliente vai embora sem pagar (0 moedas; recorrente perde 1 coração)
export const WALKOUT_MISTAKES = 3;
const clampActs = (n: number) => Math.min(10, Math.max(1, n));

export function encounterCoins(activities: number, mistakes: number): { pay: number; tip: number; walkout: boolean; total: number } {
  if (mistakes >= WALKOUT_MISTAKES) return { pay: 0, tip: 0, walkout: true, total: 0 };
  const pay = 2 + clampActs(activities) * 2;
  const tip = Math.max(0, 8 - 3 * mistakes);
  return { pay, tip, walkout: false, total: pay + tip };
}

export const xpFor = (stars: number, activities: number) => stars * 5 + clampActs(activities) * 5;

// Nível: 100 XP para o 2, depois cada nível pede +50 XP a mais.
export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  let need = 100;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level++;
    need += 50;
  }
  return { level, into: rest, needed: need };
}

// ── achar o erro ────────────────────────────────────────────────────────────

// "Did you *went* to the party?" → palavras sem os asteriscos + índice da palavra errada (-1 se não houver)
export function parseSpot(sentence: string): { words: string[]; wrong: number } {
  const raw = sentence.trim().split(/\s+/);
  return { words: raw.map((w) => w.split('*').join('')), wrong: raw.findIndex((w) => w.includes('*')) };
}
