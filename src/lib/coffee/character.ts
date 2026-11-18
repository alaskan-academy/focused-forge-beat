// Personagem em camadas (corpo + sapato + calça/short + camisa + cabelo), desenhado em pixel art.
// Cada peça é uma função que pinta pixels com um "tom" (base/sombra/luz); o baker troca o tom
// pela cor escolhida e junta as camadas numa spritesheet só. Quando houver arte de verdade,
// basta trocar as funções de peça por recortes de imagens: o resto (baker, Phaser, preview) fica igual.

export const FRAME_W = 16;
export const FRAME_H = 24;
export const DIRECTIONS = ['down', 'left', 'right', 'up'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const WALK_FRAMES = 4; // parado, passo A, parado, passo B

export type Appearance = {
  skin: string;
  hair: { style: HairStyle; color: string };
  shirt: { style: ShirtStyle; color: string };
  pants: { style: PantsStyle; color: string };
  shoes: { style: ShoeStyle; color: string };
  horns?: boolean; // chifrinhos (o Belmont tem; qualquer um pode usar)
  glasses?: boolean; // óculos
  cap?: boolean; // boné (na cor da roupa)
  apron?: boolean; // avental de barista
};

export const ACCESSORIES = ['horns', 'glasses', 'cap', 'apron'] as const;
export type Accessory = (typeof ACCESSORIES)[number];

export const HAIR_STYLES = ['curto', 'longo', 'coque', 'cacheado', 'rabo de cavalo', 'black power', 'careca'] as const;
export const SHIRT_STYLES = ['camiseta', 'regata', 'manga longa', 'moletom', 'terno', 'cardigã'] as const;
export const PANTS_STYLES = ['calça', 'short', 'saia'] as const;
export const SHOE_STYLES = ['tênis', 'bota', 'sandália'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export type ShirtStyle = (typeof SHIRT_STYLES)[number];
export type PantsStyle = (typeof PANTS_STYLES)[number];
export type ShoeStyle = (typeof SHOE_STYLES)[number];

export const SKIN_COLORS = ['#f6d3b3', '#e8b48f', '#c98d63', '#9c6644', '#6e4630'];
export const HAIR_COLORS = ['#2b1d16', '#5a3825', '#a0622d', '#d9a94e', '#e06a4e', '#7d6aa8'];
export const CLOTH_COLORS = ['#f2ead8', '#e07a5f', '#f2cc8f', '#81b29a', '#3d8a8f', '#5b6ea8', '#9b6fae', '#3d405b', '#c4554d', '#7a5c45'];

export const DEFAULT_APPEARANCE: Appearance = {
  skin: SKIN_COLORS[1],
  hair: { style: 'curto', color: HAIR_COLORS[1] },
  shirt: { style: 'camiseta', color: CLOTH_COLORS[3] },
  pants: { style: 'calça', color: CLOTH_COLORS[7] },
  shoes: { style: 'tênis', color: CLOTH_COLORS[0] },
};

// Garante que um objeto vindo do banco vire uma aparência válida.
export function normalizeAppearance(raw: unknown): Appearance {
  const r = (raw ?? {}) as Partial<Appearance>;
  const pick = <T extends string>(v: unknown, list: readonly T[], fallback: T) => (list.includes(v as T) ? (v as T) : fallback);
  const color = (v: unknown, fallback: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback);
  const d = DEFAULT_APPEARANCE;
  return {
    skin: color(r.skin, d.skin),
    hair: { style: pick(r.hair?.style, HAIR_STYLES, d.hair.style), color: color(r.hair?.color, d.hair.color) },
    shirt: { style: pick(r.shirt?.style, SHIRT_STYLES, d.shirt.style), color: color(r.shirt?.color, d.shirt.color) },
    pants: { style: pick(r.pants?.style, PANTS_STYLES, d.pants.style), color: color(r.pants?.color, d.pants.color) },
    shoes: { style: pick(r.shoes?.style, SHOE_STYLES, d.shoes.style), color: color(r.shoes?.color, d.shoes.color) },
    ...Object.fromEntries(ACCESSORIES.filter((k) => r[k] === true).map((k) => [k, true])),
  };
}

// Aparência determinística a partir de um número (clientes).
export function appearanceFromSeed(seed: number): Appearance {
  let s = seed >>> 0 || 1;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
  const one = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)];
  return {
    skin: one(SKIN_COLORS),
    hair: { style: one(HAIR_STYLES), color: one(HAIR_COLORS) },
    shirt: { style: one(SHIRT_STYLES), color: one(CLOTH_COLORS) },
    pants: { style: one(PANTS_STYLES), color: one(CLOTH_COLORS) },
    shoes: { style: one(SHOE_STYLES), color: one(CLOTH_COLORS) },
  };
}

