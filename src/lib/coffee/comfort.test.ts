import { describe, expect, it } from 'vitest';
import { COMFORT_TITLES, comfortLevel, houseComfort, nextTitle, titleFor } from './comfort';

const it_ = (item_id: string, room: 'living' | null = 'living') => ({ item_id, room });

describe('conforto da casa', () => {
  it('soma só o que está colocado, e cada móvel conta até 3 vezes', () => {
    expect(houseComfort([])).toBe(0);
    expect(houseComfort([it_('armchair'), it_('armchair', null)])).toBe(4);
    expect(houseComfort(Array.from({ length: 5 }, () => it_('cactus')))).toBe(3);
    expect(houseComfort([it_('piano'), it_('cactus')])).toBe(19);
  });

  it('títulos e bônus sobem com o conforto', () => {
    expect(titleFor(0).pt).toBe('Caixa de papelão');
    expect(comfortLevel(9)).toBe(0);
    expect(comfortLevel(10)).toBe(1);
    expect(titleFor(45).pt).toBe('Lar aconchegante');
    expect(titleFor(250).bonus).toBe(25);
    expect(nextTitle(250)).toBeNull();
    expect(nextTitle(12)?.min).toBe(30);
    expect(COMFORT_TITLES.map((t) => t.bonus)).toEqual([3, 6, 10, 16, 25]);
  });
});
