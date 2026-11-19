// Desenho dos móveis da casa num canvas (sem Phaser): usado pela cena (vira textura) e pela
// loja (prévia). Peças do pacote Kenney são copiadas da folha; as outras são desenhadas aqui.
import type { CustomSprite, Furniture, Sprite } from '@/content/coffee/furniture';
import { buildCatBed, buildScratcher } from './cat';

type R = (x: number, y: number, w: number, h: number, c: string) => void;

const SHADOW = 'rgba(40,24,14,0.28)';
const WOOD = '#b07a4c';
const WOOD_D = '#7d4f33';
const WOOD_L = '#c99a6a';
const INK = '#3a2a24';

// escurece/clareia uma cor #rrggbb
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

const CUSTOM: Record<CustomSprite, (r: R, color: string, ctx: CanvasRenderingContext2D) => void> = {
  cactus: (r) => {
    r(4, 13, 8, 2, SHADOW);
    r(5, 10, 6, 4, '#c4554d');
    r(5, 10, 6, 1, '#d9694a');
    r(7, 3, 2, 7, '#4f8a5b');
    r(4, 5, 2, 3, '#4f8a5b');
    r(10, 4, 2, 3, '#4f8a5b');
    r(5, 7, 2, 1, '#4f8a5b');
    r(9, 6, 2, 1, '#4f8a5b');
    r(7, 3, 1, 7, '#6aa36f');
    r(8, 2, 1, 1, '#f2cc8f');
  },
  cushion: (r, col) => {
    r(2, 12, 12, 3, SHADOW);
    r(2, 7, 12, 6, col);
    r(3, 6, 10, 1, col);
    r(3, 7, 10, 2, shade(col, 1.18));
    r(7, 9, 2, 2, shade(col, 0.75));
    r(2, 12, 12, 1, shade(col, 0.7));
  },
  basket: (r) => {
    r(3, 13, 10, 2, SHADOW);
    r(3, 6, 10, 8, '#c9a46c');
    for (let y = 7; y < 14; y += 2) r(3, y, 10, 1, '#a9844e');
    r(3, 5, 10, 2, '#8a6a3a');
    r(5, 4, 3, 2, '#e6d2ad');
    r(8, 3, 3, 3, '#5b6ea8');
  },
  teddy: (r) => {
    r(4, 13, 8, 2, SHADOW);
    r(4, 8, 8, 6, '#a8714f');
    r(5, 3, 6, 6, '#b9835a');
    r(4, 2, 2, 2, '#a8714f');
    r(10, 2, 2, 2, '#a8714f');
    r(6, 6, 4, 2, '#e6c39a');
    r(6, 5, 1, 1, INK);
    r(9, 5, 1, 1, INK);
    r(7, 6, 2, 1, INK);
    r(6, 10, 4, 3, '#e6c39a');
    r(5, 8, 6, 1, '#c4554d');
  },
  clock: (r) => {
    r(3, 3, 10, 10, WOOD_D);
    r(4, 4, 8, 8, '#fffaf0');
    r(7, 5, 2, 4, INK);
    r(8, 8, 3, 1, INK);
    r(7, 4, 2, 1, '#c4554d');
  },
  calendar: (r) => {
    r(4, 3, 8, 11, '#fffaf0');
    r(4, 3, 8, 3, '#c4554d');
    r(5, 2, 1, 2, INK);
    r(10, 2, 1, 2, INK);
    for (let y = 7; y < 13; y += 2) for (let x = 5; x < 11; x += 2) r(x, y, 1, 1, '#8a6a4a');
    r(9, 9, 2, 2, '#c4554d');
  },
  poster: (r, col) => {
    r(3, 2, 10, 12, '#fffaf0');
    r(4, 3, 8, 10, col);
    r(5, 4, 6, 4, shade(col, 1.3));
    r(6, 9, 4, 1, '#fffaf0');
    r(5, 11, 6, 1, '#fffaf0');
  },
  trash: (r) => {
    r(4, 13, 8, 2, SHADOW);
    r(4, 6, 8, 8, '#8a9aa8');
    r(4, 6, 8, 1, '#aab8c4');
    for (let x = 5; x < 12; x += 2) r(x, 8, 1, 5, '#6c7a88');
    r(3, 5, 10, 2, '#6c7a88');
  },
  fan: (r) => {
    r(4, 13, 8, 2, SHADOW);
    r(5, 13, 6, 1, '#6c7a88');
    r(7, 8, 2, 5, '#8a9aa8');
    r(3, 1, 10, 9, '#aab8c4');
    r(4, 2, 8, 7, '#e9eef2');
    r(7, 4, 2, 3, '#6c7a88');
    r(5, 3, 2, 2, '#c8d4dc');
    r(9, 6, 2, 2, '#c8d4dc');
  },
  smallRug: (r, col) => {
    r(1, 3, 14, 10, shade(col, 0.75));
    r(2, 4, 12, 8, col);
    r(4, 6, 8, 4, shade(col, 1.25));
    for (let x = 1; x < 15; x += 2) {
      r(x, 2, 1, 1, '#fffaf0');
      r(x, 13, 1, 1, '#fffaf0');
    }
  },
  beanbag: (r, col) => {
    r(1, 12, 14, 3, SHADOW);
    r(2, 6, 12, 8, col);
    r(4, 4, 8, 3, col);
    r(3, 6, 6, 3, shade(col, 1.2));
    r(5, 9, 6, 2, shade(col, 0.8));
    r(2, 13, 12, 1, shade(col, 0.65));
  },
  coffeeMaker: (r) => {
    r(1, 13, 14, 2, SHADOW);
    r(1, 8, 14, 6, WOOD);
    r(1, 8, 14, 1, WOOD_L);
    r(4, 1, 8, 8, '#3a3a3a');
    r(5, 2, 6, 2, '#5a5a5a');
    r(6, 5, 4, 3, '#fffaf0');
    r(7, 6, 2, 1, '#7d4f33');
    r(11, 3, 1, 1, '#c4554d');
  },
  recordPlayer: (r) => {
    r(1, 13, 14, 2, SHADOW);
    r(2, 8, 12, 6, WOOD_D);
    r(1, 5, 14, 4, WOOD);
    r(3, 5, 7, 3, INK);
    r(5, 6, 3, 1, '#c4554d');
    r(11, 5, 1, 3, '#d8dde2');
    r(4, 10, 8, 1, WOOD_L);
  },
  guitar: (r) => {
    r(4, 14, 8, 1, SHADOW);
    r(7, 1, 2, 7, WOOD_D);
    r(6, 0, 4, 2, INK);
    r(4, 7, 8, 7, '#d9934a');
    r(5, 6, 6, 2, '#d9934a');
    r(7, 9, 2, 2, INK);
    r(5, 12, 6, 1, '#b8743a');
  },
  catBed: (_r, _c, ctx) => {
    ctx.drawImage(buildCatBed(), 0, 5);
  },
  phone: (r) => {
    r(2, 13, 12, 2, SHADOW);
    r(3, 8, 10, 6, WOOD);
    r(3, 8, 10, 1, WOOD_L);
    r(4, 13, 1, 2, WOOD_D);
    r(11, 13, 1, 2, WOOD_D);
    r(5, 4, 6, 4, '#c4554d');
    r(4, 3, 8, 2, '#a8443d');
    r(7, 5, 2, 2, '#fffaf0');
  },
  desk: (r) => {
    r(1, 13, 14, 2, SHADOW);
    r(1, 6, 14, 3, WOOD_L);
    r(1, 9, 14, 1, WOOD_D);
    r(2, 10, 2, 5, WOOD_D);
    r(12, 10, 2, 5, WOOD_D);
    r(8, 10, 4, 3, WOOD);
    r(4, 4, 5, 3, '#fffaf0');
    r(5, 5, 3, 1, '#8a6a4a');
    r(10, 3, 1, 4, '#5b6ea8');
  },
  stringLights: (r) => {
    const cols = ['#f2cc8f', '#e8b64c', '#fff3c4', '#f29e6c'];
    for (let x = 0; x < 32; x++) {
      const y = 5 + Math.round(Math.sin((x / 32) * Math.PI * 2) * 2);
      r(x, y, 1, 1, '#5e3a24');
      if (x % 4 === 2) {
        r(x - 1, y + 1, 3, 3, 'rgba(255,214,150,0.35)');
        r(x, y + 1, 1, 2, cols[(x >> 2) % cols.length]);
      }
    }
  },
  tv: (r) => {
    r(1, 13, 14, 2, SHADOW);
    r(1, 10, 14, 4, WOOD_D);
    r(1, 10, 14, 1, WOOD);
    r(2, 1, 12, 9, INK);
    r(3, 2, 10, 7, '#5b8fb0');
    r(4, 3, 4, 2, '#9cc4dc');
    r(7, 9, 2, 1, '#555');
    r(12, 11, 1, 1, '#c4554d');
  },
  computer: (r) => {
    r(1, 13, 14, 2, SHADOW);
    r(1, 8, 14, 2, WOOD_L);
    r(2, 10, 2, 5, WOOD_D);
    r(12, 10, 2, 5, WOOD_D);
    r(3, 1, 10, 7, '#d8dde2');
    r(4, 2, 8, 5, '#2a3a5a');
    r(5, 3, 4, 1, '#6aa36f');
    r(5, 5, 6, 1, '#9cc4dc');
    r(7, 8, 2, 1, '#aab8c4');
    r(5, 9, 6, 1, '#3a3a3a');
  },
  aquarium: (r) => {
    r(1, 13, 14, 2, SHADOW);
    r(1, 11, 14, 4, WOOD_D);
    r(1, 2, 14, 9, '#d8eef2');
    r(2, 3, 12, 7, '#5bb0c4');
    r(2, 3, 12, 1, '#9cd8e4');
    r(2, 9, 12, 1, '#e6d2ad');
    r(4, 6, 3, 2, '#e8b64c');
    r(3, 6, 1, 2, '#e8b64c');
    r(9, 4, 2, 1, '#c4554d');
    r(11, 6, 1, 3, '#4f8a5b');
    r(12, 5, 1, 4, '#6aa36f');
  },
  scratcher: (_r, _c, ctx) => {
    ctx.drawImage(buildScratcher(), 2, -4);
  },
  monstera: (r) => {
    r(3, 13, 10, 2, SHADOW);
    r(5, 10, 6, 4, '#c79a62');
    r(5, 10, 6, 1, '#d9b07a');
    r(7, 6, 2, 4, '#3d6e48');
    r(1, 2, 7, 5, '#4f8a5b');
    r(8, 0, 7, 6, '#4f8a5b');
    r(2, 3, 2, 1, '#6aa36f');
    r(10, 1, 3, 1, '#6aa36f');
    r(4, 4, 1, 2, '#2f5a3a');
    r(11, 3, 1, 2, '#2f5a3a');
    r(3, 7, 4, 2, '#3d6e48');
  },
  chessTable: (r) => {
    r(1, 13, 14, 2, SHADOW);
    r(1, 5, 14, 7, WOOD_D);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) r(2 + x * 2, 6 + y * 2, 2, 2, (x + y) % 2 ? '#fffaf0' : INK);
    r(2, 12, 2, 3, WOOD_D);
    r(12, 12, 2, 3, WOOD_D);
    r(4, 3, 1, 3, '#fffaf0');
    r(10, 3, 1, 3, INK);
  },
  fireplace: (r) => {
    r(0, 14, 32, 2, SHADOW);
    r(0, 2, 32, 13, '#a8a29a');
    for (let y = 3; y < 14; y += 3) for (let x = (y % 2) * 3; x < 32; x += 6) r(x, y, 5, 2, '#bdb7ae');
    r(0, 1, 32, 2, WOOD_D);
    r(8, 6, 16, 9, '#2a1a14');
    r(10, 11, 12, 2, WOOD_D);
    r(12, 8, 3, 4, '#e8b64c');
    r(15, 7, 3, 5, '#f29e6c');
    r(18, 9, 2, 3, '#e8b64c');
    r(13, 10, 6, 2, '#c4554d');
    r(4, -1, 3, 3, '#4f8a5b');
  },
  catTree: (r) => {
    r(2, 29, 12, 3, SHADOW);
    r(2, 26, 12, 4, '#d9c7a8');
    r(7, 4, 3, 23, '#c9a46c');
    for (let y = 6; y < 26; y += 2) r(7, y, 3, 1, '#a9844e');
    r(1, 14, 8, 3, '#d9c7a8');
    r(1, 14, 8, 1, '#efe2c6');
    r(6, 2, 9, 4, '#d9c7a8');
    r(6, 2, 9, 1, '#efe2c6');
    r(3, 17, 1, 4, '#f2cc8f');
    r(3, 21, 2, 2, '#c4554d');
  },
  pendulumClock: (r) => {
    r(3, 29, 10, 3, SHADOW);
    r(3, 1, 10, 30, WOOD_D);
    r(4, 2, 8, 8, WOOD);
    r(5, 3, 6, 6, '#fffaf0');
    r(7, 4, 2, 3, INK);
    r(8, 6, 2, 1, INK);
    r(5, 12, 6, 15, '#5e3a24');
    r(7, 12, 1, 9, '#e8b64c');
    r(6, 20, 3, 3, '#e8b64c');
    r(3, 0, 10, 2, WOOD_L);
  },
};

// Desenha a variante de um móvel; `kenney` é a imagem da folha do pacote (16 px com 1 px de espaço).
export function drawFurniture(f: Furniture, variant: number, kenney: CanvasImageSource | null): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = f.w * 16;
  canvas.height = f.h * 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const sprite: Sprite = (f.variants[variant] ?? f.variants[0]).sprite;
  if ('k' in sprite) {
    if (kenney)
      sprite.k.forEach((id, i) => {
        const sx = (id % 27) * 17;
        const sy = Math.floor(id / 27) * 17;
        ctx.drawImage(kenney, sx, sy, 16, 16, (i % f.w) * 16, Math.floor(i / f.w) * 16, 16, 16);
      });
  } else {
    const r: R = (x, y, w, h, col) => {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
    };
    CUSTOM[sprite.c](r, sprite.color ?? '#d9694a', ctx);
  }
  return canvas;
}