export function appearanceKey(a: Appearance): string {
  return [a.skin, a.hair.style, a.hair.color, a.shirt.style, a.shirt.color, a.pants.style, a.pants.color, a.shoes.style, a.shoes.color, ...ACCESSORIES.filter((k) => a[k])].join('|');
}

// ── Desenho ─────────────────────────────────────────────────────────────────

type Tone = 'base' | 'shade' | 'light' | 'dark';
type Paint = (x: number, y: number, tone?: Tone) => void;
type Rect = (x: number, y: number, w: number, h: number, tone?: Tone) => void;
type Pose = { dir: Direction; step: -1 | 0 | 1; bob: number };
type PartFn = (px: Paint, rect: Rect, pose: Pose) => void;

const side = (p: Pose) => p.dir === 'left' || p.dir === 'right';

// Pernas: deslocamento vertical de cada perna no passo.
const legLift = (p: Pose) => ({ l: p.step === 1 ? -1 : 0, r: p.step === -1 ? -1 : 0 });

// chifrinhos curvos acima da cabeça (mesmo desenho de frente, de costas e de lado)
const HORN_COLOR = '#b3393a';
const drawHorns: PartFn = (px, _rect, p) => {
  const b = p.bob;
  px(5, 2 + b);
  px(5, 1 + b, 'light');
  px(10, 2 + b);
  px(10, 1 + b, 'light');
};

// Detalhes com cor própria (olhos, óculos, gravata): pintados por cima, sem a tonalidade da camada.
type Fixed = (x: number, y: number, color: string) => void;
const EYE = '#2b1d1a';
function drawFace(fx: Fixed, p: Pose, skin: string) {
  const b = p.bob;
  const blush = toneColor(skin, 'shade');
  if (p.dir === 'down') {
    // olhos de 2 px de altura (mais expressivos que o ponto antigo)
    fx(6, 7 + b, EYE);
    fx(6, 8 + b, EYE);
    fx(9, 7 + b, EYE);
    fx(9, 8 + b, EYE);
    fx(5, 9 + b, blush);
    fx(10, 9 + b, blush);
  } else if (p.dir === 'left') {
    fx(5, 7 + b, EYE);
    fx(5, 8 + b, EYE);
    fx(6, 9 + b, blush);
  } else if (p.dir === 'right') {
    fx(10, 7 + b, EYE);
    fx(10, 8 + b, EYE);
    fx(9, 9 + b, blush);
  }
}

function drawGlasses(fx: Fixed, p: Pose) {
  const b = p.bob;
  const frame = '#3d2a22';
  const lens = '#a8d8ea';
  if (p.dir === 'down') {
    for (const x of [5, 8]) {
      fx(x, 7 + b, frame);
      fx(x + 1, 7 + b, lens);
      fx(x + 2, 7 + b, frame);
    }
    fx(5, 6 + b, frame);
    fx(10, 6 + b, frame);
  } else if (p.dir === 'left') {
    fx(4, 7 + b, frame);
    fx(5, 7 + b, lens);
    fx(6, 7 + b, frame);
    fx(7, 7 + b, frame);
  } else if (p.dir === 'right') {
    fx(11, 7 + b, frame);
    fx(10, 7 + b, lens);
    fx(9, 7 + b, frame);
    fx(8, 7 + b, frame);
  }
}

// boné: copa na cor da roupa e aba para a frente
const drawCap: PartFn = (_px, rect, p) => {
  const b = p.bob;
  rect(4, 1 + b, 8, 3);
  rect(4, 1 + b, 8, 1, 'light');
  if (p.dir === 'down') rect(4, 4 + b, 8, 1, 'shade');
  else if (p.dir === 'left') rect(2, 4 + b, 4, 1, 'shade');
  else if (p.dir === 'right') rect(10, 4 + b, 4, 1, 'shade');
};

// avental de barista (frente) com alça no pescoço
const APRON = '#3d405b';
const drawApron: PartFn = (_px, rect, p) => {
  const b = p.bob;
  if (p.dir === 'down') {
    rect(5, 12 + b, 6, 6);
    rect(6, 11 + b, 1, 1, 'light');
    rect(9, 11 + b, 1, 1, 'light');
    rect(6, 14 + b, 4, 1, 'light');
  } else if (side(p)) {
    rect(p.dir === 'left' ? 5 : 8, 12 + b, 3, 6);
  } else rect(4, 14 + b, 8, 1, 'shade');
};

