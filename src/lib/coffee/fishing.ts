// Pescaria no lago do quintal (dados puros, sem Phaser). Cada peixe traz uma palavra; para puxar,
// você responde uma pergunta com cronômetro (mais difícil quanto mais raro). O sorteio do peixe é
// feito no servidor (coffee_fish_cast); estas regras são as mesmas, para o modo local e os testes.
import { charAt, walkable, type Point } from './grid';
import { GARDEN_MAP } from './garden';

export type Rarity = 'junk' | 'common' | 'uncommon' | 'rare' | 'legendary';
export type Fish = { id: string; en: string; pt: string; emoji: string; rarity: Rarity; night?: boolean };

export const RARITY_INFO: Record<Rarity, { pt: string; coins: number; seconds: number; weight: number; color: string }> = {
  junk: { pt: 'Lixo', coins: 0, seconds: 0, weight: 10, color: '#8a8a8a' },
  common: { pt: 'Comum', coins: 2, seconds: 10, weight: 55, color: '#8a6a4a' },
  uncommon: { pt: 'Incomum', coins: 5, seconds: 9, weight: 25, color: '#4f8a5b' },
  rare: { pt: 'Raro', coins: 12, seconds: 8, weight: 8, color: '#5b6ea8' },
  legendary: { pt: 'Lendário', coins: 40, seconds: 8, weight: 2, color: '#c4554d' },
};

export const FISH: Fish[] = [
  // comuns
  { id: 'minnow', en: 'minnow', pt: 'peixinho', emoji: '🐟', rarity: 'common' },
  { id: 'perch', en: 'perch', pt: 'perca', emoji: '🐟', rarity: 'common' },
  { id: 'carp', en: 'carp', pt: 'carpa', emoji: '🐟', rarity: 'common' },
  { id: 'sunfish', en: 'sunfish', pt: 'peixe-sol', emoji: '🐠', rarity: 'common' },
  { id: 'bluegill', en: 'bluegill', pt: 'peixe-de-guelra-azul', emoji: '🐠', rarity: 'common' },
  { id: 'tilapia', en: 'tilapia', pt: 'tilápia', emoji: '🐟', rarity: 'common' },
  { id: 'goldfish', en: 'goldfish', pt: 'peixinho-dourado', emoji: '🐠', rarity: 'common' },
  { id: 'frog', en: 'frog', pt: 'sapo', emoji: '🐸', rarity: 'common' },
  // incomuns
  { id: 'trout', en: 'trout', pt: 'truta', emoji: '🐟', rarity: 'uncommon' },
  { id: 'bass', en: 'bass', pt: 'robalo', emoji: '🐟', rarity: 'uncommon' },
  { id: 'pike', en: 'pike', pt: 'lúcio', emoji: '🐟', rarity: 'uncommon' },
  { id: 'salmon', en: 'salmon', pt: 'salmão', emoji: '🐟', rarity: 'uncommon' },
  { id: 'crayfish', en: 'crayfish', pt: 'lagostim', emoji: '🦞', rarity: 'uncommon' },
  { id: 'tadpole', en: 'tadpole', pt: 'girino', emoji: '🐸', rarity: 'uncommon' },
  { id: 'catfish', en: 'catfish', pt: 'bagre', emoji: '🐟', rarity: 'uncommon', night: true },
  { id: 'walleye', en: 'walleye', pt: 'lucioperca', emoji: '🐟', rarity: 'uncommon', night: true },
  // raros
  { id: 'koi', en: 'koi', pt: 'carpa koi', emoji: '🎏', rarity: 'rare' },
  { id: 'sturgeon', en: 'sturgeon', pt: 'esturjão', emoji: '🐟', rarity: 'rare' },
  { id: 'turtle', en: 'turtle', pt: 'tartaruga', emoji: '🐢', rarity: 'rare' },
  { id: 'axolotl', en: 'axolotl', pt: 'axolote', emoji: '🦎', rarity: 'rare' },
  { id: 'rainbow_trout', en: 'rainbow trout', pt: 'truta-arco-íris', emoji: '🌈', rarity: 'rare' },
  { id: 'eel', en: 'eel', pt: 'enguia', emoji: '🐍', rarity: 'rare', night: true },
  // lendários
  { id: 'golden_koi', en: 'Golden Koi', pt: 'carpa dourada lendária', emoji: '✨', rarity: 'legendary' },
  { id: 'lake_king', en: 'Old Lake King', pt: 'o velho rei do lago', emoji: '👑', rarity: 'legendary', night: true },
  { id: 'moonfish', en: 'Moonfish', pt: 'peixe-lua', emoji: '🌙', rarity: 'legendary', night: true },
  // "lixo" (engraçado, mas entra no álbum)
  { id: 'old_boot', en: 'old boot', pt: 'bota velha', emoji: '🥾', rarity: 'junk' },
  { id: 'tin_can', en: 'tin can', pt: 'lata', emoji: '🥫', rarity: 'junk' },
  { id: 'rubber_duck', en: 'rubber duck', pt: 'patinho de borracha', emoji: '🦆', rarity: 'junk' },
  { id: 'lost_sock', en: 'lost sock', pt: 'meia perdida', emoji: '🧦', rarity: 'junk' },
  { id: 'message_bottle', en: 'message in a bottle', pt: 'mensagem na garrafa', emoji: '🍾', rarity: 'junk' },
];

