// Gato do café (Elias) e o Cantinho do gato, desenhados em código (placeholder).
// Quadros do gato (16×12, olhando para a direita): 0-1 andando, 2 sentado, 3 dormindo.

export const CAT_W = 16;
export const CAT_H = 12;
export const CAT_FRAMES = 4;

type R = (x: number, y: number, w: number, h: number, c: string) => void;

export type CatPalette = { fur: string; dark: string; light: string; out: string; eye: string; nose: string; flower?: string };

// Elias (laranja, do café) e a Mucego Frutífero (preta, da horta, com uma florzinha na orelha)
export const ELIAS: CatPalette = { fur: '#e8954a', dark: '#b8662a', light: '#f7c58f', out: '#3b2416', eye: '#2b1d1a', nose: '#e07a7a' };
export const MUCEGO: CatPalette = { fur: '#2c2733', dark: '#141118', light: '#433c4c', out: '#0b090d', eye: '#d8e65a', nose: '#e08a9a', flower: '#f29ec0' };

const frames: ((r: R, C: CatPalette) => void)[] = [
  // andando A
  (r, C) => {
    r(3, 5, 9, 4, C.fur);
    r(4, 5, 7, 1, C.light);
    r(11, 2, 4, 4, C.fur);
    r(11, 1, 1, 1, C.fur);
    r(14, 1, 1, 1, C.fur);
    r(13, 3, 1, 1, C.eye);
    r(14, 4, 1, 1, C.nose);
    r(4, 9, 1, 2, C.dark);
    r(10, 9, 1, 2, C.dark);
    r(6, 9, 1, 1, C.dark);
    r(1, 3, 2, 1, C.fur);
    r(2, 4, 1, 1, C.fur);
    r(6, 6, 1, 2, C.dark);
    r(8, 6, 1, 2, C.dark);
  },
  // andando B
  (r, C) => {
    r(3, 5, 9, 4, C.fur);
    r(4, 5, 7, 1, C.light);
    r(11, 2, 4, 4, C.fur);
    r(11, 1, 1, 1, C.fur);
    r(14, 1, 1, 1, C.fur);
    r(13, 3, 1, 1, C.eye);
    r(14, 4, 1, 1, C.nose);
    r(5, 9, 1, 2, C.dark);
    r(9, 9, 1, 2, C.dark);
    r(11, 9, 1, 1, C.dark);
    r(1, 2, 1, 2, C.fur);
    r(2, 4, 1, 1, C.fur);
    r(6, 6, 1, 2, C.dark);
    r(8, 6, 1, 2, C.dark);
  },
  // sentado
  (r, C) => {
    r(5, 4, 6, 7, C.fur);
    r(6, 5, 4, 5, C.light);
    r(6, 1, 5, 4, C.fur);
    r(6, 0, 1, 1, C.fur);
    r(10, 0, 1, 1, C.fur);
    r(7, 2, 1, 1, C.eye);
    r(9, 2, 1, 1, C.eye);
    r(8, 3, 1, 1, C.nose);
    r(2, 9, 4, 2, C.fur);
    r(2, 8, 1, 1, C.fur);
    r(6, 6, 1, 2, C.dark);
  },
  // dormindo (enroladinho)
  (r, C) => {
    r(3, 6, 10, 5, C.fur);
    r(4, 5, 8, 1, C.fur);
    r(5, 7, 5, 2, C.light);
    r(10, 5, 4, 3, C.fur);
    r(10, 4, 1, 1, C.fur);
    r(13, 4, 1, 1, C.fur);
    r(11, 6, 2, 1, C.dark);
    r(2, 9, 3, 2, C.dark);
    r(6, 7, 1, 2, C.dark);
  },
];

function outline(ctx: CanvasRenderingContext2D, ox: number, C: CatPalette) {
  const img = ctx.getImageData(ox, 0, CAT_W, CAT_H);
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < CAT_W && y < CAT_H && img.data[(y * CAT_W + x) * 4 + 3] > 0;
  ctx.fillStyle = C.out;
  for (let y = 0; y < CAT_H; y++)
    for (let x = 0; x < CAT_W; x++) if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) ctx.fillRect(ox + x, y, 1, 1);
}

export function buildCatSheet(C: CatPalette = ELIAS): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CAT_W * CAT_FRAMES;
  canvas.height = CAT_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  frames.forEach((fn, i) => {
    const r: R = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * CAT_W + x, y, w, h);
    };
    fn(r, C);
    outline(ctx, i * CAT_W, C);
    // florzinha na orelha (depois do contorno, para ficar por cima)
    if (C.flower) {
      const ear = i === 2 ? { x: 10, y: 0 } : i === 3 ? { x: 13, y: 3 } : { x: 14, y: 0 };
      r(ear.x - 1, ear.y, 3, 1, C.flower);
      r(ear.x, ear.y - 1 < 0 ? ear.y + 1 : ear.y - 1, 1, 1, C.flower);
      r(ear.x, ear.y, 1, 1, '#f2cc8f');
    }
  });
  return canvas;
}

// Cantinho do gato: cama (16×10) e arranhador (12×20).
export function buildCatBed(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 10;
  const ctx = canvas.getContext('2d')!;
  const r: R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  r(1, 8, 14, 2, 'rgba(40,20,10,0.25)');
  r(1, 2, 14, 7, '#7d4f33');
  r(0, 3, 16, 5, '#7d4f33');
  r(2, 3, 12, 5, '#e9a6a6');
  r(3, 4, 6, 2, '#f5c5c0');
  return canvas;
}