const drawBody: PartFn = (px, rect, p) => {
  const b = p.bob;
  // cabeça
  rect(5, 3 + b, 6, 8);
  rect(4, 4 + b, 8, 6);
  rect(5, 10 + b, 6, 1, 'shade');
  if (p.dir === 'left') rect(3, 7 + b, 1, 2); // nariz de perfil
  // braços
  if (side(p)) {
    const swing = p.step * 1;
    rect(7 + swing, 12 + b, 2, 5);
  } else {
    rect(3, 12 + b, 1, 5);
    rect(12, 12 + b, 1, 5);
  }
  // pernas
  const { l, r } = legLift(p);
  if (side(p)) {
    rect(6, 18 + b + l, 2, 4);
    rect(8, 18 + b + r, 2, 4, 'shade');
  } else {
    rect(5, 18 + b + l, 2, 4);
    rect(9, 18 + b + r, 2, 4);
  }
};

const shirts: Record<ShirtStyle, PartFn> = {
  camiseta: (px, rect, p) => {
    const b = p.bob;
    torso(rect, p);
    if (side(p)) rect(7 + p.step, 12 + b, 2, 2);
    else {
      rect(3, 11 + b, 1, 3);
      rect(12, 11 + b, 1, 3);
    }
  },
  regata: (px, rect, p) => {
    torso(rect, p);
  },
  'manga longa': (px, rect, p) => {
    const b = p.bob;
    torso(rect, p);
    if (side(p)) rect(7 + p.step, 12 + b, 2, 5, 'shade');
    else {
      rect(3, 11 + b, 1, 6, 'shade');
      rect(12, 11 + b, 1, 6, 'shade');
    }
  },
  moletom: (px, rect, p) => {
    const b = p.bob;
    torso(rect, p);
    rect(side(p) ? 5 : 4, 17 + b, side(p) ? 6 : 8, 1, 'shade');
    if (side(p)) rect(7 + p.step, 12 + b, 2, 5, 'shade');
    else {
      rect(3, 11 + b, 1, 6, 'shade');
      rect(12, 11 + b, 1, 6, 'shade');
      if (p.dir === 'down') rect(6, 15 + b, 4, 2, 'shade');
    }
    if (p.dir === 'up') rect(5, 10 + b, 6, 2, 'shade'); // capuz nas costas
  },
  // terno: paletó na cor escolhida, camisa branca e gravata (pintadas em drawSuitFront)
  terno: (px, rect, p) => {
    const b = p.bob;
    torso(rect, p);
    rect(side(p) ? 5 : 4, 17 + b, side(p) ? 6 : 8, 1, 'dark');
    if (side(p)) rect(7 + p.step, 12 + b, 2, 5, 'shade');
    else {
      rect(3, 11 + b, 1, 6, 'shade');
      rect(12, 11 + b, 1, 6, 'shade');
    }
  },
  // cardigã: aberto na frente, com botões
  cardigã: (px, rect, p) => {
    const b = p.bob;
    torso(rect, p);
    if (side(p)) rect(7 + p.step, 12 + b, 2, 5, 'shade');
    else {
      rect(3, 11 + b, 1, 6, 'shade');
      rect(12, 11 + b, 1, 6, 'shade');
      if (p.dir === 'down') {
        rect(7, 11 + b, 2, 6, 'light');
        px(6, 13 + b, 'dark');
        px(6, 15 + b, 'dark');
      }
    }
  },
};

function drawSuitFront(fx: Fixed, p: Pose) {
  if (p.dir !== 'down') return;
  const b = p.bob;
  fx(7, 11 + b, '#fffaf0');
  fx(8, 11 + b, '#fffaf0');
  fx(7, 12 + b, '#fffaf0');
  fx(8, 12 + b, '#c4554d');
  fx(8, 13 + b, '#c4554d');
  fx(8, 14 + b, '#a8423b');
}

function torso(rect: Rect, p: Pose) {
  const b = p.bob;
  if (side(p)) {
    rect(5, 11 + b, 6, 7);
    rect(5, 16 + b, 6, 1, 'shade');
  } else {
    rect(4, 11 + b, 8, 7);
    rect(4, 11 + b, 8, 1, 'light');
    rect(4, 16 + b, 8, 1, 'shade');
  }
}

