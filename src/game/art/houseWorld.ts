// Visual "2.5D" dos interiores (casa e café), sem Phaser: o chão e as paredes numa imagem só.
// Pisos quentes, papel de parede de cada cômodo com rodapé, janelas com céu e cortina, paredes
// com espessura (topo claro, borda escura) e sombra suave onde o piso encontra a parede e embaixo
// dos móveis fixos. Luz sempre vindo de cima/esquerda, como no quintal.
import { CAFE_MAP, TILE } from '@/lib/coffee/map';
import { charAt, type GameMap } from '@/lib/coffee/grid';
import { HOUSE_MAP, HOUSE_WINDOWS_X, roomAt } from '@/lib/coffee/house';

type R = (x: number, y: number, w: number, h: number, c: string) => void;
type Paper = 'peach' | 'mint' | 'cream' | 'tiles' | 'butter';
type Floor = (r: R, x: number, y: number, tx: number, ty: number, rand: () => number) => void;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const PAPER: Record<Paper, { base: string; motif: string; motif2: string }> = {
  peach: { base: '#f8dccb', motif: '#f1b8a4', motif2: '#fff1e6' }, // coraçõezinhos
  mint: { base: '#d3ecdf', motif: '#a9d6c0', motif2: '#f2fbf6' }, // estrelinhas
  cream: { base: '#f5e6c8', motif: '#ead2a6', motif2: '#fbf3e2' }, // listras
  tiles: { base: '#f6f3ec', motif: '#d9d3c6', motif2: '#9fd0e0' }, // azulejo
  butter: { base: '#f7e3b3', motif: '#e8c787', motif2: '#fff4d6' }, // amarelinho com grãos de café
};
const WALL = { top: '#8c5e48', topLight: '#a8775e', edge: '#5e3d2f', side: '#74493a' };

// ── pisos ──
const HONEY = { base: '#d9a066', alt: '#cf955c', line: '#b27744', light: '#ebb985', grain: '#c68b55' };
const planks: Floor = (r, x0, y0, _tx, _ty, rand) => {
  for (let i = 0; i < 4; i++) {
    const y = y0 + i * 4;
    r(x0, y, TILE, 4, i % 2 ? HONEY.alt : HONEY.base);
    r(x0, y, TILE, 1, HONEY.light);
    r(x0, y + 3, TILE, 1, HONEY.line);
    if (rand() < 0.6) r(x0 + Math.floor(rand() * 14) + 1, y, 1, 3, HONEY.line);
    r(x0 + Math.floor(rand() * 10) + 2, y + 1 + Math.floor(rand() * 2), 3, 1, HONEY.grain);
  }
};
// tábua larga e lisa (sala da casa e salão do café): calma, quase sem detalhe
const widePlanks =
  (c: { a: string; b: string; line: string; light: string }): Floor =>
  (r, x0, y0, tx, ty) => {
    for (let i = 0; i < 2; i++) {
      const y = y0 + i * 8;
      const row = ty * 2 + i;
      r(x0, y, TILE, 8, row % 2 ? c.b : c.a);
      r(x0, y, TILE, 1, c.light);
      r(x0, y + 7, TILE, 1, c.line);
      // emenda a cada 3 tiles, desencontrada por fileira
      if ((tx + row * 2) % 3 === 0) r(x0, y, 1, 7, c.line);
    }
  };
const LIVING = widePlanks({ a: '#d6a271', b: '#cf9a69', line: '#b88452', light: '#e2b384' });
const CAFE = widePlanks({ a: '#c98d5a', b: '#c18553', line: '#a66f42', light: '#d79f6d' });
const kitchenTile: Floor = (r, x0, y0, tx, ty) => {
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 2; i++) {
      const x = x0 + i * 8;
      const y = y0 + j * 8;
      r(x, y, 8, 8, (tx * 2 + i + ty * 2 + j) % 2 ? '#bfe3d0' : '#f8eedb');
      r(x, y, 8, 1, 'rgba(255,255,255,0.45)');
      r(x + 7, y, 1, 8, 'rgba(120,100,80,0.18)');
      r(x, y + 7, 8, 1, 'rgba(120,100,80,0.18)');
    }
};
// lajotinha de barro atrás do balcão do café
const terracotta: Floor = (r, x0, y0, tx, ty) => {
  for (let j = 0; j < 2; j++)
    for (let i = 0; i < 2; i++) {
      const x = x0 + i * 8;
      const y = y0 + j * 8;
      r(x, y, 8, 8, (tx + i + ty + j) % 2 ? '#dc9a74' : '#e3a780');
      r(x, y, 8, 1, '#efbd9a');
      r(x + 7, y, 1, 8, '#c27f5c');
      r(x, y + 7, 8, 1, '#c27f5c');
    }
};

