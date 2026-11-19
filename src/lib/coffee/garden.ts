// O quintal da casa: horta de vocês dois (dados puros, sem Phaser). Cada pessoa tem 6 canteiros
// (até 12), as plantas crescem em tempo real e precisam de água a cada estágio — regar é um
// exercício rápido com a palavra que a semente trouxe. Mesmas regras das funções coffee_garden_* no banco.
import { makeMap, type GameMap, type Point } from './grid';

// Legenda:
//  T árvore   G grama   P caminho de terra   p canteiro   S barraquinha de sementes
//  w lago (pescaria no futuro)   K porta para a cozinha (andável; pisar nela volta para casa)
export const GARDEN_ROWS = [
  'TTTTTTTTTTTTTTTTTTTTTTTT',
  'TGGGGGGGGGGGGGGGGGGGGGGT',
  'TGGGGGGGGGGSSGGGGGGGGGGT',
  'TGGGGGGGGGGGGGGGGGGGGGGT',
  'TGGppppppGGGGGGppppppGGT',
  'TGGGGGGGGGGGGGGGGGGGGGGT',
  'TGGppppppGGGGGGppppppGGT',
  'TGGGGGGGGGGGGGGGGGGGGGGT',
  'TGGGGGGGGGGGGGGGGGGGGGGT',
  'TGGGGGGGGGGGGGGwwwwwwGGT',
  'TGGGGGGGGGGGGGwwwwwwwwGT',
  'TGGGGGGGGGGGGGwwwwwwwwGT',
  'KPPPPGGGGGGGGGGwwwwwwGGT',
  'TGGGGGGGGGGGGGGGGGGGGGGT',
  'TGGGGGGGGGGGGGGGGGGGGGGT',
  'TTTTTTTTTTTTTTTTTTTTTTTT',
] as const;

export const GARDEN_MAP: GameMap = makeMap(GARDEN_ROWS, ['T', 'p', 'S', 'w']);

export const GARDEN_DOOR: Point = { x: 0, y: 12 };
export const FROM_HOUSE_TO_GARDEN: Point = { x: 1, y: 12 };
export const STAND: Point[] = [
  { x: 11, y: 2 },
  { x: 12, y: 2 },
];

export const BASE_PLOTS = 6;
export const MAX_PLOTS = 12;

// canteiro `plot` (0..11) da pessoa `owner` (0 = esquerda, 1 = direita)
export function plotTile(owner: number, plot: number): Point {
  return { x: (owner === 0 ? 3 : 15) + (plot % 6), y: plot < 6 ? 4 : 6 };
}

export function plotAt(x: number, y: number): { owner: number; plot: number } | null {
  if (y !== 4 && y !== 6) return null;
  const row = y === 4 ? 0 : 6;
  if (x >= 3 && x <= 8) return { owner: 0, plot: row + (x - 3) };
  if (x >= 15 && x <= 20) return { owner: 1, plot: row + (x - 15) };
  return null;
}

// plaquinha com o nome de cada horta
export const GARDEN_SIGNS: Point[] = [
  { x: 6, y: 3 },
  { x: 18, y: 3 },
];

// lugares onde a Mucego gosta de ficar (entre os canteiros)
export const MUCEGO_SPOTS: Point[] = [
  { x: 5, y: 5 },
  { x: 18, y: 5 },
  { x: 11, y: 5 },
  { x: 12, y: 8 },
  { x: 2, y: 7 },
];

// ── plantas ─────────────────────────────────────────────────────────────────

export type CropKind = 'herb' | 'veg' | 'fruit' | 'golden';
export type Crop = { id: string; en: string; pt: string; emoji: string; kind: CropKind; color: string; leaf?: string };

export const KIND_INFO: Record<CropKind, { pt: string; stageMinutes: number; coins: number; price: number; minLevel: number }> = {
  herb: { pt: 'Erva', stageMinutes: 20, coins: 3, price: 2, minLevel: 1 }, // ~1 h no total
  veg: { pt: 'Legume', stageMinutes: 80, coins: 6, price: 4, minLevel: 1 }, // ~4 h
  fruit: { pt: 'Fruta / flor', stageMinutes: 240, coins: 10, price: 8, minLevel: 3 }, // ~12 h
  golden: { pt: 'Dourada', stageMinutes: 480, coins: 20, price: 30, minLevel: 5 }, // ~24 h
};

