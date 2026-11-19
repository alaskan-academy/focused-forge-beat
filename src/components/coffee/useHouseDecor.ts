import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FURNITURE_BY_ID } from '@/content/coffee/furniture';
import { canPlace, canTouchItem, firstFreeSpot, itemAt, type HouseItem, type PlaceCheck } from '@/lib/coffee/houseItems';
import { ROOMS, type RoomId } from '@/lib/coffee/house';
import type { DecorView, SceneHouseItem } from '@/game/bridge';

type Placing = { id: string; item_id: string; variant: number; flip: boolean; x: number; y: number };

type Opts = {
  items: HouseItem[];
  members: string[];
  me: string;
  myRoom: number;
  place: (id: string, room: RoomId, x: number, y: number, flip: boolean) => Promise<void>;
  store: (id: string) => Promise<void>;
};

// Modo decorar: escolher um móvel da mochila (ou um já colocado), ver a prévia no mapa e confirmar.
export function useHouseDecor({ items, members, me, myRoom, place, store }: Opts) {
  const [active, setActive] = useState(false);
  const [placing, setPlacing] = useState<Placing | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const placed = useMemo(() => items.filter((i) => i.room), [items]);
  const bag = useMemo(() => items.filter((i) => !i.room && i.owner_id === me), [items, me]);
  const selectedItem = placed.find((i) => i.id === selected) ?? null;

  const check: PlaceCheck | null = useMemo(() => {
    if (!placing) return null;
    const f = FURNITURE_BY_ID[placing.item_id];
    if (!f) return null;
    return canPlace({ f, x: placing.x, y: placing.y, items: placed, members, me, movingId: placing.id });
  }, [placing, placed, members, me]);

  const sceneItems = useMemo<SceneHouseItem[]>(
    () => placed.map((i) => ({ id: i.id, item_id: i.item_id, variant: i.variant, x: i.x, y: i.y, flip: i.flip, editable: canTouchItem(i, members, me) })),
    [placed, members, me],
  );

  const view = useMemo<DecorView | null>(
    () =>
      active
        ? {
            ghost: placing ? { item_id: placing.item_id, variant: placing.variant, flip: placing.flip, x: placing.x, y: placing.y, ok: !!check?.ok } : null,
            selected,
          }
        : null,
    [active, placing, selected, check],
  );

  const open = useCallback(() => {
    setActive(true);
    setPlacing(null);
    setSelected(null);
  }, []);

  const close = useCallback(() => {
    setActive(false);
    setPlacing(null);
    setSelected(null);
  }, []);

  // começa a colocar um móvel da mochila, num lugar livre perto do meu quarto
  const startPlacing = useCallback(
    (it: HouseItem) => {
      const f = FURNITURE_BY_ID[it.item_id];
      if (!f) return;
      const room = ROOMS[myRoom] ?? ROOMS[0];
      const near = { x: Math.round((room.x0 + room.x1) / 2), y: Math.round((room.y0 + room.y1) / 2) };
      const spot = firstFreeSpot(f, near, { items: placed, members, me }) ?? near;
      setActive(true);
      setSelected(null);
      setPlacing({ id: it.id, item_id: it.item_id, variant: it.variant, flip: false, ...spot });
    },
    [myRoom, placed, members, me],
  );

  const onTap = useCallback(
    (p: { x: number; y: number }) => {
      if (placing) {
        setPlacing({ ...placing, x: p.x, y: p.y });
        return;
      }
      const hit = itemAt(placed, p.x, p.y);
      if (hit && canTouchItem(hit, members, me)) setSelected(hit.id);
      else {
        setSelected(null);
        if (hit) toast('Esse móvel está no quarto da outra pessoa 🙂');
      }
    },
    [placing, placed, members, me],
  );

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      return true;
    } catch (e) {
      toast(`Não deu certo: ${e instanceof Error ? e.message : 'erro'}`);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const confirm = useCallback(async () => {
    if (!placing || !check?.ok) return;
    if (await run(() => place(placing.id, check.room, placing.x, placing.y, placing.flip))) {
      setPlacing(null);
      setSelected(null);
    }
  }, [placing, check, place]);

  const rotate = useCallback(async () => {
    if (placing) setPlacing({ ...placing, flip: !placing.flip });
    else if (selectedItem?.room) await run(() => place(selectedItem.id, selectedItem.room!, selectedItem.x, selectedItem.y, !selectedItem.flip));
  }, [placing, selectedItem, place]);

  const moveSelected = useCallback(() => {
    if (!selectedItem) return;
    setPlacing({ id: selectedItem.id, item_id: selectedItem.item_id, variant: selectedItem.variant, flip: selectedItem.flip, x: selectedItem.x, y: selectedItem.y });
  }, [selectedItem]);

  const storeSelected = useCallback(async () => {
    if (!selectedItem) return;
    if (await run(() => store(selectedItem.id))) setSelected(null);
  }, [selectedItem, store]);

  const cancel = useCallback(() => {
    setPlacing(null);
    setSelected(null);
  }, []);

  return { active, view, sceneItems, bag, placing, selectedItem, check, busy, open, close, startPlacing, onTap, confirm, rotate, moveSelected, storeSelected, cancel };
}

export type HouseDecor = ReturnType<typeof useHouseDecor>;
