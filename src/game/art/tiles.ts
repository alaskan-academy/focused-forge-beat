// Tileset placeholder desenhado em código (16×16). Quando houver um tileset de verdade,
// basta carregar a imagem com o mesmo layout de índices (TILE_INDEX) ou trocar o mapeamento em tileIndexFor.
import { MAP_H, MAP_W, TILE, tileAt } from '@/lib/coffee/map';

export const TILE_INDEX = {
  floorA: 0,
  floorB: 1,
  rug: 2,
  wallTop: 3,
  wallFace: 4,
  doorMat: 5,
  counter: 6,
  machine: 7,
  shelf: 8,
  plant: 9,
  table: 10,
  chair: 11,
  cushion: 12,
  window: 13,
} as const;

const COUNT = 14;

type R = (x: number, y: number, w: number, h: number, c: string) => void;

const C = {
  wood: '#b9835a',
  woodDark: '#9a6a46',
  woodLine: '#8a5d3d',
  wallTop: '#4a3530',
  wallTopLight: '#5e4540',
  paper: '#f1e3c8',
  paperStripe: '#e6d2ad',
  wainscot: '#8c5a3c',
  wainscotLight: '#a8714f',
  counterTop: '#dcb88f',
  counterFront: '#7d4f33',
  counterFrontLight: '#94603f',
  steel: '#c9ccd1',
  steelDark: '#8e939b',
  leaf: '#5f9e57',
  leafLight: '#86c271',
  pot: '#c0714a',
  rug: '#c4554d',
  rugLight: '#d7735f',
  rugGold: '#e9c46a',
  sky: '#a8d8ea',
  pillow: '#e9a6a6',
  pillowLight: '#f5c5c0',
  shadow: 'rgba(40,20,10,0.25)',
};

const draw: ((r: R) => void)[] = [];

const floor = (offset: number) => (r: R) => {
  r(0, 0, 16, 16, C.wood);
  for (let y = 0; y < 16; y += 4) {
    r(0, y + 3, 16, 1, C.woodLine);
    const seam = (y / 4 + offset) % 2 === 0 ? 5 : 12;
    r(seam, y, 1, 3, C.woodDark);
  }
  r(2 + offset * 6, 1, 2, 1, '#c99369');
};
draw[TILE_INDEX.floorA] = floor(0);
draw[TILE_INDEX.floorB] = floor(1);

draw[TILE_INDEX.rug] = (r) => {
  r(0, 0, 16, 16, C.rug);
  r(7, 3, 2, 2, C.rugGold);
  r(6, 4, 4, 1, C.rugGold);
  r(7, 11, 2, 2, C.rugGold);
  r(6, 12, 4, 1, C.rugGold);
  r(0, 7, 16, 2, C.rugLight);
};

draw[TILE_INDEX.wallTop] = (r) => {
  r(0, 0, 16, 16, C.wallTop);
  r(0, 0, 16, 1, C.wallTopLight);
  r(3, 6, 2, 1, C.wallTopLight);
  r(11, 11, 2, 1, C.wallTopLight);
};

const wallFace = (r: R) => {
  r(0, 0, 16, 10, C.paper);
  for (let x = 1; x < 16; x += 4) r(x, 0, 1, 10, C.paperStripe);
  r(0, 10, 16, 6, C.wainscot);
  r(0, 10, 16, 1, C.wainscotLight);
  r(0, 15, 16, 1, C.shadow);
};
draw[TILE_INDEX.wallFace] = wallFace;

draw[TILE_INDEX.window] = (r) => {
  wallFace(r);
  r(3, 1, 10, 8, C.woodDark);
  r(4, 2, 8, 6, C.sky);
  r(4, 2, 3, 2, '#d6f0f7');
  r(7, 2, 1, 6, C.woodDark);
  r(4, 5, 8, 1, C.woodDark);
};

draw[TILE_INDEX.doorMat] = (r) => {
  floor(0)(r);
  r(1, 2, 14, 12, '#6b4a3a');
  r(2, 3, 12, 10, '#82604d');
  for (let x = 3; x < 13; x += 2) r(x, 4, 1, 8, '#6b4a3a');
};

draw[TILE_INDEX.counter] = (r) => {
  r(0, 0, 16, 6, C.counterTop);
  r(0, 5, 16, 1, '#c49b72');
  r(0, 6, 16, 10, C.counterFront);
  r(0, 6, 16, 1, '#5e3a24');
  r(2, 8, 5, 6, C.counterFrontLight);
  r(9, 8, 5, 6, C.counterFrontLight);
  r(0, 15, 16, 1, C.shadow);
};

