// Tileset placeholder desenhado em código (16×16). Quando houver um tileset de verdade,
// basta carregar a imagem com o mesmo layout de índices (TILE_INDEX) ou trocar o mapeamento em tileIndexFor.
import { MAP_H, MAP_W, TILE, tileAt } from '@/lib/coffee/map';
import { charAt } from '@/lib/coffee/grid';
import { HOUSE_MAP, HOUSE_WINDOWS_X } from '@/lib/coffee/house';

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
  gameTable: 14,
  // objetos em cima do balcão (desenhados sobre o balcão do Kenney)
  register: 15,
  pastryCase: 16,
  cups: 17,
  // casa
  parquet: 18,
  kitchenTile: 19,
  movingBox: 20,
  // quintal
  grass: 21,
  grassB: 22,
  dirt: 23,
  soil: 24,
  water: 25,
  tree: 26,
  stallLeft: 27,
  stallRight: 28,
} as const;

const COUNT = 29;

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

// Piso: tábuas de madeira mais escura que os móveis do Kenney (para os móveis se destacarem),
// com veios suaves, emendas alternadas e um nó aqui e ali.
const FLOOR = { base: '#9a6844', alt: '#a06e48', line: '#7f5434', grain: '#8e5f3d', light: '#ad7b53', knot: '#73492c' };
const floor = (offset: number) => (r: R) => {
  for (let i = 0; i < 4; i++) {
    const y = i * 4;
    r(0, y, 16, 4, (i + offset) % 2 === 0 ? FLOOR.base : FLOOR.alt);
    r(0, y + 3, 16, 1, FLOOR.line);
    r(1, y, 5, 1, FLOOR.light);
    const seam = (i + offset) % 2 === 0 ? 4 : 11;
    r(seam, y, 1, 3, FLOOR.line);
    r((seam + 6) % 16, y + 1, 3, 1, FLOOR.grain);
  }
  if (offset === 1) r(9, 6, 2, 1, FLOOR.knot);
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
  r(0, 15, 16, 1, '#3a2924');
  r(3, 6, 2, 1, C.wallTopLight);
  r(11, 11, 2, 1, C.wallTopLight);
};

