// Decoração interativa desenhada em código (placeholder): quadro-negro do chunk do dia.

type R = (x: number, y: number, w: number, h: number, c: string) => void;

function canvas(w: number, h: number, draw: (r: R) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw((x, y, rw, rh, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, rw, rh);
  });
  return c;
}

// 22×15: moldura de madeira, quadro verde, "rabiscos" de giz e uma xícara desenhada
export function buildChalkboard(): HTMLCanvasElement {
  return canvas(22, 15, (r) => {
    r(0, 0, 22, 14, '#7d4f33');
    r(1, 1, 20, 12, '#2f4a3a');
    r(2, 2, 18, 10, '#355a45');
    r(3, 3, 9, 1, '#e8efe6');
    r(3, 5, 12, 1, '#c9d6c6');
    r(3, 7, 7, 1, '#c9d6c6');
    r(14, 7, 4, 3, '#e8efe6');
    r(18, 8, 1, 1, '#e8efe6');
    r(15, 6, 1, 1, '#c9d6c6');
    r(17, 5, 1, 1, '#c9d6c6');
    r(1, 13, 20, 1, '#5e3a24');
    r(4, 14, 3, 1, '#f2ead8');
  });
}