draw[TILE_INDEX.machine] = (r) => {
  r(0, 7, 16, 9, C.counterFront);
  r(0, 7, 16, 2, C.counterTop);
  r(2, 0, 12, 9, C.steelDark);
  r(3, 1, 10, 6, C.steel);
  r(4, 2, 2, 1, '#ffffff');
  r(11, 2, 1, 1, '#e05a4e');
  r(6, 7, 4, 2, '#3d2a22');
  r(7, 9, 2, 1, '#f2ead8');
};

draw[TILE_INDEX.shelf] = (r) => {
  r(1, 1, 14, 14, C.woodDark);
  r(2, 2, 12, 5, '#5e3a24');
  r(2, 9, 12, 5, '#5e3a24');
  r(3, 3, 2, 4, '#f2cc8f');
  r(6, 4, 2, 3, '#81b29a');
  r(9, 3, 3, 4, '#f2ead8');
  r(3, 10, 3, 4, '#e07a5f');
  r(7, 11, 2, 3, '#f2ead8');
  r(10, 10, 2, 4, '#5b6ea8');
};

draw[TILE_INDEX.plant] = (r) => {
  r(4, 13, 8, 2, C.shadow);
  r(5, 9, 6, 5, C.pot);
  r(5, 9, 6, 1, '#d98a62');
  r(3, 3, 10, 6, C.leaf);
  r(5, 1, 6, 3, C.leaf);
  r(4, 4, 3, 2, C.leafLight);
  r(9, 2, 2, 2, C.leafLight);
  r(7, 6, 2, 2, C.leafLight);
};

draw[TILE_INDEX.table] = (r) => {
  r(2, 12, 12, 3, C.shadow);
  r(1, 3, 14, 9, '#8f5e3d');
  r(1, 2, 14, 8, '#b07a52');
  r(2, 3, 5, 2, '#c99369');
  r(6, 5, 3, 3, '#f2ead8'); // xícara
  r(7, 6, 1, 1, '#7d4f33');
};

draw[TILE_INDEX.chair] = (r) => {
  r(4, 12, 8, 2, C.shadow);
  r(4, 6, 8, 6, '#7a5c45');
  r(4, 6, 8, 2, '#94735a');
  r(5, 12, 1, 2, '#5e4433');
  r(10, 12, 1, 2, '#5e4433');
};

draw[TILE_INDEX.cushion] = (r) => {
  r(2, 11, 12, 3, C.shadow);
  r(2, 5, 12, 8, C.pillow);
  r(3, 4, 10, 1, C.pillow);
  r(4, 6, 5, 2, C.pillowLight);
  r(7, 8, 2, 2, '#d98c8c');
};

export function buildTilesetCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TILE * COUNT;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d')!;
  draw.forEach((fn, i) => {
    const r: R = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * TILE + x, y, w, h);
    };
    fn(r);
  });
  return canvas;
}

const WINDOW_X = new Set([12, 15]);

// Converte o mapa de letras em duas camadas de índices: chão e objetos (-1 = vazio).
export function buildLayers(): { ground: number[][]; objects: number[][] } {
  const ground: number[][] = [];
  const objects: number[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    const g: number[] = [];
    const o: number[] = [];
    for (let x = 0; x < MAP_W; x++) {
      const t = tileAt(x, y);
      const floorTile = (x * 7 + y * 3) % 5 === 0 ? TILE_INDEX.floorB : TILE_INDEX.floorA;
      if (t === 'W') g.push(y === 1 && x > 0 && x < MAP_W - 1 ? (WINDOW_X.has(x) ? TILE_INDEX.window : TILE_INDEX.wallFace) : TILE_INDEX.wallTop);
      else if (t === 'R') g.push(TILE_INDEX.rug);
      else if (t === 'D') g.push(TILE_INDEX.doorMat);
      else g.push(floorTile);

      const obj: Partial<Record<string, number>> = {
        C: TILE_INDEX.counter,
        M: TILE_INDEX.machine,
        S: TILE_INDEX.shelf,
        P: TILE_INDEX.plant,
        T: TILE_INDEX.table,
        c: TILE_INDEX.chair,
        K: TILE_INDEX.cushion,
      };
      o.push(obj[t] ?? -1);
    }
    ground.push(g);
    objects.push(o);
  }
  return { ground, objects };
}
