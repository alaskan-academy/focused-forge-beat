// Balões sobre os clientes, desenhados em código (placeholder).

type R = (x: number, y: number, w: number, h: number, c: string) => void;

const OUT = '#2b1d1a';

function bubble(r: R, fill = '#fffaf0') {
  r(1, 0, 12, 1, OUT);
  r(0, 1, 1, 9, OUT);
  r(13, 1, 1, 9, OUT);
  r(1, 10, 12, 1, OUT);
  r(1, 1, 12, 9, fill);
  r(5, 11, 3, 1, OUT);
  r(6, 12, 1, 1, OUT);
  r(6, 10, 2, 1, fill);
}

export const ICONS: Record<string, (r: R) => void> = {
  // xícara: quer ser atendido
  coffee: (r) => {
    bubble(r);
    r(4, 4, 5, 4, '#e07a5f');
    r(4, 4, 5, 1, '#7d4f33');
    r(9, 5, 1, 2, '#e07a5f');
    r(5, 2, 1, 1, '#b8b0a0');
    r(7, 2, 1, 1, '#b8b0a0');
  },
  // livro aberto: capítulo novo da história
  book: (r) => {
    bubble(r, '#fff3c4');
    r(2, 3, 5, 5, '#5b6ea8');
    r(7, 3, 5, 5, '#5b6ea8');
    r(3, 4, 3, 3, '#fffaf0');
    r(8, 4, 3, 3, '#fffaf0');
    r(6, 3, 2, 6, '#3d405b');
    r(3, 5, 2, 1, '#b8b0a0');
    r(9, 5, 2, 1, '#b8b0a0');
  },
  // balãozinho de fala: quer conversar
  talk: (r) => {
    bubble(r);
    r(3, 3, 8, 4, '#81b29a');
    r(4, 7, 2, 1, '#81b29a');
    r(4, 4, 1, 1, '#fffaf0');
    r(6, 4, 1, 1, '#fffaf0');
    r(8, 4, 1, 1, '#fffaf0');
  },
  // reticências: alguém está atendendo
  busy: (r) => {
    bubble(r, '#efe6d6');
    r(3, 5, 2, 2, '#8e8577');
    r(6, 5, 2, 2, '#8e8577');
    r(9, 5, 2, 2, '#8e8577');
  },
  // exclamação: cliente com pressa/difícil (Fase 2)
  alert: (r) => {
    bubble(r, '#ffe9a8');
    r(6, 2, 2, 5, '#c4554d');
    r(6, 8, 2, 1, '#c4554d');
  },
  // conta: o Belmont veio cobrar o aluguel
  bill: (r) => {
    bubble(r, '#f6d5cb');
    r(4, 2, 6, 7, '#fffaf0');
    r(4, 2, 6, 1, '#c4554d');
    r(5, 4, 4, 1, '#8e8577');
    r(5, 6, 3, 1, '#8e8577');
    r(8, 7, 1, 1, '#c4554d');
  },
  // tecla E
  keyE: (r) => {
    r(0, 0, 11, 11, OUT);
    r(1, 1, 9, 8, '#fffaf0');
    r(1, 9, 9, 1, '#cfc4b0');
    r(3, 2, 5, 1, OUT);
    r(3, 3, 1, 4, OUT);
    r(3, 4, 4, 1, OUT);
    r(3, 7, 5, 1, OUT);
  },
  // coração (feedback de atendimento)
  heart: (r) => {
    r(1, 0, 2, 1, '#e05a6e');
    r(5, 0, 2, 1, '#e05a6e');
    r(0, 1, 8, 2, '#e05a6e');
    r(1, 3, 6, 1, '#e05a6e');
    r(2, 4, 4, 1, '#e05a6e');
    r(3, 5, 2, 1, '#e05a6e');
    r(1, 1, 1, 1, '#f7a8b4');
  },
};

export const ICON_SIZE: Record<string, [number, number]> = {
  coffee: [14, 13],
  book: [14, 13],
  talk: [14, 13],
  busy: [14, 13],
  alert: [14, 13],
  bill: [14, 13],
  keyE: [11, 11],
  heart: [8, 6],
};

export function buildIconCanvas(name: string): HTMLCanvasElement {
  const [w, h] = ICON_SIZE[name];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ICONS[name]((x, y, rw, rh, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, rw, rh);
  });
  return canvas;
}
