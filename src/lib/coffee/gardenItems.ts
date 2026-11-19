// Itens do jardim (decoração e cantinhos da Mucego Frutífero): onde podem ficar. Dados puros.
// O jardim é dos dois: qualquer um mexe no que está colocado; a mochila é de cada um.
import { THING_BY_ID, type GardenThing } from '@/content/coffee/gardenShop';
import { charAt, walkable, type GameMap, type Point } from './grid';
import { FROM_HOUSE_TO_GARDEN, GARDEN_DOOR, GARDEN_MAP, STAND } from './garden';

export type GardenItem = {
  id: string;
  owner_id: string;
  item_id: string;
  placed: boolean;
  x: number;
  y: number;
  flip: boolean;
  created_at: string;
};

const DIRS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export const thingTiles = (g: Pick<GardenThing, 'w' | 'h'>, x: number, y: number): Point[] => {
  const out: Point[] = [];
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) out.push({ x: x + i, y: y + j });
  return out;
};

// tiles bloqueados por itens que não dá para pisar
export function gardenBlocked(items: GardenItem[], skipId?: string): Set<number> {
  const out = new Set<number>();
  for (const it of items) {
    if (!it.placed || it.id === skipId) continue;
    const g = THING_BY_ID[it.item_id];
    if (!g || g.place !== 'floor') continue;
    for (const p of thingTiles(g, it.x, it.y)) out.add(p.y * GARDEN_MAP.w + p.x);
  }
  return out;
}

// encostado num canteiro, na barraquinha, no lago ou na porta (precisa ficar livre para usar)
function touchesUseful(p: Point): boolean {
  if (p.x === GARDEN_DOOR.x && p.y === GARDEN_DOOR.y) return true;
  if (p.x === FROM_HOUSE_TO_GARDEN.x && p.y === FROM_HOUSE_TO_GARDEN.y) return true;
  return DIRS.some((d) => {
    const n = { x: p.x + d.x, y: p.y + d.y };
    const ch = charAt(GARDEN_MAP, n.x, n.y);
    return ch === 'p' || ch === 'w' || ch === 'K' || STAND.some((s) => s.x === n.x && s.y === n.y);
  });
}

function allConnected(m: GameMap, blocked: Set<number>): boolean {
  const mm = { ...m, blocked };
  let total = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (walkable(mm, x, y)) total++;
  const start = FROM_HOUSE_TO_GARDEN;
  const seen = new Set<number>([start.y * m.w + start.x]);
  const queue = [start];
  while (queue.length) {
    const p = queue.pop()!;
    for (const d of DIRS) {
      const n = { x: p.x + d.x, y: p.y + d.y };
      if (n.x < 0 || n.y < 0 || n.x >= m.w || n.y >= m.h) continue;
      const k = n.y * m.w + n.x;
      if (!seen.has(k) && walkable(mm, n.x, n.y)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  return seen.size === total;
}

export type GardenPlaceCheck = { ok: true } | { ok: false; reason: string };

export function canPlaceGarden(opts: { g: GardenThing; x: number; y: number; items: GardenItem[]; movingId?: string }): GardenPlaceCheck {
  const { g, x, y, items, movingId } = opts;
  const tiles = thingTiles(g, x, y);
  for (const p of tiles) {
    const ch = charAt(GARDEN_MAP, p.x, p.y);
    const okGround = ch === 'G' || (g.place === 'flat' && ch === 'P');
    if (!okGround) return { ok: false, reason: 'Só dá para colocar na grama' };
    if (g.place === 'floor' && touchesUseful(p)) return { ok: false, reason: 'Deixe livre perto dos canteiros, do lago e da porta' };
    if (p.x === GARDEN_DOOR.x && p.y === GARDEN_DOOR.y) return { ok: false, reason: 'Essa é a porta' };
  }
  const mine = new Set(tiles.map((p) => `${p.x},${p.y}`));
  for (const it of items) {
    if (!it.placed || it.id === movingId) continue;
    const o = THING_BY_ID[it.item_id];
    if (!o || o.place !== g.place) continue;
    if (thingTiles(o, it.x, it.y).some((p) => mine.has(`${p.x},${p.y}`))) return { ok: false, reason: 'Já tem algo aqui' };
  }
  if (g.place === 'floor') {
    const blocked = gardenBlocked(items, movingId);
    for (const p of tiles) blocked.add(p.y * GARDEN_MAP.w + p.x);
    if (!allConnected(GARDEN_MAP, blocked)) return { ok: false, reason: 'Isso fecharia a passagem' };
  }
  return { ok: true };
}

// item colocado no tile (x, y): primeiro os que bloqueiam, depois os do chão
export function gardenItemAt(items: GardenItem[], x: number, y: number): GardenItem | null {
  const hits = items.filter((it) => {
    const g = THING_BY_ID[it.item_id];
    return it.placed && !!g && thingTiles(g, it.x, it.y).some((p) => p.x === x && p.y === y);
  });
  hits.sort((a, b) => (THING_BY_ID[a.item_id].place === 'floor' ? 0 : 1) - (THING_BY_ID[b.item_id].place === 'floor' ? 0 : 1));
  return hits[0] ?? null;
}

export function firstFreeGardenSpot(g: GardenThing, near: Point, items: GardenItem[], movingId?: string): Point | null {
  let best: { p: Point; d: number } | null = null;
  for (let y = 0; y < GARDEN_MAP.h; y++)
    for (let x = 0; x < GARDEN_MAP.w; x++) {
      const d = Math.abs(x - near.x) + Math.abs(y - near.y);
      if (best && d >= best.d) continue;
      if (canPlaceGarden({ g, x, y, items, movingId }).ok) best = { p: { x, y }, d };
    }
  return best?.p ?? null;
}
