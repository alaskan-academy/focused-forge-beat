import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { THING_BY_ID } from '@/content/coffee/gardenShop';
import { canPlaceGarden, firstFreeGardenSpot, gardenItemAt, type GardenItem, type GardenPlaceCheck } from '@/lib/coffee/gardenItems';
import type { GardenDecorView, SceneGardenItem } from '@/game/bridge';

type Placing = { id: string; item_id: string; flip: boolean; x: number; y: number };

// Modo decorar o jardim (dos dois): escolher da mochila ou tocar num item colocado, ver a prévia e confirmar.
export function useGardenDecor({ items, me, place, store }: { items: GardenItem[]; me: string; place: (id: string, x: number, y: number, flip: boolean) => Promise<void>; store: (id: string) => Promise<void> }) {
  const [active, setActive] = useState(false);
  const [placing, setPlacing] = useState<Placing | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const placed = useMemo(() => items.filter((i) => i.placed), [items]);
  const bag = useMemo(() => items.filter((i) => !i.placed && i.owner_id === me), [items, me]);
  const selectedItem = placed.find((i) => i.id === selected) ?? null;

  const check: GardenPlaceCheck | null = useMemo(() => {
    if (!placing) return null;
    const g = THING_BY_ID[placing.item_id];
    return g ? canPlaceGarden({ g, x: placing.x, y: placing.y, items: placed, movingId: placing.id }) : null;
  }, [placing, placed]);

  const sceneItems = useMemo<SceneGardenItem[]>(() => placed.map((i) => ({ id: i.id, item_id: i.item_id, x: i.x, y: i.y, flip: i.flip })), [placed]);
  const view = useMemo<GardenDecorView | null>(
    () => (active ? { ghost: placing ? { item_id: placing.item_id, flip: placing.flip, x: placing.x, y: placing.y, ok: !!check?.ok } : null, selected } : null),
    [active, placing, selected, check],
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

  const startPlacing = useCallback(
    (it: GardenItem) => {
      const g = THING_BY_ID[it.item_id];
      if (!g) return;
      const spot = firstFreeGardenSpot(g, { x: 11, y: 10 }, placed) ?? { x: 11, y: 10 };
      setActive(true);
      setSelected(null);
      setPlacing({ id: it.id, item_id: it.item_id, flip: false, ...spot });
    },
    [placed],
  );

  const onTap = useCallback(
    (p: { x: number; y: number }) => {
      if (placing) return setPlacing({ ...placing, x: p.x, y: p.y });
      const hit = gardenItemAt(placed, p.x, p.y);
      setSelected(hit?.id ?? null);
    },
    [placing, placed],
  );

  const confirm = useCallback(async () => {
    if (!placing || !check?.ok) return;
    if (await run(() => place(placing.id, placing.x, placing.y, placing.flip))) {
      setPlacing(null);
      setSelected(null);
    }
  }, [placing, check, place]);

  const rotate = useCallback(async () => {
    if (placing) setPlacing({ ...placing, flip: !placing.flip });
    else if (selectedItem) await run(() => place(selectedItem.id, selectedItem.x, selectedItem.y, !selectedItem.flip));
  }, [placing, selectedItem, place]);

  const moveSelected = useCallback(() => {
    if (selectedItem) setPlacing({ id: selectedItem.id, item_id: selectedItem.item_id, flip: selectedItem.flip, x: selectedItem.x, y: selectedItem.y });
  }, [selectedItem]);

  const storeSelected = useCallback(async () => {
    if (selectedItem && (await run(() => store(selectedItem.id)))) setSelected(null);
  }, [selectedItem, store]);

  const cancel = useCallback(() => {
    setPlacing(null);
    setSelected(null);
  }, []);

  return { active, view, sceneItems, bag, placing, selectedItem, check, busy, open, close, startPlacing, onTap, confirm, rotate, moveSelected, storeSelected, cancel };
}

export type GardenDecor = ReturnType<typeof useGardenDecor>;
