// Desenho dos itens do jardim (16 px por tile, sem Phaser): usado pela cena e pela loja.
import type { GardenThing } from '@/content/coffee/gardenShop';
import { buildCatBed, buildScratcher } from './cat';

type R = (x: number, y: number, w: number, h: number, c: string) => void;
const SH = 'rgba(30,50,20,0.3)';
const WOOD = '#a8714f';
const WOOD_D = '#7d4f33';
const WHITE = '#fffaf0';

const flowers = (r: R, petal: string, center: string) => {
  r(2, 10, 12, 4, '#4f8a5b');
  for (const [x, y] of [
    [3, 6],
    [8, 4],
    [11, 8],
    [6, 9],
  ]) {
    r(x + 1, y + 3, 1, 3, '#3d7a3f');
    r(x, y, 3, 3, petal);
    r(x + 1, y + 1, 1, 1, center);
  }
};

const DRAW: Record<string, (r: R, ctx: CanvasRenderingContext2D) => void> = {
  yarn_ball: (r) => {
    r(4, 13, 8, 2, SH);
    r(4, 7, 8, 7, '#c4554d');
    r(5, 6, 6, 1, '#c4554d');
    r(5, 8, 6, 1, '#e07a7a');
    r(5, 11, 6, 1, '#e07a7a');
    r(11, 12, 4, 1, '#c4554d');
  },
  toy_mouse: (r) => {
    r(4, 13, 9, 1, SH);
    r(5, 9, 7, 4, '#aab8c4');
    r(10, 8, 2, 2, '#c8d4dc');
    r(11, 10, 1, 1, '#2a2a2a');
    r(2, 11, 3, 1, '#e08a9a');
  },
  feather_toy: (r) => {
    r(2, 14, 12, 1, SH);
    r(2, 13, 9, 1, WOOD_D);
    r(10, 6, 3, 7, '#5b6ea8');
    r(11, 4, 2, 3, '#e07a5f');
  },
  food_bowl: (r) => {
    r(3, 12, 10, 2, SH);
    r(3, 9, 10, 4, '#c4554d');
    r(4, 8, 8, 2, '#8a5d3d');
    r(6, 11, 4, 1, WHITE);
  },
  water_bowl: (r) => {
    r(3, 12, 10, 2, SH);
    r(3, 9, 10, 4, '#5b6ea8');
    r(4, 8, 8, 2, '#9cd8e4');
  },
  sunny_cushion: (r) => {
    r(1, 12, 14, 3, SH);
    r(1, 7, 14, 7, '#e8b64c');
    r(2, 8, 12, 2, '#f2cf6a');
    r(7, 10, 2, 2, '#c99a2a');
  },
  cat_bed_garden: (_r, ctx) => {
    ctx.drawImage(buildCatBed(), 0, 5);
  },
  cat_hammock: (r) => {
    r(1, 2, 2, 13, WOOD_D);
    r(13, 2, 2, 13, WOOD_D);
    r(3, 6, 10, 1, '#e6d2ad');
    r(3, 7, 10, 3, '#c4554d');
    r(4, 10, 8, 1, '#a8443d');
    r(2, 14, 12, 1, SH);
  },
  scratching_post_garden: (_r, ctx) => {
    ctx.drawImage(buildScratcher(), 2, -4);
  },
  cat_tunnel: (r) => {
    r(0, 13, 32, 2, SH);
    r(1, 6, 30, 8, '#5b6ea8');
    for (let x = 3; x < 30; x += 4) r(x, 6, 1, 8, '#4a5a90');
    r(0, 7, 4, 6, '#2a2a3a');
    r(28, 7, 4, 6, '#2a2a3a');
  },
  cat_house: (r) => {
    r(1, 14, 14, 2, SH);
    r(2, 7, 12, 8, '#d9b07a');
    r(1, 4, 14, 4, '#c4554d');
    r(4, 2, 8, 3, '#c4554d');
    r(6, 10, 4, 5, '#3a2a24');
    r(6, 9, 4, 1, '#3a2a24');
  },
  cat_tower: (r) => {
    r(2, 14, 12, 2, SH);
    r(2, 12, 12, 3, '#d9c7a8');
    r(7, 2, 2, 11, '#c9a46c');
    r(3, 6, 10, 2, '#d9c7a8');
    r(4, 1, 8, 2, '#d9c7a8');
    r(4, 8, 1, 3, '#f2cc8f');
  },
  stone_path: (r) => {
    r(1, 2, 6, 5, '#bdb7ae');
    r(9, 5, 6, 5, '#a8a29a');
    r(3, 10, 6, 5, '#bdb7ae');
    r(2, 3, 2, 1, '#d6d0c8');
    r(10, 6, 2, 1, '#c8c2ba');
  },
  red_flowers: (r) => flowers(r, '#d9463e', '#f2cc8f'),
  yellow_flowers: (r) => flowers(r, '#f2cf4a', '#c4554d'),
  purple_flowers: (r) => flowers(r, '#9a6ad0', '#f2cc8f'),
  mushrooms: (r) => {
    r(3, 9, 2, 4, WHITE);
    r(1, 6, 6, 3, '#d9463e');
    r(2, 6, 1, 1, WHITE);
    r(10, 8, 2, 5, WHITE);
    r(8, 5, 6, 3, '#d9463e');
    r(11, 6, 1, 1, WHITE);
  },
  white_fence: (r) => {
    r(0, 7, 16, 2, WHITE);
    r(0, 11, 16, 2, WHITE);
    r(2, 3, 3, 12, WHITE);
    r(11, 3, 3, 12, WHITE);
    r(3, 2, 1, 1, WHITE);
    r(12, 2, 1, 1, WHITE);
    r(0, 14, 16, 1, SH);
  },
  bush: (r) => {
    r(1, 12, 14, 3, SH);
    r(2, 4, 12, 10, '#4f8a5b');
    r(1, 6, 14, 6, '#4f8a5b');
    r(4, 5, 4, 2, '#6aa36f');
  },
  rose_bush: (r) => {
    r(1, 12, 14, 3, SH);
    r(2, 4, 12, 10, '#3d7a3f');
    r(1, 6, 14, 6, '#3d7a3f');
    for (const [x, y] of [
      [3, 5],
      [9, 4],
      [11, 9],
      [5, 10],
      [7, 7],
    ])
      r(x, y, 2, 2, '#d9463e');
  },
  garden_gnome: (r) => {
    r(4, 14, 8, 1, SH);
    r(5, 9, 6, 5, '#5b6ea8');
    r(6, 6, 4, 3, '#f2c9a0');
    r(6, 8, 4, 3, WHITE);
    r(5, 1, 6, 5, '#d9463e');
    r(7, 0, 2, 2, '#d9463e');
  },
  watering_can: (r) => {
    r(3, 13, 10, 1, SH);
    r(4, 7, 7, 6, '#6aa36f');
    r(11, 6, 3, 2, '#6aa36f');
    r(5, 5, 4, 2, '#4f8a5b');
  },
  bird_bath: (r) => {
    r(3, 14, 10, 2, SH);
    r(6, 7, 4, 7, '#bdb7ae');
    r(2, 4, 12, 3, '#bdb7ae');
    r(3, 4, 10, 1, '#9cd8e4');
    r(4, 13, 8, 2, '#a8a29a');
  },
  scarecrow: (r) => {
    r(4, 14, 8, 2, SH);
    r(7, 6, 2, 9, WOOD_D);
    r(2, 7, 12, 2, WOOD);
    r(4, 6, 8, 5, '#5b6ea8');
    r(6, 2, 4, 4, '#e6c39a');
    r(4, 1, 8, 2, '#e8b64c');
    r(6, 0, 4, 1, '#e8b64c');
  },
  lamp_post: (r) => {
    r(5, 14, 6, 2, SH);
    r(7, 4, 2, 11, '#3a3a3a');
    r(5, 1, 6, 4, '#3a3a3a');
    r(6, 2, 4, 2, '#f2cc8f');
    r(5, 14, 6, 1, '#3a3a3a');
  },
  garden_bench: (r) => {
    r(0, 13, 32, 2, SH);
    r(2, 4, 28, 3, WOOD);
    r(2, 8, 28, 3, WOOD);
    r(2, 7, 28, 1, WOOD_D);
    r(3, 11, 2, 4, WOOD_D);
    r(27, 11, 2, 4, WOOD_D);
  },
  picnic_table: (r) => {
    r(0, 13, 32, 3, SH);
    r(2, 4, 28, 5, WOOD);
    for (let x = 2; x < 30; x += 4) r(x, 4, 4, 5, (x / 4) % 2 ? '#d9463e' : WHITE);
    r(1, 10, 30, 2, WOOD_D);
    r(4, 9, 2, 6, WOOD_D);
    r(26, 9, 2, 6, WOOD_D);
  },
  parasol: (r) => {
    r(3, 14, 10, 2, SH);
    r(7, 5, 2, 10, WHITE);
    r(1, 2, 14, 4, '#e07a5f');
    r(3, 1, 10, 1, '#e07a5f');
    for (let x = 2; x < 15; x += 4) r(x, 2, 2, 4, WHITE);
  },
  swing: (r) => {
    r(0, 14, 32, 2, SH);
    r(1, 1, 2, 14, WOOD_D);
    r(29, 1, 2, 14, WOOD_D);
    r(1, 1, 30, 2, WOOD_D);
    r(10, 3, 1, 8, '#e6d2ad');
    r(21, 3, 1, 8, '#e6d2ad');
    r(9, 11, 14, 2, WOOD);
  },
  fountain: (r) => {
    r(0, 28, 32, 4, SH);
    r(2, 16, 28, 12, '#bdb7ae');
    r(4, 18, 24, 7, '#5bb0c4');
    r(5, 19, 8, 1, '#9cd8e4');
    r(14, 6, 4, 12, '#bdb7ae');
    r(10, 4, 12, 3, '#bdb7ae');
    r(15, 0, 2, 5, '#9cd8e4');
    r(12, 2, 1, 3, '#9cd8e4');
    r(19, 2, 1, 3, '#9cd8e4');
  },
};

export function drawThing(g: Pick<GardenThing, 'id' | 'w' | 'h'>): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = g.w * 16;
  canvas.height = g.h * 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const r: R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  DRAW[g.id]?.(r, ctx);
  return canvas;
}

export const hasDrawing = (id: string) => !!DRAW[id];
