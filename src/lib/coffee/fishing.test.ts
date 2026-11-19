import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FISH, FISH_BY_ID, FREE_CASTS, RARITY_INFO, isNight, rollFish, waterNear } from './fishing';
import { LocalStore } from './store/localStore';

describe('peixes', () => {
  it('30 espécies, ids únicos, de todas as raridades', () => {
    expect(FISH).toHaveLength(30);
    expect(new Set(FISH.map((f) => f.id)).size).toBe(30);
    for (const r of ['junk', 'common', 'uncommon', 'rare', 'legendary']) expect(FISH.some((f) => f.rarity === r)).toBe(true);
  });

  it('catálogo igual ao do banco', () => {
    const sql = readFileSync('supabase/migrations/20261113000000_coffee_fishing.sql', 'utf8');
    const rows = [...sql.matchAll(/\('([a-z_]+)', '(junk|common|uncommon|rare|legendary)', (true|false), (\d+)\)/g)];
    expect(rows.length).toBe(FISH.length);
    for (const [, id, rarity, night, coins] of rows) {
      const f = FISH_BY_ID[id];
      expect([f.rarity, !!f.night, RARITY_INFO[f.rarity].coins]).toEqual([rarity, night === 'true', +coins]);
    }
  });

  it('de dia não vem peixe noturno; à noite pode vir', () => {
    for (let i = 0; i < 300; i++) expect(rollFish(false, false).night).toBeFalsy();
    let night = 0;
    for (let i = 0; i < 2000; i++) if (rollFish(true, true).night) night++;
    expect(night).toBeGreaterThan(0);
    expect(isNight(20)).toBe(true);
    expect(isNight(12)).toBe(false);
  });

  it('com bônus, raro e lendário aparecem mais', () => {
    const count = (boost: boolean) => {
      let n = 0;
      let seed = 1;
      const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 5000; i++) if (['rare', 'legendary'].includes(rollFish(false, boost, rand).rarity)) n++;
      return n;
    };
    expect(count(true)).toBeGreaterThan(count(false));
  });

  it('beira do lago: acha a água encostada', () => {
    expect(waterNear({ x: 14, y: 9 })).toEqual({ x: 15, y: 9 });
    expect(waterNear({ x: 5, y: 5 })).toBeNull();
  });
});

describe('pescaria na store local', () => {
  it('10 grátis, depois isca; pegou vai para o álbum com moedas; escapou não', async () => {
    localStorage.clear();
    const s = new LocalStore();
    expect((await s.load()).fishing.free_left).toBe(FREE_CASTS);
    const before = (await s.load()).me.coins;
    const c1 = await s.fishCast(false);
    const r1 = await s.fishCatch(c1.cast_id, true);
    expect(r1.first).toBe(true);
    expect(r1.coins).toBe(RARITY_INFO[FISH_BY_ID[c1.fish_id].rarity].coins);
    await expect(s.fishCatch(c1.cast_id, true)).rejects.toThrow('expired');
    for (let i = 1; i < FREE_CASTS; i++) {
      const c = await s.fishCast(false);
      await s.fishCatch(c.cast_id, false);
    }
    await expect(s.fishCast(false)).rejects.toThrow('no bait');
    await s.buyBait(2);
    const c = await s.fishCast(false);
    expect(c.fish_id).toBeTruthy();
    const snap = await s.load();
    expect(snap.fishing.bait).toBe(1);
    expect(snap.me.coins).toBe(before + r1.coins - 4 + 0);
    expect(snap.fishing.album.find((a) => a.fish_id === c1.fish_id)).toBeTruthy();
    expect(await s.feedMucego()).toBe(2);
    expect(await s.feedMucego()).toBe(0);
  });
});
