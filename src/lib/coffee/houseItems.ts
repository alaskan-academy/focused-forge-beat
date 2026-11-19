// Móveis da casa: onde cada um pode ficar. Dados puros (sem Phaser), usados pelo jogo, pela UI e
// pelos testes. O banco confere de novo o essencial (dono, quarto de quem, limites do cômodo).
import { FURNITURE_BY_ID, type Furniture } from '@/content/coffee/furniture';
import { charAt, walkable, type GameMap, type Point } from './grid';
import { BEDROOM_DOORS, CAFE_DOOR, FROM_CAFE, FROM_GARDEN, GARDEN_EXIT, HOUSE_MAP, HOUSE_WINDOWS_X, ROOMS, SLEEP_SPOT, WAKE_UP, type Room, type RoomId } from './house';

// Um móvel comprado: na mochila (room null) ou colocado num cômodo (x, y = canto de cima à esquerda).
export type HouseItem = {
  id: string;
  owner_id: string;
  item_id: string;
  variant: number;
  room: RoomId | null;
  x: number;
  y: number;
  flip: boolean;
  created_at: string;
};

export const SHARED_ROOMS: RoomId[] = ['living', 'kitchen'];
const FLOOR_CHARS = new Set(['.', ',', '_']);

export const footprint = (f: Pick<Furniture, 'w' | 'h'>, x: number, y: number): Point[] => {
  const out: Point[] = [];
  for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) out.push({ x: x + i, y: y + j });
  return out;
};

const key = (p: Point) => `${p.x},${p.y}`;

// Tiles que precisam ficar livres: portas, a frente delas e onde cada um acorda/dorme/chega.
const KEEP_FREE = new Set(
  [
    ...WAKE_UP,
    ...SLEEP_SPOT,
    FROM_CAFE,
    CAFE_DOOR,
    FROM_GARDEN,
    GARDEN_EXIT,
    ...BEDROOM_DOORS.flatMap((d) => [d, { x: d.x, y: d.y - 1 }, { x: d.x, y: d.y + 1 }]),
    // passagem sala ↔ cozinha
    { x: 13, y: 12 },
    { x: 15, y: 12 },
  ].map(key),
);

// Quem pode mexer em cada cômodo: o quarto N é de members[N]; sala e cozinha são dos dois.
export function canEditRoom(room: RoomId, members: string[], me: string): boolean {
  if (SHARED_ROOMS.includes(room)) return true;
  const idx = room === 'bedroom0' ? 0 : 1;
  const owner = members[idx];
  return owner ? owner === me : idx === Math.max(0, members.indexOf(me));
}

// Posso mexer neste móvel colocado? (o meu em qualquer lugar que eu possa editar; o da outra
// pessoa só se estiver na sala ou na cozinha)
export function canTouchItem(it: HouseItem, members: string[], me: string): boolean {
  if (!it.room) return it.owner_id === me;
  if (!canEditRoom(it.room, members, me)) return false;
  return it.owner_id === me || SHARED_ROOMS.includes(it.room);
}

// cômodo em que um móvel ficaria (parede: o cômodo logo abaixo da parede)
export function roomFor(f: Pick<Furniture, 'place'>, x: number, y: number): Room | null {
  if (f.place === 'wall') return ROOMS.find((r) => y === r.y0 - 1 && x >= r.x0 && x <= r.x1) ?? null;
  return ROOMS.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) ?? null;
}

const layerOf = (f: Pick<Furniture, 'place'>) => f.place;

// Tiles ocupados por móveis que bloqueiam a passagem.
export function blockedTiles(items: HouseItem[], skipId?: string): Set<number> {
  const out = new Set<number>();
  for (const it of items) {
    if (!it.room || it.id === skipId) continue;
    const f = FURNITURE_BY_ID[it.item_id];
    if (!f || f.place !== 'floor') continue;
    for (const p of footprint(f, it.x, it.y)) out.add(p.y * HOUSE_MAP.w + p.x);
  }
  return out;
}