function wallpaper(r: R, x: number, y: number, kind: Paper) {
  const p = PAPER[kind];
  r(x, y, TILE, 11, p.base);
  if (kind === 'tiles') {
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 4; i++) {
        r(x + i * 4, y + j * 4, 4, 4, (i + j) % 3 === 0 ? p.motif2 : p.base);
        r(x + i * 4 + 3, y + j * 4, 1, 4, p.motif);
        r(x + i * 4, y + j * 4 + 3, 4, 1, p.motif);
      }
  } else if (kind === 'cream') {
    for (let i = 0; i < 16; i += 4) r(x + i + 1, y, 2, 11, p.motif);
  } else {
    for (const [dx, dy] of [
      [3, 2],
      [11, 6],
    ]) {
      if (kind === 'peach') {
        r(x + dx, y + dy, 1, 1, p.motif);
        r(x + dx + 2, y + dy, 1, 1, p.motif);
        r(x + dx, y + dy + 1, 3, 1, p.motif);
        r(x + dx + 1, y + dy + 2, 1, 1, p.motif);
      } else if (kind === 'mint') {
        r(x + dx + 1, y + dy, 1, 3, p.motif);
        r(x + dx, y + dy + 1, 3, 1, p.motif);
      } else {
        // grão de café
        r(x + dx, y + dy, 2, 3, '#b07a4a');
        r(x + dx + 1, y + dy, 1, 3, '#8a5a34');
      }
    }
    r(x + 7, y + 9, 1, 1, p.motif2);
  }
  r(x, y, TILE, 1, '#fffaf0');
  r(x, y + 11, TILE, 1, '#e2b88a');
  r(x, y + 12, TILE, 3, '#c48a5c');
  r(x, y + 12, TILE, 1, '#d9a273');
  r(x, y + 15, TILE, 1, '#8f5d3f');
}

function windowOn(r: R, x: number, y: number) {
  r(x + 2, y + 1, 12, 10, '#fffaf0');
  r(x + 3, y + 2, 10, 8, '#a9dcf2');
  r(x + 3, y + 2, 10, 3, '#cdeefb');
  r(x + 5, y + 4, 4, 1, '#ffffff');
  r(x + 4, y + 5, 6, 1, '#ffffff');
  r(x + 7, y + 2, 2, 8, '#fffaf0');
  r(x + 3, y + 6, 10, 1, '#fffaf0');
  r(x + 1, y + 1, 2, 10, '#f29e9e');
  r(x + 13, y + 1, 2, 10, '#f29e9e');
  r(x + 1, y + 1, 1, 10, '#f7bcbc');
  r(x + 1, y + 11, 14, 1, '#d9a273');
}

type InteriorOpts = {
  map: GameMap;
  wall: string; // letra da parede
  floor: (tx: number, ty: number) => Floor;
  paper: (tx: number, ty: number) => Paper; // papel da parede cuja frente fica acima de (tx, ty)
  isWindow: (tx: number, ty: number) => boolean;
  mats: Record<string, [string, string]>; // capachos das portas
  solid: string; // móveis fixos que ganham sombra embaixo
  seed: number;
};

