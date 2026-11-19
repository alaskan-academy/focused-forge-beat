// Visual "2.5D" do quintal (sem Phaser): o chão inteiro numa imagem só (grama com manchas de luz,
// caminho de terra, lago com margem e fundo, canteiros elevados com frente de madeira) e sprites
// com volume para as árvores e a barraquinha de sementes. Luz sempre vindo de cima/esquerda.
import { TILE } from '@/lib/coffee/map';
import { charAt } from '@/lib/coffee/grid';
import { GARDEN_MAP } from '@/lib/coffee/garden';

type R = (x: number, y: number, w: number, h: number, c: string) => void;

// gerador previsível (o jardim é sempre igual)
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const r: R = (x, y, ww, hh, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, ww, hh);
  };
  return { c, ctx, r };
}

// disco "pixelado" (sem antialias)
function disc(r: R, cx: number, cy: number, rad: number, col: string) {
  for (let y = -rad; y <= rad; y++) {
    const half = Math.floor(Math.sqrt(rad * rad - y * y) + 0.35);
    r(cx - half, cy + y, half * 2 + 1, 1, col);
  }
}

const GRASS = { base: '#8ccb5e', light: '#9fd96c', lighter: '#b4e57e', dark: '#7aba50', blade: '#69a845' };
const FLOWERS = ['#fffaf0', '#ffe27a', '#ff9fb8', '#c9a8ff'];

const tileAt = (x: number, y: number) => charAt(GARDEN_MAP, x, y);
const isWaterT = (x: number, y: number) => tileAt(x, y) === 'w';
const isPathT = (x: number, y: number) => tileAt(x, y) === 'P' || tileAt(x, y) === 'K';