// Parede: papel de parede creme com losangos discretos, faixa de madeira e rodapé com painéis.
const wallFace = (r: R) => {
  r(0, 0, 16, 9, C.paper);
  for (let x = 0; x < 16; x += 4) {
    r(x + 2, 2, 1, 1, C.paperStripe);
    r(x + 1, 3, 3, 1, C.paperStripe);
    r(x + 2, 4, 1, 1, C.paperStripe);
    r(x, 7, 1, 1, '#ead9b8');
  }
  r(0, 8, 16, 1, '#b07a50');
  r(0, 9, 16, 1, '#c99167');
  r(0, 10, 16, 6, C.wainscot);
  r(1, 11, 6, 4, C.wainscotLight);
  r(9, 11, 6, 4, C.wainscotLight);
  r(1, 11, 6, 1, '#b8805a');
  r(9, 11, 6, 1, '#b8805a');
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

// ── quintal ──
draw[TILE_INDEX.grass] = (r) => {
  r(0, 0, 16, 16, '#7fb35a');
  r(3, 4, 1, 2, '#93c66a');
  r(11, 9, 1, 2, '#93c66a');
  r(7, 13, 1, 1, '#6a9c4a');
  r(13, 2, 1, 1, '#6a9c4a');
};
draw[TILE_INDEX.grassB] = (r) => {
  r(0, 0, 16, 16, '#7fb35a');
  r(2, 10, 1, 2, '#93c66a');
  r(9, 3, 1, 2, '#93c66a');
  r(12, 12, 2, 1, '#f2e3a0');
  r(5, 6, 1, 1, '#f29e9e');
};
draw[TILE_INDEX.dirt] = (r) => {
  r(0, 0, 16, 16, '#c9a46c');
  r(3, 3, 2, 1, '#b48d57');
  r(10, 8, 2, 1, '#b48d57');
  r(6, 12, 1, 1, '#dcbc88');
};
// canteiro: terra fofa com bordinha de madeira
draw[TILE_INDEX.soil] = (r) => {
  r(0, 0, 16, 16, '#7fb35a');
  r(1, 2, 14, 13, '#7a5232');
  r(2, 3, 12, 11, '#6a4529');
  for (let y = 5; y < 14; y += 3) r(3, y, 10, 1, '#5a3a22');
  r(1, 14, 14, 1, '#a8714f');
};
draw[TILE_INDEX.water] = (r) => {
  r(0, 0, 16, 16, '#5bb0c4');
  r(2, 4, 4, 1, '#9cd8e4');
  r(9, 10, 5, 1, '#9cd8e4');
  r(6, 13, 3, 1, '#4a96aa');
};
// árvore vista de cima: copa redonda sobre a grama
draw[TILE_INDEX.tree] = (r) => {
  r(0, 0, 16, 16, '#7fb35a');
  r(7, 11, 2, 4, '#7d4f33');
  r(2, 1, 12, 11, '#3d7a3f');
  r(1, 3, 14, 7, '#3d7a3f');
  r(3, 2, 6, 4, '#4f8a5b');
  r(4, 3, 2, 1, '#6aa36f');
  r(2, 12, 12, 2, 'rgba(30,50,20,0.35)');
};
// barraquinha de sementes (2 tiles): toldo listrado e bancada
const stall = (r: R, left: boolean) => {
  r(0, 0, 16, 16, '#7fb35a');
  for (let x = 0; x < 16; x += 4) r(x, 1, 2, 5, '#e07a5f');
  for (let x = 2; x < 16; x += 4) r(x, 1, 2, 5, '#fffaf0');
  r(0, 6, 16, 1, '#c4554d');
  r(0, 9, 16, 6, '#a8714f');
  r(0, 9, 16, 1, '#c99a6a');
  if (left) {
    r(2, 7, 3, 2, '#e8b64c');
    r(7, 7, 3, 2, '#6aa36f');
  } else {
    r(4, 7, 3, 2, '#d9463e');
    r(9, 7, 3, 2, '#5a6fd0');
  }
  r(left ? 1 : 13, 6, 1, 9, '#7d4f33');
};
draw[TILE_INDEX.stallLeft] = (r) => stall(r, true);
draw[TILE_INDEX.stallRight] = (r) => stall(r, false);

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

// taco da sala: losangos de madeira mais clara
draw[TILE_INDEX.parquet] = (r) => {
  r(0, 0, 16, 16, '#b07a4c');
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      const x = i * 4;
      const y = j * 4;
      if ((i + j) % 2 === 0) {
        r(x, y, 4, 1, '#c48b5a');
        r(x, y + 2, 4, 1, '#c48b5a');
      } else {
        r(x, y, 1, 4, '#c48b5a');
        r(x + 2, y, 1, 4, '#c48b5a');
      }
      r(x + 3, y + 3, 1, 1, '#94643d');
    }
};

// azulejo da cozinha: quadriculado creme e terracota
draw[TILE_INDEX.kitchenTile] = (r) => {
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) r(i * 8, j * 8, 8, 8, (i + j) % 2 === 0 ? '#efe2c6' : '#d9b48c');
  r(0, 7, 16, 1, '#c9a47c');
  r(7, 0, 1, 16, '#c9a47c');
};

// caixa de mudança de papelão (o quarto começa quase vazio)
draw[TILE_INDEX.movingBox] = (r) => {
  r(2, 12, 12, 3, C.shadow);
  r(2, 4, 12, 9, '#c79a62');
  r(2, 4, 12, 3, '#d9b07a');
  r(7, 4, 2, 9, '#a9784a');
  r(5, 9, 6, 2, '#efe2c6');
  r(2, 12, 12, 1, '#a9784a');
};

// caixa registradora (sobre o balcão)
draw[TILE_INDEX.register] = (r) => {
  r(3, 2, 10, 1, '#2b1d1a');
  r(3, 3, 10, 5, '#5b6ea8');
  r(4, 4, 8, 2, '#a8d8ea');
  r(5, 4, 3, 1, '#fffaf0');
  r(4, 7, 8, 1, '#3d405b');
  r(2, 8, 12, 2, '#3d405b');
  r(3, 8, 2, 1, '#e9c46a');
};

