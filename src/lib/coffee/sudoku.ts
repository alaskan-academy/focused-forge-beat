// Sudoku de inglês (mesa de jogos): gerador com solução única, escolha de palavras pelo SRS,
// tipo de pista de cada casa inicial e pontuação. Lógica pura (sem React/Phaser), testada em coffee.test.ts.
import { SUDOKU_THEMES, sudokuItemId, type SudokuTheme, type SudokuWord } from '@/content/coffee/sudokuWords';
import { isDue, type Grade, type VocabState } from './srs';

export type SudokuSize = 4 | 6 | 9;
export type ClueKind = 'emoji' | 'pt' | 'def' | 'gap';

// blocos: 4×4 → 2×2, 6×6 → 2 linhas × 3 colunas, 9×9 → 3×3
export const BOX: Record<SudokuSize, { r: number; c: number }> = { 4: { r: 2, c: 2 }, 6: { r: 2, c: 3 }, 9: { r: 3, c: 3 } };
// casas iniciais (mais casas = mais fácil)
export const GIVENS: Record<SudokuSize, number> = { 4: 7, 6: 16, 9: 32 };
// nível mínimo para cada tamanho
export const UNLOCK_LEVEL: Record<SudokuSize, number> = { 4: 1, 6: 3, 9: 6 };
// moedas pela conclusão (iguais às da função SQL coffee_finish_puzzle)
export const PUZZLE_COINS: Record<SudokuSize, number> = { 4: 6, 6: 10, 9: 16 };
export const CLUE_REVEAL_COST = 2;

export type SudokuPuzzle = {
  size: SudokuSize;
  theme: string;
  words: string[]; // id da palavra (sudokuWords) de cada símbolo 0..n-1
  solution: number[]; // símbolo de cada casa (linha a linha)
  givens: number[]; // índices das casas iniciais
  clues: Record<number, ClueKind>; // tipo de pista de cada casa inicial
};

export type SudokuProgress = {
  filled: Record<number, number>; // casa → símbolo colocado (só acertos ficam)
  mistakes: Record<string, number>; // palavra → erros
  hints: Record<string, number>; // palavra → dicas pagas (revelar a pista)
  revealed: number[]; // casas iniciais cuja palavra foi revelada
  startedAt: string;
};

export const emptyProgress = (now: Date): SudokuProgress => ({ filled: {}, mistakes: {}, hints: {}, revealed: [], startedAt: now.toISOString() });

// ── aleatório com semente (o puzzle do dia é sempre o mesmo) ────────────────

export function seededRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── grade ───────────────────────────────────────────────────────────────────

export const rowOf = (i: number, n: number) => Math.floor(i / n);
export const colOf = (i: number, n: number) => i % n;
export function boxOf(i: number, size: SudokuSize) {
  const { r, c } = BOX[size];
  return Math.floor(rowOf(i, size) / r) * (size / c) + Math.floor(colOf(i, size) / c);
}

// Grade completa válida: padrão base + embaralhar linhas dentro das faixas, faixas, colunas e símbolos.
export function solvedGrid(size: SudokuSize, rng: () => number): number[] {
  const { r: br, c: bc } = BOX[size];
  const pattern = (r: number, c: number) => (bc * (r % br) + Math.floor(r / br) + c) % size;
  const bands = shuffle([...Array(size / br).keys()], rng);
  const rows = bands.flatMap((b) => shuffle([...Array(br).keys()], rng).map((x) => b * br + x));
  const stacks = shuffle([...Array(size / bc).keys()], rng);
  const cols = stacks.flatMap((s) => shuffle([...Array(bc).keys()], rng).map((x) => s * bc + x));
  const symbols = shuffle([...Array(size).keys()], rng);
  const grid: number[] = [];
  for (const r of rows) for (const c of cols) grid.push(symbols[pattern(r, c)]);
  return grid;
}

export function isValidSolution(grid: number[], size: SudokuSize): boolean {
  const seen = new Set<string>();
  for (let i = 0; i < size * size; i++) {
    const v = grid[i];
    if (v === undefined || v < 0 || v >= size) return false;
    for (const key of [`r${rowOf(i, size)}:${v}`, `c${colOf(i, size)}:${v}`, `b${boxOf(i, size)}:${v}`]) {
      if (seen.has(key)) return false;
      seen.add(key);
    }
  }
  return true;
}