export function buildScratcher(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 12;
  canvas.height = 20;
  const ctx = canvas.getContext('2d')!;
  const r: R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  r(1, 18, 10, 2, 'rgba(40,20,10,0.25)');
  r(1, 16, 10, 3, '#81b29a');
  r(4, 4, 4, 13, '#d9b38c');
  for (let y = 5; y < 16; y += 2) r(4, y, 4, 1, '#b8946a');
  r(0, 1, 12, 4, '#81b29a');
  r(1, 0, 10, 1, '#a3cdb6');
  r(9, 5, 1, 4, '#e9c46a');
  r(8, 9, 3, 2, '#e07a5f');
  return canvas;
}

// ── acessórios da Mucego Frutífero ──────────────────────────────────────────
// Folha com 6 px a mais em cima (para chapéus); posição da cabeça/pescoço em cada quadro.
export const ACCESSORY_PAD = 6;
type Anchor = { hx: number; hy: number; hw: number; nx: number; ny: number; nw: number; eyeY: number; eyeX: number; front: boolean };
const ANCHORS: Anchor[] = [
  { hx: 11, hy: 2, hw: 4, nx: 11, ny: 6, nw: 3, eyeY: 3, eyeX: 13, front: false },
  { hx: 11, hy: 2, hw: 4, nx: 11, ny: 6, nw: 3, eyeY: 3, eyeX: 13, front: false },
  { hx: 6, hy: 1, hw: 5, nx: 6, ny: 5, nw: 5, eyeY: 2, eyeX: 7, front: true },
  { hx: 10, hy: 5, hw: 4, nx: 10, ny: 8, nw: 3, eyeY: 6, eyeX: 11, front: false },
];

const ACCESSORY: Record<string, (r: R, a: Anchor) => void> = {
  red_bow: (r, a) => bow(r, a, '#d9463e'),
  pink_bow: (r, a) => bow(r, a, '#f29ec0'),
  blue_bow: (r, a) => bow(r, a, '#5b8fd0'),
  bell_collar: (r, a) => {
    r(a.nx, a.ny, a.nw, 1, '#d9463e');
    r(a.nx + 1, a.ny + 1, 1, 1, '#f2cf4a');
  },
  bandana: (r, a) => {
    r(a.nx, a.ny, a.nw, 1, '#d9463e');
    r(a.nx + 1, a.ny + 1, Math.max(1, a.nw - 2), 1, '#d9463e');
  },
  scarf: (r, a) => {
    r(a.nx - 1, a.ny, a.nw + 2, 1, '#5b6ea8');
    r(a.nx, a.ny + 1, 1, 2, '#5b6ea8');
  },
  flower_crown: (r, a) => {
    for (let i = 0; i < a.hw; i++) r(a.hx + i, a.hy - 1, 1, 1, i % 2 ? '#f2cf4a' : '#f29ec0');
  },
  straw_hat: (r, a) => {
    r(a.hx - 1, a.hy - 1, a.hw + 2, 1, '#e8c46a');
    r(a.hx, a.hy - 3, a.hw, 2, '#e8c46a');
    r(a.hx, a.hy - 2, a.hw, 1, '#c4554d');
  },
  sunglasses: (r, a) => {
    if (a.front) r(a.hx, a.eyeY, a.hw, 1, '#111111');
    else r(a.eyeX - 1, a.eyeY, 3, 1, '#111111');
  },
  witch_hat: (r, a) => {
    r(a.hx - 1, a.hy - 1, a.hw + 2, 1, '#2a1d3a');
    r(a.hx, a.hy - 3, a.hw - 1, 2, '#2a1d3a');
    r(a.hx + 1, a.hy - 5, 2, 2, '#2a1d3a');
    r(a.hx, a.hy - 2, a.hw - 1, 1, '#9a6ad0');
  },
  santa_hat: (r, a) => {
    r(a.hx - 1, a.hy - 1, a.hw + 2, 1, '#fffaf0');
    r(a.hx, a.hy - 3, a.hw, 2, '#d9463e');
    r(a.hx + a.hw - 2, a.hy - 5, 2, 2, '#d9463e');
    r(a.hx + a.hw - 1, a.hy - 6, 1, 1, '#fffaf0');
  },
  golden_crown: (r, a) => {
    r(a.hx, a.hy - 2, a.hw, 2, '#f2c12e');
    r(a.hx, a.hy - 3, 1, 1, '#f2c12e');
    r(a.hx + a.hw - 1, a.hy - 3, 1, 1, '#f2c12e');
    r(a.hx + (a.hw >> 1), a.hy - 3, 1, 1, '#f2c12e');
    r(a.hx + (a.hw >> 1), a.hy - 2, 1, 1, '#d9463e');
  },
};

function bow(r: R, a: Anchor, c: string) {
  r(a.hx - 1, a.hy - 1, 3, 2, c);
  r(a.hx, a.hy - 1, 1, 2, '#3a2a24');
}

// Folha da Mucego com o acessório que ela está usando (ou nenhum).
export function buildCatSheetWithAccessory(C: CatPalette, accessory: string | null): HTMLCanvasElement {
  const base = buildCatSheet(C);
  const canvas = document.createElement('canvas');
  canvas.width = base.width;
  canvas.height = CAT_H + ACCESSORY_PAD;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(base, 0, ACCESSORY_PAD);
  const draw = accessory ? ACCESSORY[accessory] : undefined;
  if (draw)
    ANCHORS.forEach((a, i) =>
      draw((x, y, w, h, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(i * CAT_W + x, ACCESSORY_PAD + y, w, h);
      }, a),
    );
  return canvas;
}