function buildInterior(o: InteriorOpts): HTMLCanvasElement {
  const { map } = o;
  const c = document.createElement('canvas');
  c.width = map.w * TILE;
  c.height = map.h * TILE;
  const ctx = c.getContext('2d')!;
  const r: R = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
  const rand = rng(o.seed);
  const at = (x: number, y: number) => charAt(map, x, y);
  const isWall = (x: number, y: number) => at(x, y) === o.wall;
  const isFace = (x: number, y: number) => isWall(x, y) && y + 1 < map.h && !isWall(x, y + 1);

  for (let ty = 0; ty < map.h; ty++)
    for (let tx = 0; tx < map.w; tx++) if (!isWall(tx, ty)) o.floor(tx, ty)(r, tx * TILE, ty * TILE, tx, ty, rand);

  for (let ty = 0; ty < map.h; ty++)
    for (let tx = 0; tx < map.w; tx++) {
      if (!isWall(tx, ty)) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      if (isFace(tx, ty)) {
        wallpaper(r, x, y, o.paper(tx, ty + 1));
        if (o.isWindow(tx, ty)) windowOn(r, x, y);
      } else {
        r(x, y, TILE, TILE, WALL.top);
        r(x, y, TILE, 1, WALL.topLight);
        r(x, y, 1, TILE, WALL.topLight);
        r(x + 4, y + 6, 3, 1, WALL.side);
        r(x + 10, y + 11, 3, 1, WALL.side);
        if (tx + 1 < map.w && !isWall(tx + 1, ty)) r(x + 14, y, 2, TILE, WALL.edge);
        if (tx > 0 && !isWall(tx - 1, ty)) r(x, y, 2, TILE, WALL.side);
        if (ty + 1 < map.h && !isWall(tx, ty + 1)) r(x, y + 13, TILE, 3, WALL.edge);
      }
    }

  for (let ty = 0; ty < map.h; ty++)
    for (let tx = 0; tx < map.w; tx++) {
      if (isWall(tx, ty)) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      if (isWall(tx, ty - 1)) {
        r(x, y, TILE, 2, 'rgba(70,35,20,0.28)');
        r(x, y + 2, TILE, 2, 'rgba(70,35,20,0.12)');
      }
      if (isWall(tx - 1, ty)) r(x, y, 2, TILE, 'rgba(70,35,20,0.2)');
      if (isWall(tx + 1, ty)) r(x + 14, y, 2, TILE, 'rgba(70,35,20,0.12)');
      const mat = o.mats[at(tx, ty)];
      if (mat) {
        r(x + 2, y + 2, 12, 12, mat[0]);
        r(x + 3, y + 3, 10, 10, mat[1]);
        r(x + 5, y + 7, 6, 2, '#fffaf0');
      }
      const t = at(tx, ty);
      if (o.solid.includes(t) && at(tx, ty + 1) !== t) {
        r(x + 1, y + 15, 14, 2, 'rgba(70,35,20,0.25)');
        r(x + 2, y + 17, 12, 1, 'rgba(70,35,20,0.12)');
      }
    }
  return c;
}

const ROOM_PAPER: Record<string, Paper> = { bedroom0: 'peach', bedroom1: 'mint', living: 'cream', kitchen: 'tiles' };

export function buildHouseGround(): HTMLCanvasElement {
  return buildInterior({
    map: HOUSE_MAP,
    wall: 'W',
    seed: 11,
    floor: (tx, ty) => {
      const room = roomAt({ x: tx, y: ty })?.id ?? (tx >= 15 ? 'kitchen' : 'living');
      return room === 'kitchen' ? kitchenTile : room === 'living' ? LIVING : planks;
    },
    paper: (tx, ty) => ROOM_PAPER[roomAt({ x: tx, y: ty })?.id ?? 'living'],
    isWindow: (tx, ty) => ty === 1 && HOUSE_WINDOWS_X.includes(tx),
    mats: { E: ['#c4554d', '#d7735f'], Q: ['#6aa36f', '#86c271'] },
    solid: 'BXOAFC',
  });
}

export function buildCafeGround(windows: Set<number>): HTMLCanvasElement {
  return buildInterior({
    map: CAFE_MAP,
    wall: 'W',
    seed: 5,
    // atrás do balcão (fileiras 2 e 3, até o fim do balcão): lajotinha de barro
    floor: (tx, ty) => (ty <= 3 && tx <= 8 ? terracotta : CAFE),
    paper: () => 'butter',
    isWindow: (tx, ty) => ty === 1 && windows.has(tx),
    mats: { D: ['#c4554d', '#d7735f'], H: ['#5b6ea8', '#7d8fc4'] },
    solid: 'CMSPTG',
  });
}