const pants: Record<PantsStyle, PartFn> = {
  calça: (px, rect, p) => legs(rect, p, 4),
  short: (px, rect, p) => legs(rect, p, 1),
  saia: (px, rect, p) => {
    const b = p.bob;
    if (side(p)) rect(5, 17 + b, 6, 3);
    else {
      rect(4, 17 + b, 8, 2);
      rect(3, 19 + b, 10, 1, 'shade');
    }
  },
};

function legs(rect: Rect, p: Pose, len: number) {
  const b = p.bob;
  const { l, r } = legLift(p);
  if (side(p)) {
    rect(5, 17 + b, 6, 1);
    rect(6, 18 + b + l, 2, len);
    rect(8, 18 + b + r, 2, len, 'shade');
  } else {
    rect(4, 17 + b, 8, 1);
    rect(5, 18 + b + l, 2, len);
    rect(9, 18 + b + r, 2, len);
  }
}

const shoes: Record<ShoeStyle, PartFn> = {
  tênis: (px, rect, p) => feet(rect, p, 2, true),
  bota: (px, rect, p) => feet(rect, p, 3, false),
  sandália: (px, rect, p) => feet(rect, p, 1, false),
};

function feet(rect: Rect, p: Pose, h: number, sole: boolean) {
  const { l, r } = legLift(p);
  const y = 24 - h;
  if (side(p)) {
    const toe = p.dir === 'left' ? -1 : 0;
    rect(6 + toe, y + l, 3, h);
    rect(8 + toe, y + r, 3, h, 'shade');
    if (sole) rect(6 + toe, 23 + l, 5, 1, 'light');
  } else {
    rect(5, y + l, 2, h);
    rect(9, y + r, 2, h);
    if (sole) {
      rect(5, 23 + l, 2, 1, 'light');
      rect(9, 23 + r, 2, 1, 'light');
    }
  }
}