// Todos os tiles andáveis continuam alcançáveis a partir da porta? (nada fica preso num canto)
function allConnected(m: GameMap, blocked: Set<number>): boolean {
  const free = (x: number, y: number) => walkable({ ...m, blocked }, x, y);
  let total = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (free(x, y)) total++;
  const seen = new Set<number>([FROM_CAFE.y * m.w + FROM_CAFE.x]);
  const queue = [FROM_CAFE];
  while (queue.length) {
    const p = queue.pop()!;
    for (const d of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const n = { x: p.x + d.x, y: p.y + d.y };
      const k = n.y * m.w + n.x;
      if (!seen.has(k) && free(n.x, n.y)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  return seen.size === total;
}

export type PlaceCheck = { ok: true; room: RoomId } | { ok: false; reason: string };

// Dá para colocar o móvel `f` em (x, y)? `movingId`: o móvel que está sendo movido (ignora ele mesmo).
export function canPlace(opts: { f: Furniture; x: number; y: number; items: HouseItem[]; members: string[]; me: string; movingId?: string }): PlaceCheck {
  const { f, x, y, items, members, me, movingId } = opts;
  const room = roomFor(f, x, y);
  if (!room) return { ok: false, reason: f.place === 'wall' ? 'Esse vai na parede do fundo de um cômodo' : 'Fora dos cômodos' };
  if (!canEditRoom(room.id, members, me)) return { ok: false, reason: 'Esse é o quarto da outra pessoa' };
  const tiles = footprint(f, x, y);

  for (const p of tiles) {
    if (f.place === 'wall') {
      if (p.x < room.x0 || p.x > room.x1 || charAt(HOUSE_MAP, p.x, p.y) !== 'W') return { ok: false, reason: 'Não cabe nessa parede' };
      if (p.y === 1 && HOUSE_WINDOWS_X.includes(p.x)) return { ok: false, reason: 'Aí tem uma janela' };
    } else {
      if (p.x < room.x0 || p.x > room.x1 || p.y < room.y0 || p.y > room.y1) return { ok: false, reason: 'Não cabe aqui' };
      if (!FLOOR_CHARS.has(charAt(HOUSE_MAP, p.x, p.y))) return { ok: false, reason: 'Já tem um móvel aqui' };
      if (f.place === 'floor' && KEEP_FREE.has(key(p))) return { ok: false, reason: 'Deixe a passagem livre' };
    }
  }

  // não pode sobrepor outro móvel da mesma camada (tapete embaixo de mesa pode)
  const mine = new Set(tiles.map(key));
  for (const it of items) {
    if (!it.room || it.id === movingId) continue;
    const g = FURNITURE_BY_ID[it.item_id];
    if (!g || layerOf(g) !== layerOf(f)) continue;
    if (footprint(g, it.x, it.y).some((p) => mine.has(key(p)))) return { ok: false, reason: 'Já tem um móvel aqui' };
  }

  if (f.place === 'floor') {
    const blocked = blockedTiles(items, movingId);
    for (const p of tiles) blocked.add(p.y * HOUSE_MAP.w + p.x);
    if (!allConnected(HOUSE_MAP, blocked)) return { ok: false, reason: 'Isso fecharia a passagem' };
  }
  return { ok: true, room: room.id };
}

// móvel colocado que ocupa o tile (x, y): primeiro móveis de chão, depois parede, depois tapete
export function itemAt(items: HouseItem[], x: number, y: number): HouseItem | null {
  const order = { floor: 0, wall: 1, rug: 2 } as const;
  const hits = items.filter((it) => {
    const f = FURNITURE_BY_ID[it.item_id];
    return !!it.room && !!f && footprint(f, it.x, it.y).some((p) => p.x === x && p.y === y);
  });
  hits.sort((a, b) => order[FURNITURE_BY_ID[a.item_id].place] - order[FURNITURE_BY_ID[b.item_id].place]);
  return hits[0] ?? null;
}

// Primeiro lugar livre perto de (x, y) para começar a colocar (só para a prévia aparecer num bom lugar).
export function firstFreeSpot(f: Furniture, near: Point, opts: { items: HouseItem[]; members: string[]; me: string; movingId?: string }): Point | null {
  let best: { p: Point; d: number } | null = null;
  for (let y = 0; y < HOUSE_MAP.h; y++)
    for (let x = 0; x < HOUSE_MAP.w; x++) {
      const d = Math.abs(x - near.x) + Math.abs(y - near.y);
      if (best && d >= best.d) continue;
      if (canPlace({ f, x, y, ...opts }).ok) best = { p: { x, y }, d };
    }
  return best?.p ?? null;
}