export function buildGardenGround(): HTMLCanvasElement {
  const W = GARDEN_MAP.w * TILE;
  const H = GARDEN_MAP.h * TILE;
  const { c, r } = canvas(W, H);
  const rand = rng(7);

  // 1. grama com manchas grandes de luz e sombra (parece terreno ondulado)
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2) {
      const n = Math.sin(x * 0.045 + Math.sin(y * 0.03) * 2) + Math.sin(y * 0.06 - x * 0.02) + (rand() - 0.5) * 0.5;
      r(x, y, 2, 2, n > 1.05 ? GRASS.lighter : n > 0.35 ? GRASS.light : n < -1.1 ? GRASS.dark : GRASS.base);
    }
  // folhinhas de grama e florzinhas espalhadas
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    r(x, y, 1, 2, rand() < 0.5 ? GRASS.blade : GRASS.lighter);
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rand() * (W - 4)) + 1;
    const y = Math.floor(rand() * (H - 4)) + 1;
    const col = FLOWERS[Math.floor(rand() * FLOWERS.length)];
    r(x, y + 1, 1, 1, col);
    r(x + 2, y + 1, 1, 1, col);
    r(x + 1, y, 1, 1, col);
    r(x + 1, y + 2, 1, 1, col);
    r(x + 1, y + 1, 1, 1, '#f2b84b');
  }

  for (let ty = 0; ty < GARDEN_MAP.h; ty++)
    for (let tx = 0; tx < GARDEN_MAP.w; tx++) {
      const t = tileAt(tx, ty);
      const x = tx * TILE;
      const y = ty * TILE;
      // sombra das árvores da borda
      if (t === 'T') r(x, y, TILE, TILE, '#5f9a45');
      // caminho de terra batida, com pedrinhas e bordas suaves
      if (t === 'P' || t === 'K') {
        r(x, y + 2, TILE, 12, '#ddb880');
        if (!isPathT(tx, ty - 1)) r(x, y + 2, TILE, 1, '#ecd2a2');
        if (!isPathT(tx, ty + 1)) r(x, y + 13, TILE, 1, '#b8915c');
        if (!isPathT(tx + 1, ty)) {
          r(x + 14, y + 2, 2, 12, GRASS.base);
          r(x + 13, y + 3, 1, 10, '#c9a26a');
        }
        for (let i = 0; i < 4; i++) r(x + Math.floor(rand() * 13) + 1, y + Math.floor(rand() * 9) + 4, 2, 1, i % 2 ? '#c9a26a' : '#f0dbb0');
      }
      // degrau de pedra da porta da cozinha
      if (t === 'K') {
        r(x, y + 1, 7, 14, '#a99a8c');
        r(x, y + 1, 7, 1, '#c8bcaf');
        r(x, y + 13, 7, 2, '#857669');
        r(x + 2, y + 6, 3, 1, '#c8bcaf');
      }
      // canteiro elevado: terra fofa em cima e frente de madeira (dá volume)
      if (t === 'p') {
        r(x + 1, y + 14, 14, 2, 'rgba(40,60,20,0.35)');
        r(x + 1, y + 1, 14, 11, '#c08a5a');
        r(x + 2, y + 2, 12, 9, '#6b4428');
        for (let fy = y + 4; fy < y + 11; fy += 3) {
          r(x + 3, fy, 10, 1, '#58371f');
          r(x + 3, fy - 1, 10, 1, '#7d5333');
        }
        r(x + 1, y + 1, 14, 1, '#dcaa76');
        r(x + 1, y + 12, 14, 3, '#a8714f');
        r(x + 1, y + 12, 14, 1, '#cf9a68');
        r(x + 7, y + 13, 1, 2, '#8a5a3c');
        r(x + 1, y + 14, 14, 1, '#8a5a3c');
      }
    }

  // 2. lago: mais fundo no meio, margem de areia embaixo e barranco em cima (água "afundada")
  const dist = new Map<number, number>();
  const key = (x: number, y: number) => y * GARDEN_MAP.w + x;
  const queue: [number, number][] = [];
  for (let y = 0; y < GARDEN_MAP.h; y++)
    for (let x = 0; x < GARDEN_MAP.w; x++)
      if (isWaterT(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => !isWaterT(x + dx, y + dy))) {
        dist.set(key(x, y), 1);
        queue.push([x, y]);
      }
  while (queue.length) {
    const [x, y] = queue.shift()!;
    const d = dist.get(key(x, y))!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (isWaterT(nx, ny) && !dist.has(key(nx, ny))) {
        dist.set(key(nx, ny), d + 1);
        queue.push([nx, ny]);
      }
    }
  }
  const DEEP = ['#6fcbe0', '#57b4d4', '#449dc6'];
  for (let ty = 0; ty < GARDEN_MAP.h; ty++)
    for (let tx = 0; tx < GARDEN_MAP.w; tx++) {
      if (!isWaterT(tx, ty)) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      r(x, y, TILE, TILE, DEEP[Math.min(2, (dist.get(key(tx, ty)) ?? 1) - 1)]);
      for (let i = 0; i < 2; i++) r(x + Math.floor(rand() * 10) + 1, y + Math.floor(rand() * 13) + 2, 4, 1, 'rgba(255,255,255,0.28)');
    }
  // margens (depois da água, para ficarem por cima)
  for (let ty = 0; ty < GARDEN_MAP.h; ty++)
    for (let tx = 0; tx < GARDEN_MAP.w; tx++) {
      if (!isWaterT(tx, ty)) continue;
      const x = tx * TILE;
      const y = ty * TILE;
      const up = !isWaterT(tx, ty - 1);
      const down = !isWaterT(tx, ty + 1);
      const left = !isWaterT(tx - 1, ty);
      const right = !isWaterT(tx + 1, ty);
      if (up) {
        r(x, y, TILE, 1, '#5e9a40');
        r(x, y + 1, TILE, 3, '#8a6a45');
        r(x, y + 4, TILE, 1, 'rgba(20,60,90,0.35)');
      }
      if (down) {
        r(x, y + 13, TILE, 3, '#f0dcaa');
        r(x, y + 12, TILE, 1, '#bfe8f0');
      }
      if (left) {
        r(x, y, 2, TILE, '#e6cf98');
        r(x + 2, y, 1, TILE, '#bfe8f0');
      }
      if (right) {
        r(x + 14, y, 2, TILE, '#e6cf98');
        r(x + 13, y, 1, TILE, '#bfe8f0');
      }
      // cantos arredondados
      if (up && left) r(x, y, 4, 4, GRASS.base);
      if (up && right) r(x + 12, y, 4, 4, GRASS.base);
      if (down && left) r(x, y + 12, 4, 4, GRASS.base);
      if (down && right) r(x + 12, y + 12, 4, 4, GRASS.base);
    }
  // vitórias-régias com florzinha rosa
  for (const [tx, ty, flower] of [
    [17, 10, true],
    [20, 11, false],
    [15, 11, false],
    [19, 9, true],
  ] as const) {
    const x = tx * TILE + 5;
    const y = ty * TILE + 7;
    disc(r, x, y, 3, '#4f9a4a');
    r(x, y - 3, 1, 3, DEEP[1]);
    r(x - 2, y - 1, 2, 1, '#6fbb5a');
    if (flower) {
      r(x + 1, y, 2, 2, '#ff9fb8');
      r(x + 1, y, 1, 1, '#fffaf0');
    }
  }
  return c;
}

// árvores com copa redonda e volume (3 tipos alegres): verde, florida (rosa) e com frutinhas
export const TREE_KINDS = ['green', 'blossom', 'fruit'] as const;
export type TreeKind = (typeof TREE_KINDS)[number];
export const TREE_W = 28;
export const TREE_H = 34;

