// Belmont Sulphur, o senhorio: conta do aluguel. Mesmas regras de coffee_landlord_compute /
// coffee_landlord_pay (migration coffee_landlord), usadas pelo LocalStore e pelas falas dele.

export const RENT_BASE = 10;
export const RENT_SHARE = 0.15; // do que você ganhou desde a última visita
export const RENT_PER_UPGRADE = 5;
export const RENT_CAP = 40;
export const ERROR_FEE = 1; // por erro desde a última visita
export const MAX_DISCOUNT = 5; // negociar bem o aluguel

export type LandlordBill = {
  ready: boolean; // ele está no café hoje (já jogou hoje e ainda não houve visita)
  first: boolean; // primeira visita: leva tudo
  visits: number;
  earned: number;
  errors: number;
  upgrades: number;
  rent: number;
  error_fee: number;
  debt: number; // dívida anterior
  total: number;
  coins: number;
  booked_by_me: boolean | null; // quem reservou a cabana
};

export type LandlordPayInput = { stars: 1 | 2 | 3; activities: number; mistakes: number; discount: number; bookedByMe: boolean | null; chapterId: string | null };
export type LandlordPayResult = {
  paid: number;
  debt: number;
  discount: number;
  first: boolean;
  xp: number;
  rent: number;
  error_fee: number;
  previous_debt: number;
  total_coins: number;
  total_xp: number;
};

export function computeBill(a: { first: boolean; coins: number; earned: number; errors: number; upgrades: number; debt: number }) {
  const rent = a.first ? a.coins : Math.min(RENT_CAP, RENT_BASE + Math.round(a.earned * RENT_SHARE) + RENT_PER_UPGRADE * a.upgrades);
  const error_fee = a.first ? 0 : a.errors * ERROR_FEE;
  return { rent, error_fee, total: rent + error_fee + a.debt };
}

// Quanto paga agora e quanto fica devendo.
export function settle(bill: Pick<LandlordBill, 'total' | 'first' | 'coins'>, discount: number) {
  const d = bill.first ? 0 : Math.min(MAX_DISCOUNT, Math.max(0, discount));
  const due = Math.max(0, bill.total - d);
  const paid = Math.min(bill.coins, due);
  return { discount: d, paid, debt: due - paid };
}

export const landlordXp = (stars: number, activities: number) => Math.min(3, Math.max(1, stars)) * 5 + Math.min(10, Math.max(1, activities)) * 5;

// Números da conta dentro das falas: {rent}, {fee}, {debt}, {total}, {earned}, {errors}, {coins}.
export function fillBill(text: string, bill: LandlordBill): string {
  const map: Record<string, number> = {
    rent: bill.rent,
    fee: bill.error_fee,
    debt: bill.debt,
    total: bill.total,
    earned: bill.earned,
    errors: bill.errors,
    coins: bill.coins,
  };
  return text.replace(/\{(rent|fee|debt|total|earned|errors|coins)\}/g, (_, k: string) => String(map[k]));
}
