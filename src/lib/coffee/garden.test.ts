import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CROPS, CROP_BY_ID, GARDEN_DOOR, GARDEN_MAP, GARDEN_ROWS, KIND_INFO, FROM_HOUSE_TO_GARDEN, STAND, plantNow, plotAt, plotPrice, plotTile, waterPlant } from './garden';
import { pickSeedWord, waterQuiz } from './gardenWords';
import { pathIn, walkable } from './grid';
import { ITEMS } from '@/content/coffee';
import { LocalStore } from './store/localStore';

const T0 = new Date('2026-11-18T12:00:00Z');
const at = (min: number) => new Date(T0.getTime() + min * 60_000);
const herb = (over = {}) => ({ crop_id: 'basil', stage: 0, stage_started_at: T0.toISOString(), watered: false, ...over });

describe('quintal', () => {
  it('mapa: linhas iguais, porta e caminho até todos os canteiros e a barraquinha', () => {
    for (const r of GARDEN_ROWS) expect(r.length).toBe(GARDEN_MAP.w);
    expect(walkable(GARDEN_MAP, GARDEN_DOOR.x, GARDEN_DOOR.y)).toBe(true);
    for (let owner = 0; owner < 2; owner++)
      for (let plot = 0; plot < 12; plot++) {
        const t = plotTile(owner, plot);
        expect(plotAt(t.x, t.y)).toEqual({ owner, plot });
        expect(pathIn(GARDEN_MAP, FROM_HOUSE_TO_GARDEN, t).length).toBeGreaterThan(0);
      }
    expect(pathIn(GARDEN_MAP, FROM_HOUSE_TO_GARDEN, STAND[0]).length).toBeGreaterThan(0);
  });

  it('catálogo de plantas igual ao do banco', () => {
    const sql = readFileSync('supabase/migrations/20261112000000_coffee_garden.sql', 'utf8');
    const rows = [...sql.matchAll(/\('([a-z_]+)', '(herb|veg|fruit|golden)', (\d+), (\d+), (\d+), (\d+)\)/g)];
    expect(rows.length).toBe(CROPS.length);
    for (const [, id, kind, mins, coins, price, lvl] of rows) {
      const k = KIND_INFO[CROP_BY_ID[id].kind];
      expect([CROP_BY_ID[id].kind, k.stageMinutes, k.coins, k.price, k.minLevel]).toEqual([kind, +mins, +coins, +price, +lvl]);
    }
  });
});

describe('crescimento', () => {
  it('sem água fica com sede e não cresce', () => {
    expect(plantNow(herb(), at(100))).toMatchObject({ stage: 0, thirsty: true, ready: false });
  });

  it('regada a tempo cresce quando o estágio acaba; depois precisa de água de novo', () => {
    const w = waterPlant(herb(), at(5));
    expect(w.watered).toBe(true);
    expect(plantNow(w, at(19))).toMatchObject({ stage: 0, growing: true });
    expect(plantNow(w, at(21))).toMatchObject({ stage: 1, thirsty: true });
  });

  it('regada atrasada cresce na hora', () => {
    const w = waterPlant(herb(), at(60));
    expect(w).toMatchObject({ stage: 1, watered: false });
    expect(plantNow(w, at(61))).toMatchObject({ stage: 1, thirsty: true });
  });

  it('3 regas até ficar pronta', () => {
    let p = herb();
    let t = 0;
    for (let i = 0; i < 3; i++) {
      t += 25;
      p = waterPlant(p, at(t));
    }
    expect(plantNow(p, at(t + 1)).ready).toBe(true);
    expect(plotPrice(6)).toBe(30);
    expect(plotPrice(11)).toBe(80);
  });
});

describe('palavras da horta', () => {
  it('semente traz palavra-cola; plantas antigas continuam com o exercício de antes', () => {
    const w = pickSeedWord('herb', {}, new Set(), () => 0.3);
    expect(w.startsWith('gl:')).toBe(true);
    expect(ITEMS[w]?.kind).toBe('glue');
    expect(pickSeedWord('golden', {}, new Set(), () => 0.5).startsWith('gl:')).toBe(true);
    for (let s = 0; s < 3; s++) {
      const q = waterQuiz('c:on_my_way', s, () => 0.4)!;
      expect(q.options).toHaveLength(3);
      expect(new Set(q.options).size).toBe(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('horta na store local', () => {
  it('sementes do dia, plantar, regar e colher', async () => {
    localStorage.clear();
    const s = new LocalStore();
    const given = await s.gardenDaily();
    expect(given).toHaveLength(3);
    expect(await s.gardenDaily()).toEqual([]);
    const crop = given[0];
    await s.plantSeed(0, crop, 'c:on_my_way');
    await expect(s.plantSeed(0, crop, 'c:on_my_way')).rejects.toThrow();
    await expect(s.plantSeed(7, 'basil', 'x')).rejects.toThrow('locked');
    let plant = (await s.load()).garden.plants[0];
    const before = (await s.load()).me.coins;
    for (let i = 0; i < 3; i++) {
      s.advanceHours(10);
      await s.waterPlant(plant.id);
    }
    s.advanceHours(10);
    plant = (await s.load()).garden.plants[0];
    const r = await s.harvestPlant(plant.id);
    expect(r.coins).toBe(KIND_INFO[CROP_BY_ID[crop].kind].coins);
    const snap = await s.load();
    expect(snap.me.coins).toBe(before + r.coins);
    expect(snap.garden.pantry[crop]).toBe(1);
    expect(snap.garden.plants).toHaveLength(0);
  });
});