// vitrine de doces: cúpula de vidro com bolo e croissants
draw[TILE_INDEX.pastryCase] = (r) => {
  r(2, 1, 12, 8, 'rgba(214,240,247,0.55)');
  r(2, 1, 12, 1, '#fffaf0');
  r(2, 1, 1, 8, '#d6f0f7');
  r(3, 5, 4, 3, '#e07a5f');
  r(3, 5, 4, 1, '#f5c5c0');
  r(8, 6, 5, 2, '#e9a65a');
  r(9, 5, 3, 1, '#f2cc8f');
  r(1, 9, 14, 1, '#7d4f33');
};

// pilha de xícaras e pires
draw[TILE_INDEX.cups] = (r) => {
  for (const [x, y] of [
    [3, 4],
    [8, 2],
    [8, 6],
  ] as const) {
    r(x, y + 3, 6, 1, '#e6d2ad');
    r(x + 1, y, 4, 3, '#fffaf0');
    r(x + 1, y, 4, 1, '#e07a5f');
    r(x + 5, y + 1, 1, 1, '#fffaf0');
  }
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

// mesa de jogos: tampo de madeira com tabuleiro xadrez e duas peças
draw[TILE_INDEX.gameTable] = (r) => {
  r(2, 12, 12, 3, C.shadow);
  r(1, 3, 14, 9, '#8f5e3d');
  r(1, 1, 14, 9, '#b07a52');
  r(3, 2, 10, 7, '#5e3a24');
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) r(4 + x * 2, 3 + y * 2, 2, 2, (x + y) % 2 ? '#3d2a22' : '#f2ead8');
  r(5, 2, 1, 2, '#e07a5f');
  r(10, 6, 1, 2, '#81b29a');
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

export const WINDOW_X = new Set([12, 15]);

// Peças do pacote Kenney "Roguelike Indoors" (CC0; ver art/kenney/CREDITS.md). Índice = linha × 27 + coluna.
export const KENNEY = {
  counter: 441,
  counterEnd: 442,
  shelves: [478, 479, 480],
  plants: [16, 17],
  table: 87,
  chairFacingRight: 57,
  chairFacingLeft: 56,
  rugTop: [232, 233, 233, 234],
  rugBottom: [259, 260, 260, 261],
  // decoração de parede (linha 1): quadros
  // quadros e arandelas (candelabros de parede)
  wallArt: { 3: 341, 6: 344, 7: 345, 11: 342, 13: 21, 16: 22, 17: 343 } as Record<number, number>,
} as const;

// o que fica em cima do balcão, pela coluna
const COUNTER_PROPS: Record<number, number> = { 2: TILE_INDEX.cups, 4: TILE_INDEX.pastryCase, 7: TILE_INDEX.register };

// Converte o mapa de letras em três camadas (-1 = vazio):
//  ground: piso e paredes (arte própria) · furniture: móveis do Kenney · objects: objetos próprios do café
export function buildLayers(): { ground: number[][]; furniture: number[][]; objects: number[][] } {
  const ground: number[][] = [];
  const furniture: number[][] = [];
  const objects: number[][] = [];
  const rugX0 = Array.from({ length: MAP_W }, (_, x) => x).find((x) => tileAt(x, 5) === 'R') ?? 0;
  for (let y = 0; y < MAP_H; y++) {
    const g: number[] = [];
    const f: number[] = [];
    const o: number[] = [];
    for (let x = 0; x < MAP_W; x++) {
      const t = tileAt(x, y);
      const floorTile = (x * 7 + y * 3) % 5 === 0 ? TILE_INDEX.floorB : TILE_INDEX.floorA;
      if (t === 'W') g.push(y === 1 && x > 0 && x < MAP_W - 1 ? (WINDOW_X.has(x) ? TILE_INDEX.window : TILE_INDEX.wallFace) : TILE_INDEX.wallTop);
      else if (t === 'D' || t === 'H') g.push(TILE_INDEX.doorMat);
      else g.push(floorTile);

      let k = -1;
      if (t === 'C') k = tileAt(x + 1, y) === 'C' ? KENNEY.counter : KENNEY.counterEnd;
      else if (t === 'S') k = KENNEY.shelves[x % KENNEY.shelves.length];
      else if (t === 'P') k = KENNEY.plants[(x + y) % 2];
      else if (t === 'T') k = KENNEY.table;
      else if (t === 'c') k = tileAt(x + 1, y) === 'T' ? KENNEY.chairFacingRight : KENNEY.chairFacingLeft;
      else if (t === 'R') {
        const i = Math.min(3, x - rugX0);
        // o tapete do Kenney tem uma linha só: fica no meio da área do tapete
        k = y === 6 ? KENNEY.rugTop[i] : -1;
      } else if (y === 1 && t === 'W' && KENNEY.wallArt[x] !== undefined) k = KENNEY.wallArt[x];
      f.push(k);

      const own: Partial<Record<string, number>> = { M: TILE_INDEX.machine, K: TILE_INDEX.cushion, G: TILE_INDEX.gameTable };
      o.push(own[t] ?? (t === 'C' ? (COUNTER_PROPS[x] ?? -1) : -1));
    }
    ground.push(g);
    furniture.push(f);
    objects.push(o);
  }
  return { ground, furniture, objects };
}

// ── Casa ────────────────────────────────────────────────────────────────────

const HOUSE_KENNEY = {
  // cama de casal 2×2: laranja no quarto 0, verde no quarto 1
  beds: [
    [12, 13, 39, 40],
    [14, 15, 41, 42],
  ],
  sofa: [320, 321],
  armchair: 322,
  stove: 392,
} as const;

// Converte o mapa da casa nas mesmas três camadas do café.
export function buildHouseLayers(): { ground: number[][]; furniture: number[][]; objects: number[][] } {
  const at = (x: number, y: number) => charAt(HOUSE_MAP, x, y);
  const ground: number[][] = [];
  const furniture: number[][] = [];
  const objects: number[][] = [];
  for (let y = 0; y < HOUSE_MAP.h; y++) {
    const g: number[] = [];
    const f: number[] = [];
    const o: number[] = [];
    for (let x = 0; x < HOUSE_MAP.w; x++) {
      const t = at(x, y);
      const wood = (x * 7 + y * 3) % 5 === 0 ? TILE_INDEX.floorB : TILE_INDEX.floorA;
      if (t === 'W') g.push(y === 1 ? (HOUSE_WINDOWS_X.includes(x) ? TILE_INDEX.window : TILE_INDEX.wallFace) : y === 8 && x > 0 && x < HOUSE_MAP.w - 1 && x !== 14 ? TILE_INDEX.wallFace : TILE_INDEX.wallTop);
      else if (t === 'E' || t === 'Q') g.push(TILE_INDEX.doorMat);
      else if (t === ',' || (t === 'd' && y > 8) || at(x, y) === 'O' || at(x, y) === 'A') g.push(TILE_INDEX.parquet);
      else if (t === '_' || t === 'F' || t === 'C') g.push(TILE_INDEX.kitchenTile);
      else g.push(wood);

      let k = -1;
      if (t === 'B') {
        const left = at(x - 1, y) !== 'B';
        const top = at(x, y - 1) !== 'B';
        k = HOUSE_KENNEY.beds[x < 11 ? 0 : 1][(top ? 0 : 2) + (left ? 0 : 1)];
      } else if (t === 'O') k = HOUSE_KENNEY.sofa[at(x - 1, y) === 'O' ? 1 : 0];
      else if (t === 'A') k = HOUSE_KENNEY.armchair;
      else if (t === 'F') k = HOUSE_KENNEY.stove;
      else if (t === 'C') k = at(x + 1, y) === 'C' ? KENNEY.counter : KENNEY.counterEnd;
      f.push(k);
      o.push(t === 'X' ? TILE_INDEX.movingBox : -1);
    }
    ground.push(g);
    furniture.push(f);
    objects.push(o);
  }
  return { ground, furniture, objects };
}
