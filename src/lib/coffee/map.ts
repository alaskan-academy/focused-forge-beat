// Mapa do café em dados puros (sem Phaser), para ser usado pelo jogo, pelos testes e
// para manter os "lugares" de clientes iguais aos da função coffee_spawn_arrivals no banco.
import { charAt, makeMap, neighbors, pathIn, walkable, type GameMap, type Point } from './grid';

export type { Point } from './grid';

export const TILE = 16;

// Legenda:
//  W parede   . chão   R tapete   D porta (chão)
//  C balcão   M máquina de café   S prateleira   P planta   T mesa
//  c cadeira (andável)   K almofada do gato (andável)   G mesa de jogos (tabuleiro xadrez)
//  H porta para a casa (andável; pisar nela leva para casa)
export const MAP_ROWS = [
  'WWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWW',
  'WMM.SS.S..P......PKW',
  'W..................W',
  'WCCCCCCCC..........W',
  'W.........RRRR.....W',
  'W..cTc....RRRR..cTcW',
  'W.........RRRR.....W',
  'W.cTc..cTc......P..W',
  'W..................H',
  'WP...cTc.....cTc..PW',
  'W..................W',
  'W.cGc..............W',
  'WWWWWWWWWDDWWWWWWWWW',
] as const;

export const MAP_W = MAP_ROWS[0].length;
export const MAP_H = MAP_ROWS.length;

export type TileChar = 'W' | '.' | 'R' | 'D' | 'C' | 'M' | 'S' | 'P' | 'T' | 'c' | 'K' | 'G' | 'H';

export const CAFE_MAP: GameMap = makeMap(MAP_ROWS, ['W', 'C', 'M', 'S', 'P', 'T', 'G']);

export function tileAt(x: number, y: number, m: GameMap = CAFE_MAP): TileChar {
  return charAt(m, x, y) as TileChar;
}

export function isWalkable(x: number, y: number, m: GameMap = CAFE_MAP): boolean {
  return walkable(m, x, y);
}

// Porta do café para a casa (parede direita) e onde o jogador aparece ao voltar da casa.
export const HOUSE_DOOR: Point = { x: 19, y: 9 };
export const FROM_HOUSE: Point = { x: 18, y: 9 };

// Onde o jogador aparece ao entrar (perto da porta, por dentro).
export const PLAYER_START: Point = { x: 9, y: 11 };
export const DOOR: Point = { x: 9, y: 13 };

// Lugares onde clientes ficam esperando. Os ids são os mesmos da função SQL coffee_spawn_arrivals.
export type Spot = { id: string; x: number; y: number; face: 'up' | 'down' | 'left' | 'right' };

export const CUSTOMER_SPOTS: Spot[] = [
  { id: 'counter1', x: 2, y: 5, face: 'up' },
  { id: 'counter2', x: 4, y: 5, face: 'up' },
  { id: 'counter3', x: 6, y: 5, face: 'up' },
  { id: 'table1', x: 3, y: 6, face: 'right' },
  { id: 'table2', x: 18, y: 6, face: 'left' },
  { id: 'table3', x: 2, y: 8, face: 'right' },
  { id: 'table4', x: 9, y: 8, face: 'left' },
  { id: 'table5', x: 5, y: 10, face: 'right' },
  { id: 'table6', x: 15, y: 10, face: 'left' },
];

// Onde o Belmont (senhorio) espera, perto da porta. Não é lugar de cliente (só aparece para quem ele cobra).
export const LANDLORD_SPOT: Spot = { id: 'landlord', x: 10, y: 12, face: 'up' };

export function spotById(id: string): Spot | undefined {
  return id === LANDLORD_SPOT.id ? LANDLORD_SPOT : CUSTOMER_SPOTS.find((s) => s.id === id);
}

// Caminho mais curto no café (ver grid.ts).
export function findPath(from: Point, to: Point, blocked?: (x: number, y: number) => boolean, m: GameMap = CAFE_MAP): Point[] {
  return pathIn(m, from, to, blocked);
}

// Tiles de onde dá para atender alguém parado em `target` (vizinhos andáveis ou do outro lado do balcão).
export function serveTiles(target: Point): Point[] {
  const out: Point[] = [];
  for (const p of neighbors(target)) {
    if (isWalkable(p.x, p.y)) out.push(p);
    else if (tileAt(p.x, p.y) === 'C') {
      const behind = { x: 2 * p.x - target.x, y: 2 * p.y - target.y };
      if (isWalkable(behind.x, behind.y)) out.push(behind);
    }
  }
  return out;
}

// Cantinho pessoal de cada membro (onde o personagem fica parado quando a pessoa está offline).
// Índice = posição do user_id na lista de membros ordenada.
export const PERSONAL_CORNERS: Point[] = [
  { x: 12, y: 3 },
  { x: 9, y: 3 },
  { x: 14, y: 3 },
  { x: 14, y: 12 },
];

// Gato: almofada (sempre existe) e o Cantinho do gato (melhoria compartilhada).
export const CAT_CUSHION: Point = { x: 18, y: 2 };
export const CAT_BED: Point = { x: 16, y: 2 };
export const CAT_SCRATCHER: Point = { x: 15, y: 2 };

// Objetos com que dá para interagir. `x/y` = tile do objeto; `serve` = de onde o jogador interage.
export type Interactable = { id: 'chalkboard' | 'bookshelf' | 'gametable'; x: number; y: number; serve: Point[] };
export const INTERACTABLES: Interactable[] = [
  // quadro-negro na parede atrás do balcão (chunk do dia)
  { id: 'chalkboard', x: 9, y: 1, serve: [{ x: 9, y: 2 }, { x: 8, y: 2 }] },
  // estante de livros (dicas dos grandes nomes do ensino)
  { id: 'bookshelf', x: 5, y: 2, serve: [{ x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 2 }] },
  // mesa de jogos com tabuleiro xadrez (Sudoku de inglês)
  { id: 'gametable', x: 3, y: 12, serve: [{ x: 3, y: 11 }, { x: 2, y: 11 }, { x: 4, y: 11 }, { x: 2, y: 12 }, { x: 4, y: 12 }] },
];

// Onde o Elias às vezes deita (em cima de móveis, fora do caminho)
export const CAT_PERCHES: Point[] = [{ x: 3, y: 12 }];
