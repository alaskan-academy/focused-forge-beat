// Mapa em grade genérico (café, casa…): letras por tile, quais letras são sólidas e, opcionalmente,
// tiles bloqueados por móveis colocados pelos jogadores. Caminho mais curto por BFS.

export type Point = { x: number; y: number };

export type GameMap = {
  rows: readonly string[];
  w: number;
  h: number;
  solid: ReadonlySet<string>;
  // tiles ocupados por móveis (índice y * w + x), além das letras sólidas
  blocked: Set<number>;
};

export function makeMap(rows: readonly string[], solid: Iterable<string>): GameMap {
  return { rows, w: rows[0].length, h: rows.length, solid: new Set(solid), blocked: new Set() };
}

export function charAt(m: GameMap, x: number, y: number): string {
  if (y < 0 || y >= m.h || x < 0 || x >= m.w) return 'W';
  return m.rows[y][x];
}

export function walkable(m: GameMap, x: number, y: number): boolean {
  return !m.solid.has(charAt(m, x, y)) && !m.blocked.has(y * m.w + x);
}

const DIRS: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

// Caminho mais curto em grade (BFS, 4 direções). Se o destino não for andável, vai até o
// vizinho andável mais próximo dele. Retorna os tiles depois do início, ou [] se não houver.
export function pathIn(m: GameMap, from: Point, to: Point, blocked: (x: number, y: number) => boolean = (x, y) => !walkable(m, x, y)): Point[] {
  const goals = goalTiles(to, blocked);
  if (goals.length === 0) return [];
  const goalSet = new Set(goals.map((g) => g.y * m.w + g.x));
  const start = from.y * m.w + from.x;
  if (goalSet.has(start)) return [];

  const prev = new Map<number, number>([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    if (goalSet.has(cur)) {
      const path: Point[] = [];
      for (let n = cur; n !== start; n = prev.get(n)!) path.push({ x: n % m.w, y: Math.floor(n / m.w) });
      return path.reverse();
    }
    const cx = cur % m.w;
    const cy = Math.floor(cur / m.w);
    for (const d of DIRS) {
      const nx = cx + d.x;
      const ny = cy + d.y;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const key = ny * m.w + nx;
      if (prev.has(key) || blocked(nx, ny)) continue;
      prev.set(key, cur);
      queue.push(key);
    }
  }
  return [];
}

// Tiles de chegada: o próprio destino se for andável, senão os vizinhos andáveis dele.
function goalTiles(to: Point, blocked: (x: number, y: number) => boolean): Point[] {
  if (!blocked(to.x, to.y)) return [to];
  return DIRS.map((d) => ({ x: to.x + d.x, y: to.y + d.y })).filter((p) => !blocked(p.x, p.y));
}

export const neighbors = (p: Point): Point[] => DIRS.map((d) => ({ x: p.x + d.x, y: p.y + d.y }));
