import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCoffeeGame } from './useCoffeeGame';
import { LocalStore } from '@/lib/coffee/store/localStore';

describe('presença (ver a outra pessoa andando)', () => {
  it('entra no canal com o id do café, inclusive quando o store é trocado (renovação do login)', async () => {
    const first = new LocalStore();
    const joinFirst = vi.spyOn(first, 'joinPresence');
    const { result, rerender } = renderHook(({ store }) => useCoffeeGame(store), { initialProps: { store: first } });
    await waitFor(() => expect(result.current.snap).toBeTruthy());
    const cafeId = result.current.snap!.cafe.id;
    await waitFor(() => expect(joinFirst).toHaveBeenCalled());
    expect((joinFirst.mock.calls[0] as unknown[])[0]).toBe(cafeId);

    // instância nova ainda sem load(): antes, a presença virava um "não faz nada" aqui
    const second = new LocalStore();
    const joinSecond = vi.spyOn(second, 'joinPresence');
    rerender({ store: second });
    await waitFor(() => expect(joinSecond).toHaveBeenCalled());
    expect((joinSecond.mock.calls[0] as unknown[])[0]).toBe(cafeId);
  });
});
