// A casa de vocês: dois quartos (um de cada membro, pela ordem em que entraram no café),
// sala e cozinha compartilhadas, ligadas ao café por uma porta. Dados puros (sem Phaser).
import { makeMap, type GameMap, type Point } from './grid';

// Legenda:
//  W parede   . piso de madeira (quartos)   , taco (sala)   _ azulejo (cozinha)
//  d vão de porta (andável)   E porta para o café (andável; pisar nela leva ao café)
//  Q porta da cozinha para o quintal (andável; pisar nela leva à horta)
//  B cama de casal (2×2)   X caixa de mudança   O sofá (2 tiles)   A poltrona
//  F fogão   C bancada da cozinha
export const HOUSE_ROWS = [
  'WWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWW',
  'W.BB....X..W..X....BB..W',
  'W.BB.......W.......BB..W',
  'W..........W...........W',
  'W..........W...........W',
  'W..........W...........W',
  'W..........W...........W',
  'WWWWWdWWWWWWWdWWWWWWWWWW',
  'W,,,,,,,,,,,,,WFCCCC___W',
  'W,,OO,A,,,,,,,W________W',
  'W,,,,,,,,,,,,,W________W',
  'E,,,,,,,,,,,,,d________Q',
  'W,,,,,,,,,,,,,W________W',
  'W,,,,,,,,,,,,,W________W',
  'WWWWWWWWWWWWWWWWWWWWWWWW',
] as const;

export const HOUSE_MAP: GameMap = makeMap(HOUSE_ROWS, ['W', 'B', 'X', 'O', 'A', 'F', 'C']);

export type RoomId = 'bedroom0' | 'bedroom1' | 'living' | 'kitchen';
export type Room = { id: RoomId; x0: number; y0: number; x1: number; y1: number; name_pt: string; name_en: string };

// retângulos internos de cada cômodo (inclusivo)
export const ROOMS: Room[] = [
  { id: 'bedroom0', x0: 1, y0: 2, x1: 10, y1: 7, name_pt: 'Quarto', name_en: 'bedroom' },
  { id: 'bedroom1', x0: 12, y0: 2, x1: 22, y1: 7, name_pt: 'Quarto', name_en: 'bedroom' },
  { id: 'living', x0: 1, y0: 9, x1: 13, y1: 14, name_pt: 'Sala', name_en: 'living room' },
  { id: 'kitchen', x0: 15, y0: 9, x1: 22, y1: 14, name_pt: 'Cozinha', name_en: 'kitchen' },
];

export function roomAt(p: Point): Room | null {
  return ROOMS.find((r) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1) ?? null;
}

// porta do quarto de cada membro (para a plaquinha com o nome) e onde cada um acorda
export const BEDROOM_DOORS: Point[] = [
  { x: 5, y: 8 },
  { x: 13, y: 8 },
];
export const WAKE_UP: Point[] = [
  { x: 4, y: 3 },
  { x: 18, y: 3 },
];
// onde a pessoa fica dormindo quando está offline (ao lado da cama)
export const SLEEP_SPOT: Point[] = [
  { x: 1, y: 3 },
  { x: 21, y: 3 },
];

// porta da casa para o café e onde o jogador aparece ao chegar do café
export const CAFE_DOOR: Point = { x: 0, y: 12 };
export const FROM_CAFE: Point = { x: 1, y: 12 };

// porta da cozinha para o quintal e onde o jogador aparece ao voltar da horta
export const GARDEN_EXIT: Point = { x: 23, y: 12 };
export const FROM_GARDEN: Point = { x: 22, y: 12 };

// janelas (raios de luz) no alto de cada quarto
export const HOUSE_WINDOWS_X = [5, 8, 15, 18];

// qual quarto é de quem: posição do user_id na lista de membros (0 ou 1)
export const bedroomIndex = (members: string[], userId: string) => Math.max(0, Math.min(1, members.indexOf(userId)));