export const CROPS: Crop[] = [
  { id: 'basil', en: 'basil', pt: 'manjericão', emoji: '🌿', kind: 'herb', color: '#4f8a5b' },
  { id: 'mint', en: 'mint', pt: 'hortelã', emoji: '🌱', kind: 'herb', color: '#6ac08a' },
  { id: 'parsley', en: 'parsley', pt: 'salsinha', emoji: '🌿', kind: 'herb', color: '#3d7a3f' },
  { id: 'rosemary', en: 'rosemary', pt: 'alecrim', emoji: '🌿', kind: 'herb', color: '#5f8a76' },
  { id: 'carrot', en: 'carrot', pt: 'cenoura', emoji: '🥕', kind: 'veg', color: '#e8833a' },
  { id: 'tomato', en: 'tomato', pt: 'tomate', emoji: '🍅', kind: 'veg', color: '#d9463e' },
  { id: 'lettuce', en: 'lettuce', pt: 'alface', emoji: '🥬', kind: 'veg', color: '#8fcf5a' },
  { id: 'pumpkin', en: 'pumpkin', pt: 'abóbora', emoji: '🎃', kind: 'veg', color: '#e8952f' },
  { id: 'corn', en: 'corn', pt: 'milho', emoji: '🌽', kind: 'veg', color: '#f2cf4a' },
  { id: 'strawberry', en: 'strawberry', pt: 'morango', emoji: '🍓', kind: 'fruit', color: '#e0465a' },
  { id: 'blueberry', en: 'blueberry', pt: 'mirtilo', emoji: '🫐', kind: 'fruit', color: '#5a6fd0' },
  { id: 'sunflower', en: 'sunflower', pt: 'girassol', emoji: '🌻', kind: 'fruit', color: '#f2c12e' },
  { id: 'watermelon', en: 'watermelon', pt: 'melancia', emoji: '🍉', kind: 'fruit', color: '#4f9a4a' },
  { id: 'golden_apple', en: 'golden apple', pt: 'maçã dourada', emoji: '🍎', kind: 'golden', color: '#f2c12e', leaf: '#e8b64c' },
];

export const CROP_BY_ID: Record<string, Crop> = Object.fromEntries(CROPS.map((c) => [c.id, c]));

// Uma planta num canteiro. stage: 0 semente · 1 broto · 2 crescendo · 3 pronta.
export type Plant = {
  id: string;
  owner_id: string;
  plot: number;
  crop_id: string;
  item_id: string; // a palavra que a semente trouxe (item do SRS)
  stage: number;
  stage_started_at: string;
  watered: boolean; // já regou neste estágio
  last_watered_by: string | null;
  planted_at: string;
};

export type PlantView = { stage: number; ready: boolean; thirsty: boolean; growing: boolean; nextAt: number | null };

const minutes = (m: number) => m * 60_000;

// Estado de agora (crescimento calculado na hora; o banco faz a mesma conta ao regar/colher).
export function plantNow(p: Pick<Plant, 'crop_id' | 'stage' | 'stage_started_at' | 'watered'>, now: Date): PlantView {
  const crop = CROP_BY_ID[p.crop_id];
  const dur = minutes(KIND_INFO[crop?.kind ?? 'herb'].stageMinutes);
  let stage = p.stage;
  let start = new Date(p.stage_started_at).getTime();
  let watered = p.watered;
  // regada a tempo: muda de estágio quando o tempo do estágio acaba (o próximo precisa de água de novo)
  if (stage < 3 && watered && now.getTime() >= start + dur) {
    stage++;
    start += dur;
    watered = false;
  }
  const ready = stage >= 3;
  const timeUp = now.getTime() >= start + dur;
  return {
    stage,
    ready,
    thirsty: !ready && !watered,
    growing: !ready && watered && !timeUp,
    nextAt: ready ? null : start + dur,
  };
}

// Regar: se o tempo do estágio já passou, cresce na hora; senão, cresce quando o tempo acabar.
export function waterPlant<T extends Pick<Plant, 'crop_id' | 'stage' | 'stage_started_at' | 'watered'>>(p: T, now: Date): T {
  const v = plantNow(p, now);
  const crop = CROP_BY_ID[p.crop_id];
  const dur = minutes(KIND_INFO[crop?.kind ?? 'herb'].stageMinutes);
  if (v.ready || !v.thirsty) return p;
  // estado normalizado (pode ter crescido sozinho desde a última leitura)
  const start = v.nextAt! - dur;
  if (now.getTime() >= start + dur) return { ...p, stage: v.stage + 1, stage_started_at: now.toISOString(), watered: false };
  return { ...p, stage: v.stage, stage_started_at: new Date(start).toISOString(), watered: true };
}

// preço do próximo canteiro extra (7º = 30, 8º = 40 … 12º = 80)
export const plotPrice = (current: number) => 30 + 10 * (current - BASE_PLOTS);

export const fmtLeft = (ms: number) => {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
};