export const FISH_BY_ID: Record<string, Fish> = Object.fromEntries(FISH.map((f) => [f.id, f]));
export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'legendary', 'junk'];

export const FREE_CASTS = 10;
export const BAIT_PRICE = 2;
// ingrediente da horta como isca: legume/erva = iscas; fruta = iscas + lançamentos de sorte
export const PANTRY_BAIT: Record<string, { bait: number; lucky: number }> = {
  herb: { bait: 1, lucky: 0 },
  veg: { bait: 3, lucky: 0 },
  fruit: { bait: 3, lucky: 3 },
  golden: { bait: 5, lucky: 5 },
};

// noite no horário de Brasília (peixes noturnos)
export const isNight = (hour: number) => hour >= 19 || hour < 5;

// Sorteio (igual ao do banco): pesos por raridade; em dupla ou com isca de fruta, raro e lendário
// ficam 50% mais prováveis. Peixes noturnos só à noite; de dia só os diurnos.
export function rollFish(night: boolean, boosted: boolean, rand: () => number = Math.random): Fish {
  const weights = RARITIES.map((r) => RARITY_INFO[r].weight * (boosted && (r === 'rare' || r === 'legendary') ? 1.5 : 1));
  let x = rand() * weights.reduce((a, b) => a + b, 0);
  let rarity: Rarity = 'common';
  for (let i = 0; i < RARITIES.length; i++) {
    x -= weights[i];
    if (x < 0) {
      rarity = RARITIES[i];
      break;
    }
  }
  const pool = FISH.filter((f) => f.rarity === rarity && (night || !f.night));
  return pool[Math.floor(rand() * pool.length)] ?? FISH[0];
}

// tiles de água encostados no jogador (para lançar a linha)
export function waterNear(p: Point): Point | null {
  for (const d of [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]) {
    const q = { x: p.x + d.x, y: p.y + d.y };
    if (charAt(GARDEN_MAP, q.x, q.y) === 'w') return q;
  }
  return null;
}

export const isWater = (x: number, y: number) => charAt(GARDEN_MAP, x, y) === 'w';

// margem do lago mais perto de um ponto tocado na água (onde o jogador fica para pescar)
export function shoreNear(target: Point): Point | null {
  let best: { p: Point; d: number } | null = null;
  for (let y = 0; y < GARDEN_MAP.h; y++)
    for (let x = 0; x < GARDEN_MAP.w; x++) {
      if (!walkable(GARDEN_MAP, x, y) || !waterNear({ x, y })) continue;
      const d = Math.abs(x - target.x) + Math.abs(y - target.y);
      if (!best || d < best.d) best = { p: { x, y }, d };
    }
  return best?.p ?? null;
}


export type AlbumRow = { fish_id: string; first_by: string; first_at: string; counts: Record<string, number> };
export type FishingData = { free_left: number; bait: number; lucky: number; fed_today: boolean; album: AlbumRow[] };
export type CastResult = { cast_id: string; fish_id: string };
export type CatchResult = { coins: number; total_coins: number; first: boolean; count: number };