const hairs: Record<HairStyle, PartFn> = {
  curto: (px, rect, p) => {
    const b = p.bob;
    rect(4, 2 + b, 8, 3);
    rect(4, 2 + b, 8, 1, 'light');
    if (p.dir === 'up') rect(4, 2 + b, 8, 7);
    else if (p.dir === 'left') rect(8, 5 + b, 4, 3);
    else if (p.dir === 'right') rect(4, 5 + b, 4, 3);
    else {
      px(4, 5 + b);
      px(11, 5 + b);
      px(5, 5 + b, 'shade');
    }
  },
  longo: (px, rect, p) => {
    const b = p.bob;
    rect(4, 2 + b, 8, 3);
    rect(4, 2 + b, 8, 1, 'light');
    if (p.dir === 'up') rect(3, 2 + b, 10, 12);
    else if (p.dir === 'left') rect(7, 4 + b, 5, 10);
    else if (p.dir === 'right') rect(4, 4 + b, 5, 10);
    else {
      rect(3, 4 + b, 2, 10, 'shade');
      rect(11, 4 + b, 2, 10, 'shade');
    }
  },
  coque: (px, rect, p) => {
    const b = p.bob;
    rect(4, 2 + b, 8, 3);
    rect(6, 0 + b, 4, 2, 'shade');
    if (p.dir === 'up') rect(4, 2 + b, 8, 7);
    else if (p.dir === 'left') rect(9, 5 + b, 3, 2);
    else if (p.dir === 'right') rect(4, 5 + b, 3, 2);
  },
  cacheado: (px, rect, p) => {
    const b = p.bob;
    rect(3, 1 + b, 10, 4);
    rect(4, 0 + b, 8, 1, 'light');
    for (let x = 3; x < 13; x += 2) px(x, 5 + b, 'shade');
    if (p.dir === 'up') rect(3, 1 + b, 10, 9);
    else if (p.dir === 'left') rect(8, 4 + b, 5, 6);
    else if (p.dir === 'right') rect(3, 4 + b, 5, 6);
    else {
      rect(2, 3 + b, 2, 6, 'shade');
      rect(12, 3 + b, 2, 6, 'shade');
    }
  },
  'rabo de cavalo': (px, rect, p) => {
    const b = p.bob;
    rect(4, 2 + b, 8, 3);
    rect(4, 2 + b, 8, 1, 'light');
    if (p.dir === 'up') {
      rect(4, 2 + b, 8, 7);
      rect(7, 9 + b, 2, 4, 'shade');
    } else if (p.dir === 'left') {
      rect(8, 4 + b, 4, 3);
      rect(12, 5 + b, 2, 5, 'shade');
    } else if (p.dir === 'right') {
      rect(4, 4 + b, 4, 3);
      rect(2, 5 + b, 2, 5, 'shade');
    } else {
      px(4, 5 + b);
      px(11, 5 + b);
    }
  },
  'black power': (px, rect, p) => {
    const b = p.bob;
    rect(2, 0 + b, 12, 5);
    rect(3, 0 + b, 10, 1, 'light');
    if (p.dir === 'up') rect(2, 0 + b, 12, 10);
    else if (p.dir === 'left') rect(8, 4 + b, 6, 5);
    else if (p.dir === 'right') rect(2, 4 + b, 6, 5);
    else {
      rect(2, 4 + b, 2, 5, 'shade');
      rect(12, 4 + b, 2, 5, 'shade');
    }
  },
  careca: () => {},
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toneColor(hex: string, tone: Tone): string {
  const [r, g, b] = hexToRgb(hex);
  const mix = (t: number, target: number) => (c: number) => Math.round(c + (target - c) * t);
  const f = tone === 'shade' ? mix(0.28, 20) : tone === 'dark' ? mix(0.75, 15) : tone === 'light' ? mix(0.25, 255) : (c: number) => c;
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

const OUTLINE = '#2b1d1a';

// Pinta um quadro (dir + passo) do personagem em `ctx` na posição (ox, oy).
export function drawCharacterFrame(ctx: CanvasRenderingContext2D, a: Appearance, dir: Direction, frame: number, ox = 0, oy = 0) {
  const step = ([0, 1, 0, -1] as const)[frame % WALK_FRAMES];
  const pose: Pose = { dir, step, bob: step === 0 ? 0 : 1 };
  const flip = dir === 'right';
  const drawPose: Pose = flip ? { ...pose, dir: 'left' } : pose;

  // grade intermediária para poder espelhar e contornar
  const grid: (string | null)[] = new Array(FRAME_W * FRAME_H).fill(null);
  const layer = (fn: PartFn, color: string) => {
    const px: Paint = (x, y, tone = 'base') => {
      if (x < 0 || y < 0 || x >= FRAME_W || y >= FRAME_H) return;
      const gx = flip ? FRAME_W - 1 - x : x;
      grid[y * FRAME_W + gx] = toneColor(color, tone);
    };
    const rect: Rect = (x, y, w, h, tone) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, tone);
    };
    fn(px, rect, drawPose);
  };

  layer(drawBody, a.skin);
  layer(shoes[a.shoes.style], a.shoes.color);
  layer(pants[a.pants.style], a.pants.color);
  layer(shirts[a.shirt.style], a.shirt.color);
  if (a.apron) layer(drawApron, APRON);
  layer(hairs[a.hair.style], a.hair.color);
  if (a.cap) layer(drawCap, a.shirt.color);
  if (a.horns) layer(drawHorns, HORN_COLOR);
  // rosto e detalhes de cor própria
  const fixed: Fixed = (x, y, color) => {
    if (x < 0 || y < 0 || x >= FRAME_W || y >= FRAME_H) return;
    grid[y * FRAME_W + (flip ? FRAME_W - 1 - x : x)] = color;
  };
  const hairCoversFace = drawPose.dir === 'up';
  if (!hairCoversFace) drawFace(fixed, drawPose, a.skin);
  if (a.glasses && !hairCoversFace) drawGlasses(fixed, drawPose);
  if (a.shirt.style === 'terno' && !a.apron) drawSuitFront(fixed, drawPose);

  // contorno escuro em volta da silhueta
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < FRAME_W && y < FRAME_H && grid[y * FRAME_W + x] !== null && grid[y * FRAME_W + x] !== OUTLINE;
  for (let y = 0; y < FRAME_H; y++)
    for (let x = 0; x < FRAME_W; x++) {
      if (grid[y * FRAME_W + x] !== null) continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) grid[y * FRAME_W + x] = OUTLINE;
    }

  for (let y = 0; y < FRAME_H; y++)
    for (let x = 0; x < FRAME_W; x++) {
      const c = grid[y * FRAME_W + x];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
}

// Spritesheet completa: linhas = direções (down, left, right, up), colunas = quadros de andar.
export function bakeCharacterSheet(a: Appearance): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * WALK_FRAMES;
  canvas.height = FRAME_H * DIRECTIONS.length;
  const ctx = canvas.getContext('2d')!;
  DIRECTIONS.forEach((dir, row) => {
    for (let f = 0; f < WALK_FRAMES; f++) drawCharacterFrame(ctx, a, dir, f, f * FRAME_W, row * FRAME_H);
  });
  return canvas;
}
