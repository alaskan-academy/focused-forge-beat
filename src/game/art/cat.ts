// Gato do café (Mochi) e o Cantinho do gato, desenhados em código (placeholder).
// Quadros do gato (16×12, olhando para a direita): 0-1 andando, 2 sentado, 3 dormindo.

export const CAT_W = 16;
export const CAT_H = 12;
export const CAT_FRAMES = 4;

type R = (x: number, y: number, w: number, h: number, c: string) => void;

const C = { fur: '#e8954a', dark: '#b8662a', light: '#f7c58f', out: '#3b2416', eye: '#2b1d1a', nose: '#e07a7a' };

const frames: ((r: R) => void)[] = [
  // andando A
  (r) => {
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
  (r) => {
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
  (r) => {
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
  (r) => {
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

function outline(ctx: CanvasRenderingContext2D, ox: number) {
  const img = ctx.getImageData(ox, 0, CAT_W, CAT_H);
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < CAT_W && y < CAT_H && img.data[(y * CAT_W + x) * 4 + 3] > 0;
  ctx.fillStyle = C.out;
  for (let y = 0; y < CAT_H; y++)
    for (let x = 0; x < CAT_W; x++) if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) ctx.fillRect(ox + x, y, 1, 1);
}

export function buildCatSheet(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CAT_W * CAT_FRAMES;
  canvas.height = CAT_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  frames.forEach((fn, i) => {
    fn((x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(i * CAT_W + x, y, w, h);
    });
    outline(ctx, i * CAT_W);
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
