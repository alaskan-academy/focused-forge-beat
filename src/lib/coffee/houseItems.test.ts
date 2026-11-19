import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FURNITURE, FURNITURE_BY_ID, TIER_INFO } from '@/content/coffee/furniture';
import { canEditRoom, canPlace, canTouchItem, firstFreeSpot, itemAt, type HouseItem } from './houseItems';
import { LocalStore } from './store/localStore';

const ME = 'a';
const YOU = 'b';
const members = [ME, YOU];
const item = (p: Partial<HouseItem> & Pick<HouseItem, 'item_id'>): HouseItem => ({ id: Math.random().toString(36), owner_id: ME, variant: 0, room: 'living', x: 3, y: 12, flip: false, created_at: '', ...p });

describe('catálogo de móveis', () => {
  it('tem uns 60 itens com ids únicos e variantes', () => {
    expect(FURNITURE.length).toBeGreaterThanOrEqual(55);
    expect(new Set(FURNITURE.map((f) => f.id)).size).toBe(FURNITURE.length);
    for (const f of FURNITURE) {
      expect(f.variants.length).toBeGreaterThan(0);
      for (const v of f.variants) if ('k' in v.sprite) expect(v.sprite.k).toHaveLength(f.w * f.h);
      if (f.place === 'wall') expect(f.h).toBe(1);
    }
  });

  it('preços e faixas seguem o plano', () => {
    const ranges = { basic: [10, 30], good: [40, 90], special: [120, 250], legendary: [300, 500] } as const;
    for (const f of FURNITURE) {
      expect(f.price).toBeGreaterThanOrEqual(ranges[f.tier][0]);
      expect(f.price).toBeLessThanOrEqual(ranges[f.tier][1]);
    }
  });

  it('é igual ao catálogo do banco (migration coffee_house)', () => {
    const sql = readFileSync('supabase/migrations/20261108000000_coffee_house.sql', 'utf8');
    const rows = [...sql.matchAll(/\('([a-z_]+)', (\d+), (\d+), '(floor|rug|wall)', (\d+), (\d+), (\d+), (\d+)\)/g)];
    expect(rows.length).toBe(FURNITURE.length);
    for (const [, id, price, lvl, place, w, h, variants, comfort] of rows) {
      const f = FURNITURE_BY_ID[id];
      expect(f, id).toBeTruthy();
      expect([f.price, TIER_INFO[f.tier].minLevel, f.place, f.w, f.h, f.variants.length, f.comfort]).toEqual([+price, +lvl, place, +w, +h, +variants, +comfort]);
    }
  });
});

