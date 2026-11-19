// Plantas da horta (16×16, sobre o canteiro): 0 semente · 1 broto · 2 crescendo · 3 pronta.
// Sem Phaser: usado pela cena (textura) e pela UI (prévia).
import { CROP_BY_ID, type Crop } from '@/lib/coffee/garden';

type R = (x: number, y: number, w: number, h: number, c: string) => void;

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

const LEAF = '#5aa04a';
const LEAF_D = '#3d7a3f';

function sprout(r: R) {
  r(7, 9, 2, 4, LEAF_D);
  r(4, 8, 3, 2, LEAF);
  r(9, 7, 3, 2, LEAF);
}

function bush(r: R, leaf: string) {
  r(7, 8, 2, 5, LEAF_D);
  r(3, 6, 10, 5, leaf);
  r(5, 4, 6, 3, leaf);
  r(4, 7, 3, 1, shade(leaf, 1.25));
  r(9, 5, 2, 1, shade(leaf, 1.25));
}

// fruto/flor de cada planta quando pronta
function ready(r: R, c: Crop) {
  const col = c.color;
  switch (c.id) {
    case 'carrot':
      bush(r, LEAF);
      r(6, 10, 4, 3, col);
      r(7, 13, 2, 1, col);
      break;
    case 'lettuce':
      r(2, 6, 12, 7, col);
      r(4, 5, 8, 2, shade(col, 1.15));
      r(6, 8, 4, 3, shade(col, 0.8));
      break;
    case 'pumpkin':
    case 'watermelon':
      r(3, 4, 4, 3, LEAF);
      r(2, 7, 12, 6, col);
      r(4, 6, 8, 1, col);
      for (let x = 4; x < 13; x += 3) r(x, 7, 1, 6, shade(col, 0.75));
      r(7, 5, 2, 2, LEAF_D);
      break;
    case 'corn':
      r(7, 1, 2, 12, LEAF_D);
      r(3, 5, 4, 2, LEAF);
      r(9, 8, 4, 2, LEAF);
      r(9, 3, 3, 5, col);
      r(9, 2, 3, 1, LEAF);
      break;
    case 'sunflower':
      r(7, 6, 2, 7, LEAF_D);
      r(4, 9, 3, 2, LEAF);
      r(3, 0, 10, 7, col);
      r(5, -1, 6, 9, col);
      r(6, 2, 4, 3, '#7d4f33');
      break;
    case 'strawberry':
    case 'blueberry':
    case 'tomato':
    case 'golden_apple':
      bush(r, c.leaf ?? LEAF);
      for (const [x, y] of [
        [4, 7],
        [9, 5],
        [10, 9],
        [6, 10],
      ])
        r(x, y, c.id === 'blueberry' ? 2 : 3, c.id === 'blueberry' ? 2 : 3, col);
      if (c.id === 'golden_apple') r(9, 5, 1, 1, '#fffaf0');
      break;
    default:
      // ervas: um tufo cheio, com a cor da erva
      bush(r, col);
      r(2, 5, 3, 3, col);
      r(11, 5, 3, 3, col);
      r(6, 2, 4, 3, shade(col, 1.15));
  }
}

export function drawPlant(cropId: string, stage: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  const r: R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  const crop = CROP_BY_ID[cropId];
  if (stage <= 0) {
    // semente: montinho de terra com pontinhos
    r(4, 10, 8, 3, '#8a5d3d');
    r(5, 9, 6, 1, '#8a5d3d');
    r(6, 10, 1, 1, '#e6d2ad');
    r(9, 11, 1, 1, '#e6d2ad');
  } else if (stage === 1) sprout(r);
  else if (stage === 2 || !crop) bush(r, crop?.kind === 'herb' ? crop.color : LEAF);
  else ready(r, crop);
  // brilho nas douradas
  if (crop?.kind === 'golden' && stage >= 1) {
    r(2, 2, 1, 1, '#fff3c4');
    r(13, 4, 1, 1, '#fff3c4');
  }
  return canvas;
}
