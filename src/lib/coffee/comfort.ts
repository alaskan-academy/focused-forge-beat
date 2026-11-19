// Conforto da casa: soma do conforto dos móveis colocados (dos dois). Cada tipo de móvel conta
// no máximo MAX_SAME vezes, para variar a decoração. O título da casa define o bônus diário que cada
// um ganha ao acordar. Mesmas regras de coffee_house_comfort / coffee_house_morning no banco.
import { FURNITURE_BY_ID } from '@/content/coffee/furniture';
import type { HouseItem } from './houseItems';

export const MAX_SAME = 3;

export type ComfortTitle = { min: number; pt: string; en: string; emoji: string; bonus: number };

export const COMFORT_TITLES: ComfortTitle[] = [
  { min: 0, pt: 'Caixa de papelão', en: 'cardboard box', emoji: '📦', bonus: 3 },
  { min: 10, pt: 'Cantinho simples', en: 'simple nook', emoji: '🪴', bonus: 6 },
  { min: 30, pt: 'Lar aconchegante', en: 'cozy home', emoji: '🏡', bonus: 10 },
  { min: 60, pt: 'Casa de revista', en: 'magazine house', emoji: '✨', bonus: 16 },
  { min: 100, pt: 'Mansão dos gatos', en: 'cat mansion', emoji: '🏰', bonus: 25 },
];

export function houseComfort(items: Pick<HouseItem, 'item_id' | 'room'>[]): number {
  const seen = new Map<string, number>();
  let total = 0;
  for (const it of items) {
    if (!it.room) continue;
    const f = FURNITURE_BY_ID[it.item_id];
    if (!f) continue;
    const n = (seen.get(it.item_id) ?? 0) + 1;
    seen.set(it.item_id, n);
    if (n <= MAX_SAME) total += f.comfort;
  }
  return total;
}

export function comfortLevel(comfort: number): number {
  let lvl = 0;
  COMFORT_TITLES.forEach((t, i) => {
    if (comfort >= t.min) lvl = i;
  });
  return lvl;
}

export const titleFor = (comfort: number) => COMFORT_TITLES[comfortLevel(comfort)];
export const nextTitle = (comfort: number) => COMFORT_TITLES[comfortLevel(comfort) + 1] ?? null;

// Resultado do bônus ao acordar (uma vez por dia, horário de Brasília).
export type MorningBonus = { claimed: boolean; coins: number; comfort: number; level: number; total_coins: number };