// Conta soluções (para no `limit`). -1 = casa vazia.
export function countSolutions(cells: number[], size: SudokuSize, limit = 2): number {
  const grid = [...cells];
  const n = size;
  const rowM = new Array(n).fill(0);
  const colM = new Array(n).fill(0);
  const boxM = new Array(n).fill(0);
  for (let i = 0; i < n * n; i++) {
    const v = grid[i];
    if (v < 0) continue;
    const bit = 1 << v;
    const [r, c, b] = [rowOf(i, n), colOf(i, n), boxOf(i, size)];
    if (rowM[r] & bit || colM[c] & bit || boxM[b] & bit) return 0;
    rowM[r] |= bit;
    colM[c] |= bit;
    boxM[b] |= bit;
  }
  const full = (1 << n) - 1;
  let count = 0;
  const solve = (): void => {
    if (count >= limit) return;
    // casa vazia com menos opções primeiro
    let best = -1;
    let bestMask = 0;
    let bestCount = n + 1;
    for (let i = 0; i < n * n; i++) {
      if (grid[i] >= 0) continue;
      const mask = full & ~(rowM[rowOf(i, n)] | colM[colOf(i, n)] | boxM[boxOf(i, size)]);
      let k = 0;
      for (let m = mask; m; m &= m - 1) k++;
      if (k < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = k;
        if (k <= 1) break;
      }
    }
    if (best < 0) {
      count++;
      return;
    }
    const [r, c, b] = [rowOf(best, n), colOf(best, n), boxOf(best, size)];
    for (let v = 0; v < n; v++) {
      const bit = 1 << v;
      if (!(bestMask & bit)) continue;
      grid[best] = v;
      rowM[r] |= bit;
      colM[c] |= bit;
      boxM[b] |= bit;
      solve();
      rowM[r] &= ~bit;
      colM[c] &= ~bit;
      boxM[b] &= ~bit;
      grid[best] = -1;
      if (count >= limit) return;
    }
  };
  solve();
  return count;
}

// Tira casas enquanto a solução continuar única, até sobrar `target` casas iniciais.
export function digHoles(solution: number[], size: SudokuSize, target: number, rng: () => number): number[] {
  const cells = [...solution];
  let givens = size * size;
  for (const i of shuffle([...Array(size * size).keys()], rng)) {
    if (givens <= target) break;
    const keep = cells[i];
    cells[i] = -1;
    if (countSolutions(cells, size) === 1) givens--;
    else cells[i] = keep;
  }
  return cells.flatMap((v, i) => (v >= 0 ? [i] : []));
}

// ── palavras e pistas a partir do SRS ───────────────────────────────────────

const box = (states: Record<string, VocabState>, w: SudokuWord) => states[sudokuItemId(w)]?.box ?? 0;

