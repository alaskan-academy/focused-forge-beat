import { describe, expect, it } from 'vitest';
import { SUDOKU_THEMES, SUDOKU_WORDS, sudokuItemId } from '@/content/coffee/sudokuWords';
import { ITEMS } from '@/content/coffee';
import {
  boxOf,
  clueKindsFor,
  countSolutions,
  dayKey,
  emptyProgress,
  isSolved,
  isValidSolution,
  makePuzzle,
  normalizeAnswer,
  pickWords,
  ptClue,
  puzzleStars,
  seededRng,
  solvedGrid,
  wordGrades,
  type SudokuSize,
} from './sudoku';
import type { VocabState } from './srs';

const WORD = Object.fromEntries(SUDOKU_WORDS.map((w) => [w.id, w]));
const now = new Date('2026-11-05T15:00:00Z');
const st = (item_id: string, box: number, due: string): VocabState => ({ item_id, box, due_at: due, correct: 1, wrong: 0, first_seen_at: due, last_seen_at: due });

describe('Sudoku: gerador', () => {
  it('blocos certos: 6×6 tem blocos de 2 linhas × 3 colunas', () => {
    expect(boxOf(0, 6)).toBe(0);
    expect(boxOf(2, 6)).toBe(0);
    expect(boxOf(3, 6)).toBe(1);
    expect(boxOf(6, 6)).toBe(0); // linha 1, coluna 0
    expect(boxOf(12, 6)).toBe(2); // linha 2, coluna 0
  });

  for (const size of [4, 6, 9] as SudokuSize[])
    it(`${size}×${size}: grade completa válida e puzzle com solução única`, () => {
      for (let k = 0; k < 8; k++) {
        const rng = seededRng(`t${size}-${k}`);
        const grid = solvedGrid(size, rng);
        expect(isValidSolution(grid, size)).toBe(true);
        const p = makePuzzle(size, {}, now, `seed-${size}-${k}`);
        expect(isValidSolution(p.solution, size)).toBe(true);
        const cells = p.solution.map((v, i) => (p.givens.includes(i) ? v : -1));
        expect(countSolutions(cells, size)).toBe(1);
        expect(p.words).toHaveLength(size);
        expect(new Set(p.words).size).toBe(size);
        p.givens.forEach((i) => expect(p.clues[i]).toBeDefined());
      }
    });

  it('mesma semente = mesmo puzzle (o puzzle do dia não muda ao recarregar)', () => {
    expect(makePuzzle(6, {}, now, 'u1:2026-11-05:6')).toEqual(makePuzzle(6, {}, now, 'u1:2026-11-05:6'));
    expect(makePuzzle(6, {}, now, 'u1:2026-11-05:6')).not.toEqual(makePuzzle(6, {}, now, 'u2:2026-11-05:6'));
  });

  it('detecta grade com mais de uma solução', () => {
    expect(countSolutions(new Array(16).fill(-1), 4)).toBe(2);
  });
});