export function buildTree(kind: TreeKind): HTMLCanvasElement {
  const { c, r } = canvas(TREE_W, TREE_H);
  const pal =
    kind === 'blossom'
      ? { out: '#c4668a', dark: '#e58aac', mid: '#f5a9c4', light: '#ffd0df' }
      : { out: '#2f6b3a', dark: '#3f8a45', mid: '#56a650', light: '#7cc46a' };
  // sombra no chão
  for (let y = 0; y < 5; y++) r(4 + Math.abs(2 - y), 29 + y, 20 - Math.abs(2 - y) * 2, 1, 'rgba(25,55,25,0.32)');
  // tronco
  r(12, 20, 5, 12, '#7d4f33');
  r(12, 20, 2, 12, '#9a6844');
  r(11, 30, 7, 2, '#6a4129');
  // copa: contorno, base escura, volume claro em cima/esquerda
  disc(r, 14, 14, 12, pal.out);
  disc(r, 14, 14, 11, pal.dark);
  disc(r, 13, 12, 9, pal.mid);
  disc(r, 11, 9, 5, pal.light);
  disc(r, 20, 17, 3, pal.dark);
  r(9, 6, 3, 1, '#fffaf0');
  if (kind === 'fruit')
    for (const [x, y] of [
      [8, 15],
      [18, 9],
      [15, 19],
      [21, 14],
      [12, 4],
    ]) {
      r(x, y, 2, 2, '#e8453c');
      r(x, y, 1, 1, '#ff9f8f');
    }
  if (kind === 'blossom')
    for (const [x, y] of [
      [7, 13],
      [17, 6],
      [19, 18],
      [12, 20],
    ])
      r(x, y, 1, 1, '#fffaf0');
  return c;
}

// barraquinha de sementes (2 tiles de largura): toldo listrado com babado, bancada com caixotes
export const STALL_W = 36;
export const STALL_H = 34;
export function buildStall(): HTMLCanvasElement {
  const { c, r } = canvas(STALL_W, STALL_H);
  r(3, 30, 30, 4, 'rgba(25,55,25,0.3)');
  // postes
  r(3, 10, 2, 21, '#7d4f33');
  r(31, 10, 2, 21, '#7d4f33');
  // bancada: tampo claro e frente de madeira
  r(2, 19, 32, 3, '#e3b583');
  r(2, 19, 32, 1, '#f2cfa0');
  r(3, 22, 30, 9, '#a8714f');
  r(3, 22, 30, 1, '#7d4f33');
  for (const x of [10, 18, 26]) r(x, 23, 1, 8, '#8a5a3c');
  r(3, 30, 30, 1, '#7d4f33');
  // caixotes com sementes coloridas
  for (const [x, col] of [
    [5, '#e8b64c'],
    [12, '#6aa36f'],
    [19, '#d9463e'],
    [26, '#5a6fd0'],
  ] as const) {
    r(x, 15, 6, 4, '#c99a6a');
    r(x, 15, 6, 1, '#7d4f33');
    r(x + 1, 14, 4, 2, col);
    r(x + 1, 14, 1, 1, '#fffaf0');
  }
  // toldo: telhado (claro) + frente com listras e babado
  for (let x = 0; x < 36; x += 6) {
    r(x, 2, 3, 6, '#ef7d63');
    r(x + 3, 2, 3, 6, '#fffaf0');
  }
  r(0, 2, 36, 1, '#ffb19c');
  for (let x = 0; x < 36; x += 6) {
    r(x, 8, 3, 3, '#d9573f');
    r(x + 3, 8, 3, 3, '#ece3d0');
    r(x + 1, 11, 1, 1, '#d9573f');
    r(x + 4, 11, 1, 1, '#ece3d0');
  }
  r(0, 8, 36, 1, 'rgba(60,20,10,0.25)');
  return c;
}

// sombra macia em elipse (personagens, gatinha)
export function buildSoftShadow(w = 14, h = 5): HTMLCanvasElement {
  const { c, ctx } = canvas(w, h);
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(25,45,20,0.42)');
  g.addColorStop(0.7, 'rgba(25,45,20,0.25)');
  g.addColorStop(1, 'rgba(25,45,20,0)');
  ctx.save();
  ctx.scale(1, h / w);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(w / 2, w / 2, w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return c;
}

// pequenos detalhes vivos: tufo de grama, florzinha, borboleta (2 quadros)
export function buildTuft(): HTMLCanvasElement {
  const { c, r } = canvas(5, 5);
  r(0, 2, 1, 3, '#69a845');
  r(2, 0, 1, 5, '#7cc46a');
  r(4, 1, 1, 4, '#69a845');
  r(1, 3, 1, 2, '#9fd96c');
  r(3, 2, 1, 3, '#9fd96c');
  return c;
}
export function buildFlower(col: string): HTMLCanvasElement {
  const { c, r } = canvas(5, 7);
  r(2, 3, 1, 4, '#4f8a3b');
  r(3, 5, 1, 1, '#69a845');
  r(1, 0, 3, 3, col);
  r(0, 1, 5, 1, col);
  r(2, 1, 1, 1, '#f2b84b');
  return c;
}
export const BUTTERFLY_COLORS = ['#ffb84d', '#ff8fb1', '#8fd3ff', '#fff07a'];
export function buildButterfly(col: string): HTMLCanvasElement {
  const { c, r } = canvas(14, 5);
  // quadro 0: asas abertas
  r(0, 0, 3, 3, col);
  r(4, 0, 3, 3, col);
  r(1, 3, 2, 1, col);
  r(4, 3, 2, 1, col);
  r(3, 1, 1, 3, '#3a2a24');
  // quadro 1: asas fechando
  r(9, 0, 2, 3, col);
  r(11, 0, 2, 3, col);
  r(10, 1, 1, 3, '#3a2a24');
  return c;
}
