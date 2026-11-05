import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ActivityCard from './ActivityCard';
import { parseSpot } from '@/lib/coffee/activities';
import type { SpotError } from '@/content/coffee/types';

const a: SpotError = { id: 's', type: 'spot_error', items: ['g:aux_do'], sentence: 'Did you *went* to the party?', fix: 'Did you go to the party?', why_pt: 'Depois de did, o verbo volta para a forma base.' };
const props = { onHint: async () => true, onExchange: () => {}, gapMode: 'options' as const };

describe('achar o erro', () => {
  it('lê a frase marcada', () => {
    expect(parseSpot(a.sentence)).toEqual({ words: ['Did', 'you', 'went', 'to', 'the', 'party?'], wrong: 2 });
  });

  it('uma palavra certa conta erro; a errada conclui e mostra a correção', () => {
    const onDone = vi.fn();
    render(<ActivityCard activity={a} onDone={onDone} {...props} />);
    fireEvent.click(screen.getByText('to'));
    expect(screen.getByText('Essa está certa. Procure outra.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('went'));
    expect(onDone).toHaveBeenCalledWith({ mistakes: 1, hints: 0, revealed: false, hearts: 0, utterance: 'Did you go to the party?' });
    expect(screen.getByText('Did you go to the party?')).toBeInTheDocument();
  });

  it('duas palavras certas tocadas: revela o erro', () => {
    const onDone = vi.fn();
    render(<ActivityCard activity={a} onDone={onDone} {...props} />);
    fireEvent.click(screen.getByText('Did'));
    fireEvent.click(screen.getByText('party?'));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ mistakes: 2, revealed: true }));
    expect(screen.getByText(/O erro era este/)).toBeInTheDocument();
  });
});
