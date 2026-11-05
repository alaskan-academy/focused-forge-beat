import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import Journal from './Journal';
import { useCoffeeGame } from './useCoffeeGame';
import { ITEMS } from '@/content/coffee';
import { dueItems } from '@/lib/coffee/review';
import { LocalStore } from '@/lib/coffee/store/localStore';

describe('caderninho escrito à mão', () => {
  it('anotar uma palavra: entra no caderninho e já fica vencida na revisão; apagar tira das duas', async () => {
    localStorage.clear();
    const store = new LocalStore();
    const { result } = renderHook(() => useCoffeeGame(store));
    await waitFor(() => expect(result.current.snap).toBeTruthy());

    await act(() => result.current.addWord({ en: '  no worries ', pt: 'sem problemas', example: 'No worries, take your time.', source: 'aula' }));
    const mine = result.current.snap!.customItems.find((c) => c.user_id === store.userId)!;
    expect(mine.en).toBe('no worries');
    const id = `u:${mine.id}`;
    expect(ITEMS[id]).toMatchObject({ kind: 'mine', label: 'no worries', pt: 'sem problemas' });
    expect(dueItems(result.current.snap!.items, store.now())).toContain(id);

    await act(() => result.current.deleteWord(mine.id));
    expect(ITEMS[id]).toBeUndefined();
    expect(result.current.snap!.items[id]).toBeUndefined();
  });

  it('tela: formulário anota; a palavra da outra pessoa pode ser copiada uma vez', async () => {
    const onAddWord = vi.fn(async () => {});
    const partnerWord = { id: 'p1', user_id: 'jess', en: 'break a leg', pt: 'boa sorte', example: null, source: null, created_at: '2026-11-05T10:00:00Z' };
    const { rerender } = render(
      <Journal states={{}} arcs={{}} now={new Date()} customItems={[partnerWord]} userId="me" partnerName="Jessica" onAddWord={onAddWord} onDeleteWord={vi.fn()} onClose={() => {}} />,
    );
    fireEvent.click(screen.getByText(/^Expressões/));
    fireEvent.click(screen.getByText('Anotar uma palavra'));
    expect(screen.getByText('Anotar')).toBeDisabled(); // inglês e português são obrigatórios
    fireEvent.change(screen.getByPlaceholderText('ex.: break a leg'), { target: { value: 'piece of cake' } });
    fireEvent.change(screen.getByPlaceholderText('ex.: boa sorte'), { target: { value: 'moleza' } });
    await act(async () => fireEvent.click(screen.getByText('Anotar')));
    expect(onAddWord).toHaveBeenCalledWith({ en: 'piece of cake', pt: 'moleza', example: '', source: '' });

    expect(screen.getByText('📒 Do caderninho de Jessica')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByText('copiar')));
    expect(onAddWord).toHaveBeenLastCalledWith({ en: 'break a leg', pt: 'boa sorte', example: null, source: 'caderninho de Jessica' });

    // depois de copiada, vira "já tenho"
    rerender(
      <Journal
        states={{}}
        arcs={{}}
        now={new Date()}
        customItems={[partnerWord, { ...partnerWord, id: 'm1', user_id: 'me' }]}
        userId="me"
        partnerName="Jessica"
        onAddWord={onAddWord}
        onDeleteWord={vi.fn()}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('já tenho')).toBeDisabled();
  });
});
