import { describe, expect, it } from 'vitest';
import { computeBill, fillBill, landlordXp, settle, type LandlordBill } from './landlord';

describe('Belmont: conta do aluguel', () => {
  it('aluguel = 10 + 15% do que ganhou + 5 por melhoria, até 40; erros à parte', () => {
    expect(computeBill({ first: false, coins: 50, earned: 60, errors: 4, upgrades: 0, debt: 0 })).toEqual({ rent: 19, error_fee: 4, total: 23 });
    expect(computeBill({ first: false, coins: 50, earned: 60, errors: 0, upgrades: 1, debt: 12 })).toEqual({ rent: 24, error_fee: 0, total: 36 });
    expect(computeBill({ first: false, coins: 0, earned: 1000, errors: 3, upgrades: 2, debt: 0 }).rent).toBe(40);
  });

  it('primeira visita leva tudo e não cobra erro', () => {
    expect(computeBill({ first: true, coins: 54, earned: 300, errors: 9, upgrades: 0, debt: 0 })).toEqual({ rent: 54, error_fee: 0, total: 54 });
    expect(settle({ first: true, coins: 54, total: 54 }, 5)).toEqual({ discount: 0, paid: 54, debt: 0 });
  });

  it('sem dinheiro vira dívida; desconto de até 5', () => {
    expect(settle({ first: false, coins: 10, total: 23 }, 0)).toEqual({ discount: 0, paid: 10, debt: 13 });
    expect(settle({ first: false, coins: 100, total: 23 }, 9)).toEqual({ discount: 5, paid: 18, debt: 0 });
  });

  it('XP da conversa igual ao dos atendimentos', () => {
    expect(landlordXp(3, 4)).toBe(35);
  });

  it('números da conta entram nas falas', () => {
    const bill = { rent: 19, error_fee: 4, debt: 12, total: 35, earned: 60, errors: 4, coins: 50 } as LandlordBill;
    expect(fillBill('You earned {earned}. Rent is {rent}, errors {fee}, plus {debt}. Total: {total}.', bill)).toBe('You earned 60. Rent is 19, errors 4, plus 12. Total: 35.');
  });
});
