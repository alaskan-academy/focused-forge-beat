import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GARDEN_THINGS, THING_BY_ID } from '@/content/coffee/gardenShop';
import { CROP_BY_ID } from './garden';
import { canPlaceGarden, gardenItemAt, type GardenItem } from './gardenItems';
import { WANTS, friendLevel, wantFor } from './mucego';
import { LocalStore } from './store/localStore';
import { hasDrawing } from '@/game/art/gardenArt';

const SQL = readFileSync('supabase/migrations/20261114000000_coffee_mucego.sql', 'utf8');
const item = (p: Partial<GardenItem> & Pick<GardenItem, 'item_id' | 'x' | 'y'>): GardenItem => ({ id: Math.random().toString(36), owner_id: 'a', placed: true, flip: false, created_at: '', ...p });

describe('lojinha do jardim', () => {
  it('muitas coisinhas, ids únicos, igual ao banco', () => {
    expect(GARDEN_THINGS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(GARDEN_THINGS.map((g) => g.id)).size).toBe(GARDEN_THINGS.length);
    const rows = [...SQL.matchAll(/\('([a-z_]+)', '(accessory|treat|toy|decor)', (\d+), (\d+), '(floor|flat)', (\d+), (\d+), (\d+)\)/g)];
    expect(rows.length).toBe(GARDEN_THINGS.length);
    for (const [, id, kind, price, lvl, place, w, h, fr] of rows) {
      const g = THING_BY_ID[id];
      expect([g.kind, g.price, g.minLevel, g.place, g.w, g.h, g.friendship ?? 0]).toEqual([kind, +price, +lvl, place, +w, +h, +fr]);
    }
  });

  it('tudo que vai para o jardim tem desenho', () => {
    for (const g of GARDEN_THINGS) if (g.kind === 'toy' || g.kind === 'decor') expect(hasDrawing(g.id), g.id).toBe(true);
  });
});

describe('Mucego Frutífero', () => {
  it('níveis de amizade', () => {
    expect(friendLevel(0)).toBe(0);
    expect(friendLevel(30)).toBe(2);
    expect(friendLevel(120)).toBe(4);
  });

  it('pedido do dia: mesma lista do banco e comidas que existem', () => {
    const arrays = [...SQL.matchAll(/ARRAY\[('[^\]]*')\]/g)].map((m) => m[1].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean));
    expect(arrays.slice(0, WANTS.length)).toEqual(WANTS.map((w) => w.accepts));
    for (const w of WANTS) for (const c of w.accepts) expect(CROP_BY_ID[c], c).toBeTruthy();
    expect(wantFor('2026-11-18')).toBe(wantFor('2026-11-18'));
    expect(new Set(['2026-11-18', '2026-11-19', '2026-11-20'].map((d) => wantFor(d).id)).size).toBe(3);
  });
});

describe('decorar o jardim', () => {
  const bench = THING_BY_ID.garden_bench;
  const flowers = THING_BY_ID.red_flowers;
  it('na grama sim; perto de canteiro, lago e porta não', () => {
    expect(canPlaceGarden({ g: bench, x: 9, y: 13, items: [] }).ok).toBe(true);
    expect(canPlaceGarden({ g: bench, x: 4, y: 5, items: [] }).ok).toBe(false); // entre os canteiros
    expect(canPlaceGarden({ g: bench, x: 13, y: 10, items: [] }).ok).toBe(false); // beira do lago
    expect(canPlaceGarden({ g: bench, x: 0, y: 12, items: [] }).ok).toBe(false); // porta
    expect(canPlaceGarden({ g: flowers, x: 2, y: 12, items: [] }).ok).toBe(true); // flores podem ir no caminho
  });

  it('não sobrepõe e acha o item tocado', () => {
    const b = item({ item_id: 'garden_bench', x: 9, y: 13 });
    expect(canPlaceGarden({ g: bench, x: 10, y: 13, items: [b] }).ok).toBe(false);
    expect(canPlaceGarden({ g: flowers, x: 10, y: 13, items: [b] }).ok).toBe(true);
    expect(gardenItemAt([b], 10, 13)?.id).toBe(b.id);
  });
});

describe('Mucego na store local', () => {
  it('tapinha 1x por hora, comida, pedido do dia, compra e vestir', async () => {
    localStorage.clear();
    const s = new LocalStore();
    s.addCoins(500);
    s.giveProduce();
    expect((await s.mucegoPet()).ok).toBe(true);
    expect((await s.mucegoPet()).ok).toBe(false);
    s.advanceHours(2);
    expect((await s.mucegoPet()).ok).toBe(true);
    const r = await s.mucegoFeed('strawberry');
    expect(r.gain).toBeGreaterThanOrEqual(3);
    await s.gardenBuy('red_bow');
    await expect(s.gardenBuy('red_bow')).rejects.toThrow('owned');
    await s.mucegoWear('red_bow');
    await s.gardenBuy('dried_fish');
    expect((await s.mucegoTreat('dried_fish')).gain).toBe(2);
    await s.gardenBuy('yarn_ball');
    const snap = await s.load();
    expect(snap.mucego.accessory).toBe('red_bow');
    const yarn = snap.gardenItems.find((g) => g.item_id === 'yarn_ball')!;
    expect(yarn.placed).toBe(false);
    await s.gardenItemPlace(yarn.id, 9, 13, false);
    expect((await s.load()).gardenItems.find((g) => g.id === yarn.id)?.placed).toBe(true);
  });
});