describe('Sudoku: SRS', () => {
  it('prioriza palavras vencidas', () => {
    const theme = SUDOKU_THEMES.find((t) => t.id === 'animals')!;
    const states = { 'w:bee': st('w:bee', 3, '2026-11-01T00:00:00Z'), 'w:duck': st('w:duck', 3, '2026-11-01T00:00:00Z') };
    for (let k = 0; k < 5; k++) {
      const ids = pickWords(theme, states, now, seededRng(`p${k}`), 4).map((w) => w.id);
      expect(ids).toContain('bee');
      expect(ids).toContain('duck');
    }
  });

  it('pistas fáceis para quem não domina; definição/lacuna para quem já sabe', () => {
    expect(clueKindsFor(0, 4)).toEqual(['emoji', 'pt']);
    expect(clueKindsFor(5, 6)).toEqual(['def', 'gap']);
    expect(clueKindsFor(0, 9)).not.toContain('emoji');
  });

  it('notas por palavra e estrelas', () => {
    const p = makePuzzle(4, {}, now, 'g');
    const prog = emptyProgress(now);
    prog.mistakes[p.words[0]] = 2;
    prog.hints[p.words[1]] = 1;
    const grades = Object.fromEntries(wordGrades(p, prog, WORD).map((g) => [g.item_id, g.grade]));
    expect(grades[sudokuItemId(WORD[p.words[0]])]).toBe('fail');
    expect(grades[sudokuItemId(WORD[p.words[1]])]).toBe('ok');
    expect(grades[sudokuItemId(WORD[p.words[2]])]).toBe('good');
    expect(puzzleStars(prog)).toBe(2);
    expect(puzzleStars(emptyProgress(now))).toBe(3);
    prog.mistakes[p.words[3]] = 1;
    expect(puzzleStars(prog)).toBe(1);
  });

  it('resolvido quando todas as casas vazias têm o símbolo certo', () => {
    const p = makePuzzle(4, {}, now, 'solve');
    const prog = emptyProgress(now);
    expect(isSolved(p, prog)).toBe(false);
    p.solution.forEach((v, i) => {
      if (!p.givens.includes(i)) prog.filled[i] = v;
    });
    expect(isSolved(p, prog)).toBe(true);
  });

  it('resposta digitada aceita maiúsculas, espaços e artigo', () => {
    expect(normalizeAnswer('  The  Hot   Chocolate ')).toBe('hot chocolate');
    expect(normalizeAnswer('an apple')).toBe('apple');
  });

  it('dia no horário de Brasília', () => {
    expect(dayKey(new Date('2026-11-06T02:30:00Z'))).toBe('2026-11-05'); // 23:30 em Brasília
  });
});

describe('Sudoku: conteúdo', () => {
  it('cada tema tem 9+ palavras com as 4 pistas; ids únicos', () => {
    expect(new Set(SUDOKU_WORDS.map((w) => w.id)).size).toBe(SUDOKU_WORDS.length);
    for (const t of SUDOKU_THEMES) {
      expect(t.words.length, t.id).toBeGreaterThanOrEqual(9);
      expect(new Set(t.words.map((w) => w.emoji)).size, `${t.id}: emojis repetidos`).toBe(t.words.length);
      expect(new Set(t.words.map((w) => w.en)).size, t.id).toBe(t.words.length);
      for (const w of t.words) {
        for (const k of ['en', 'pt', 'emoji', 'def', 'gap'] as const) expect(w[k], `${w.id}.${k}`).toBeTruthy();
        expect(w.gap, `${w.id}: lacuna precisa de ___`).toContain('___');
        expect(new RegExp(`\\b${w.en}\\b`, 'i').test(w.def), `${w.id}: a definição entrega a palavra`).toBe(false);
        expect(new RegExp(`\\b${w.en}\\b`, 'i').test(w.gap), `${w.id}: a lacuna entrega a palavra`).toBe(false);
      }
    }
  });

  it('a pista de tradução nunca entrega a palavra; sem tradução segura, a casa usa outra pista', () => {
    for (const w of SUDOKU_WORDS) {
      const pt = ptClue(w);
      if (pt) expect(pt.toLowerCase().includes(w.en.toLowerCase()), w.id).toBe(false);
    }
    expect(ptClue(WORD.mocha)).toBe('café com chocolate');
    expect(ptClue(WORD.banana)).toBeNull();
    for (let k = 0; k < 30; k++) {
      const p = makePuzzle(4, {}, now, 'pt-' + k);
      p.givens.forEach((i) => {
        if (p.clues[i] === 'pt') expect(ptClue(WORD[p.words[p.solution[i]]]), p.words[p.solution[i]]).not.toBeNull();
      });
    }
  });

  it('toda palavra vira item de revisão (as ligadas ao vocabulário usam o mesmo item)', () => {
    for (const w of SUDOKU_WORDS) {
      const item = ITEMS[sudokuItemId(w)];
      expect(item, w.id).toBeDefined();
      expect(item.en?.toLowerCase(), w.id).toBe(w.en.toLowerCase());
    }
  });
});
