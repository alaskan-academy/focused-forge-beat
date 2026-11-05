import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import GameTable from './GameTable';
import { SUDOKU_WORD_BY_ID } from '@/content/coffee/sudokuWords';
import { dayKey, makePuzzle, type PuzzleSummary, type SudokuProgress } from '@/lib/coffee/sudoku';
import type { PuzzleRow } from '@/lib/coffee/store/types';

const now = new Date('2026-11-05T15:00:00Z');

describe('mesa de jogos', () => {
  it('joga um 4×4: erro, dica paga, acertos e resumo; o progresso vai para o SRS', async () => {
    const puzzle = makePuzzle(4, {}, now, 'ui-test');
    const row: PuzzleRow = { id: 'p1', day: dayKey(now), size: 4, data: puzzle, progress: null, status: 'playing', stars: null };
    const onStart = vi.fn(async () => row);
    const onSave = vi.fn(async () => {});
    const onSpend = vi.fn(async () => true);
    const summary: PuzzleSummary = { stars: 1, coins: 6, xp: 25, items: [], weak: [], feedback: { headline: 'Resolvido!', notes: [] } };
    const onFinish = vi.fn(async (_r: PuzzleRow, _p: SudokuProgress) => summary);
    render(
      <GameTable puzzles={[]} states={{}} level={1} coins={30} now={now} onStart={onStart} onSave={onSave} onFinish={onFinish} onSpend={onSpend} onClose={() => {}} />,
    );

    // 6×6 trancado no Nv 1
    expect(screen.getByText('Abre no Nv 3')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByText('4×4 · Rápido')));
    const cells = () => screen.getAllByRole('button', { name: /casa vazia|pista|^[a-z ]+$/ }).filter((b) => b.closest('.aspect-square'));
    expect(cells()).toHaveLength(16);

    // dica: revela a palavra de uma casa inicial
    const given = puzzle.givens[0];
    fireEvent.click(cells()[given]);
    await act(async () => fireEvent.click(screen.getByText(/Revelar a palavra/)));
    expect(onSpend).toHaveBeenCalledWith(2);
    const givenWord = SUDOKU_WORD_BY_ID[puzzle.words[puzzle.solution[given]]].en;
    expect(screen.getByText(new RegExp(`A palavra é`))).toBeInTheDocument();
    expect(screen.getAllByText(givenWord).length).toBeGreaterThan(0);

    // preenche todas as casas vazias; a primeira com uma palavra errada antes
    const empty = puzzle.solution.map((_, i) => i).filter((i) => !puzzle.givens.includes(i));
    let first = true;
    for (const i of empty) {
      fireEvent.click(cells()[i]);
      const right = SUDOKU_WORD_BY_ID[puzzle.words[puzzle.solution[i]]].en;
      if (first) {
        const wrongWord = puzzle.words.map((id) => SUDOKU_WORD_BY_ID[id].en).find((w) => w !== right)!;
        fireEvent.click(screen.getAllByRole('button', { name: wrongWord }).find((b) => b.classList.contains('cc-option'))!);
        expect(screen.getByText(/Não é essa palavra aqui/)).toBeInTheDocument();
        first = false;
      }
      const options = screen.getAllByRole('button', { name: right }).filter((b) => b.classList.contains('cc-option'));
      await act(async () => fireEvent.click(options[0]));
    }

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    const final = onFinish.mock.calls[0][1];
    expect(Object.values(final.mistakes).reduce((a, b) => a + b, 0)).toBe(1);
    expect(Object.values(final.hints).reduce((a, b) => a + b, 0)).toBe(1);
    expect(final.revealed).toEqual([given]);
    expect(Object.keys(final.filled)).toHaveLength(empty.length);
    expect(await screen.findByText('Resolvido!')).toBeInTheDocument();
    expect(screen.getByText('+6 🪙')).toBeInTheDocument();
  });
});