// Tema com mais palavras vencidas (e depois mais novidades); o rng desempata.
export function pickTheme(states: Record<string, VocabState>, now: Date, rng: () => number, size: SudokuSize): SudokuTheme {
  const eligible = SUDOKU_THEMES.filter((t) => t.words.length >= size);
  const scored = shuffle(eligible, rng).map((t) => {
    const due = t.words.filter((w) => states[sudokuItemId(w)] && isDue(states[sudokuItemId(w)], now)).length;
    const unseen = t.words.filter((w) => !states[sudokuItemId(w)]).length;
    return { t, score: due * 2 + Math.min(unseen, size) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].t;
}

// Vencidas primeiro, depois as novas, depois as menos dominadas.
export function pickWords(theme: SudokuTheme, states: Record<string, VocabState>, now: Date, rng: () => number, size: SudokuSize): SudokuWord[] {
  const rank = (w: SudokuWord) => {
    const s = states[sudokuItemId(w)];
    if (s && isDue(s, now)) return 0;
    if (!s) return 1;
    return 2 + s.box;
  };
  const ordered = shuffle(theme.words, rng).sort((a, b) => rank(a) - rank(b));
  return shuffle(ordered.slice(0, size), rng);
}

// Tradução usada como pista: nunca pode conter a palavra em inglês ("mocha (café com chocolate)" → "café com chocolate";
// "banana" → null, essa palavra não ganha pista de tradução).
export function ptClue(w: SudokuWord): string | null {
  const en = w.en.toLowerCase();
  const parts = w.pt
    .split(/[()/]/)
    .map((s) => s.trim())
    .filter((s) => s && !s.toLowerCase().includes(en) && !en.includes(s.toLowerCase()));
  return parts[0] ?? null;
}

// Pistas mais fáceis para palavras pouco dominadas; definições e lacunas para as conhecidas.
// No 4×4 as pistas são mais fáceis; no 9×9, mais difíceis.
export function clueKindsFor(wordBox: number, size: SudokuSize): ClueKind[] {
  const level = wordBox + (size === 4 ? -1 : size === 9 ? 2 : 0);
  if (level <= 0) return ['emoji', 'pt'];
  if (level === 1) return ['emoji', 'pt', 'def'];
  if (level <= 3) return ['pt', 'def', 'gap'];
  return ['def', 'gap'];
}

export function makePuzzle(size: SudokuSize, states: Record<string, VocabState>, now: Date, seed: string): SudokuPuzzle {
  const rng = seededRng(seed);
  const theme = pickTheme(states, now, rng, size);
  const words = pickWords(theme, states, now, rng, size);
  const solution = solvedGrid(size, rng);
  const givens = digHoles(solution, size, GIVENS[size], rng);
  // cada palavra alterna entre os tipos de pista permitidos (a mesma palavra aparece de jeitos diferentes)
  const used: Record<number, number> = {};
  const clues: Record<number, ClueKind> = {};
  const start = Math.floor(rng() * 4);
  for (const i of givens) {
    const sym = solution[i];
    const all = clueKindsFor(box(states, words[sym]), size);
    const kinds = ptClue(words[sym]) ? all : all.filter((k) => k !== 'pt').concat(all.includes('pt') ? ['def'] : []);
    used[sym] = (used[sym] ?? start) + 1;
    clues[i] = kinds[used[sym] % kinds.length];
  }
  return { size, theme: theme.id, words: words.map((w) => w.id), solution, givens, clues };
}

// ── jogo ────────────────────────────────────────────────────────────────────

export const isGiven = (p: SudokuPuzzle, i: number) => p.givens.includes(i);
export const isSolved = (p: SudokuPuzzle, prog: SudokuProgress) =>
  p.solution.every((v, i) => isGiven(p, i) || prog.filled[i] === v);
export const emptyCells = (p: SudokuPuzzle, prog: SudokuProgress) =>
  p.solution.flatMap((_, i) => (isGiven(p, i) || prog.filled[i] !== undefined ? [] : [i]));

export function totals(prog: SudokuProgress) {
  const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
  return { mistakes: sum(prog.mistakes), hints: sum(prog.hints) };
}

// 3 = sem erro e sem dica · 2 = até 2 erros (dicas podem) · 1 = o resto
export function puzzleStars(prog: SudokuProgress): 1 | 2 | 3 {
  const t = totals(prog);
  if (t.mistakes === 0 && t.hints === 0) return 3;
  if (t.mistakes <= 2) return 2;
  return 1;
}

// Nota de cada palavra para o SRS: 2+ erros = errei; 1 erro ou dica = difícil; senão fácil.
export function wordGrades(p: SudokuPuzzle, prog: SudokuProgress, wordById: Record<string, SudokuWord>): { item_id: string; grade: Grade }[] {
  return p.words.map((id) => {
    const m = prog.mistakes[id] ?? 0;
    const h = prog.hints[id] ?? 0;
    const grade: Grade = m >= 2 ? 'fail' : m === 1 || h > 0 ? 'ok' : 'good';
    return { item_id: sudokuItemId(wordById[id]), grade };
  });
}

// Lista ou digitação: digita quando já domina a palavra (caixa 3+), como nas lacunas.
export const typedFor = (wordBox: number) => wordBox >= 3;

// Respostas digitadas: ignora maiúsculas, espaços extras e um artigo no começo.
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^(a|an|the) /, '');
}

// Dia do puzzle no horário de Brasília (igual ao do banco).
export function dayKey(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

// ── resumo ──────────────────────────────────────────────────────────────────

export type PuzzleSummary = {
  stars: 1 | 2 | 3;
  coins: number;
  xp: number;
  items: string[]; // itens de revisão treinados
  weak: string[]; // com erro ou dica: voltam antes na revisão
  feedback: { headline: string; notes: string[] };
};

export function puzzleFeedback(stars: 1 | 2 | 3, clean: number, words: number, t: { mistakes: number; hints: number }) {
  const notes = [`${clean} de ${words} palavras sem erro nem dica`];
  if (stars < 3) {
    const need: string[] = [];
    if (t.mistakes > 0) need.push(t.mistakes === 1 ? 'evitar 1 erro' : `evitar ${t.mistakes} erros`);
    if (t.hints > 0) need.push(t.hints === 1 ? 'não revelar a pista' : 'não revelar pistas');
    notes.push(`Para ⭐⭐⭐: ${need.join(' e ')}.`);
  }
  const headline = stars === 3 ? 'Perfeito! Você decifrou todas as pistas.' : stars === 2 ? 'Muito bom! Quase perfeito.' : 'Resolvido! As palavras difíceis voltam na revisão.';
  return { headline, notes };
}