describe('onde dá para colocar', () => {
  const plant = FURNITURE_BY_ID.potted_plant;

  it('meu quarto sim, o da outra pessoa não; sala e cozinha os dois', () => {
    expect(canEditRoom('bedroom0', members, ME)).toBe(true);
    expect(canEditRoom('bedroom1', members, ME)).toBe(false);
    expect(canEditRoom('living', members, YOU)).toBe(true);
    expect(canPlace({ f: plant, x: 7, y: 5, items: [], members, me: ME })).toEqual({ ok: true, room: 'bedroom0' });
    expect(canPlace({ f: plant, x: 15, y: 5, items: [], members, me: ME }).ok).toBe(false);
  });

  it('não sobrepõe, não fica na porta, nem em cima das camas', () => {
    const it1 = item({ item_id: 'potted_plant', x: 7, y: 11 });
    expect(canPlace({ f: plant, x: 7, y: 11, items: [it1], members, me: ME }).ok).toBe(false);
    expect(canPlace({ f: plant, x: 7, y: 11, items: [it1], members, me: ME, movingId: it1.id }).ok).toBe(true);
    expect(canPlace({ f: plant, x: 1, y: 12, items: [], members, me: ME }).ok).toBe(false); // chegada do café
    expect(canPlace({ f: plant, x: 5, y: 9, items: [], members, me: ME }).ok).toBe(false); // frente da porta do quarto
    expect(canPlace({ f: plant, x: 2, y: 2, items: [], members, me: ME }).ok).toBe(false); // cama
  });

  it('tapete vai embaixo de móvel; móvel de parede só na parede do fundo', () => {
    const rug = FURNITURE_BY_ID.oval_rug;
    const table = item({ item_id: 'round_table', x: 9, y: 11 });
    expect(canPlace({ f: rug, x: 8, y: 11, items: [table], members, me: ME }).ok).toBe(true);
    const clock = FURNITURE_BY_ID.wall_clock;
    expect(canPlace({ f: clock, x: 3, y: 1, items: [], members, me: ME })).toEqual({ ok: true, room: 'bedroom0' });
    expect(canPlace({ f: clock, x: 5, y: 1, items: [], members, me: ME }).ok).toBe(false); // janela
    expect(canPlace({ f: clock, x: 3, y: 8, items: [], members, me: ME })).toEqual({ ok: true, room: 'living' });
    expect(canPlace({ f: clock, x: 3, y: 4, items: [], members, me: ME }).ok).toBe(false);
  });

  it('não deixa fechar a passagem', () => {
    // fileira de móveis cortando a cozinha de cima a baixo (x=18, y=10..14) + bancada em y=9
    const wall = [10, 11, 12, 13].map((y) => item({ item_id: 'barrel', room: 'kitchen', x: 18, y }));
    expect(canPlace({ f: FURNITURE_BY_ID.barrel, x: 18, y: 14, items: wall, members, me: ME })).toMatchObject({ ok: false, reason: 'Isso fecharia a passagem' });
  });

  it('móvel da outra pessoa: só mexo se estiver na sala ou cozinha', () => {
    expect(canTouchItem(item({ item_id: 'barrel', owner_id: YOU, room: 'living' }), members, ME)).toBe(true);
    expect(canTouchItem(item({ item_id: 'barrel', owner_id: YOU, room: 'bedroom1', x: 15, y: 5 }), members, ME)).toBe(false);
    expect(canTouchItem(item({ item_id: 'barrel', owner_id: YOU, room: null }), members, ME)).toBe(false);
  });

  it('acha o móvel tocado e um lugar livre', () => {
    const rug = item({ item_id: 'oval_rug', x: 6, y: 10 });
    const table = item({ item_id: 'round_table', x: 7, y: 11 });
    expect(itemAt([rug, table], 7, 11)?.id).toBe(table.id);
    expect(itemAt([rug, table], 6, 10)?.id).toBe(rug.id);
    const spot = firstFreeSpot(plant, { x: 5, y: 4 }, { items: [], members, me: ME });
    expect(spot && canPlace({ f: plant, ...spot, items: [], members, me: ME }).ok).toBe(true);
  });
});

describe('loja na store local', () => {
  it('compra desconta moedas, respeita o nível e vai para a mochila; colocar e guardar', async () => {
    localStorage.clear();
    const s = new LocalStore();
    s.addCoins(500);
    await expect(s.buyHouseItem('piano', 0)).rejects.toThrow('level');
    const before = (await s.load()).me.coins;
    const { id } = await s.buyHouseItem('armchair', 1).catch(() => s.buyHouseItem('potted_plant', 0));
    let snap = await s.load();
    const it = snap.houseItems.find((h) => h.id === id)!;
    expect(it.room).toBeNull();
    expect(snap.me.coins).toBe(before - FURNITURE_BY_ID[it.item_id].price);
    await s.placeHouseItem(id, 'living', 7, 11, true);
    snap = await s.load();
    expect(snap.houseItems.find((h) => h.id === id)).toMatchObject({ room: 'living', x: 7, y: 11, flip: true });
    await expect(s.placeHouseItem(id, 'bedroom1', 15, 5, false)).rejects.toThrow('room');
    await s.storeHouseItem(id);
    expect((await s.load()).houseItems.find((h) => h.id === id)?.room).toBeNull();
  });
});
