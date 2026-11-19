import { describe, expect, it } from 'vitest';
import { pathIn, walkable } from './grid';
import { BEDROOM_DOORS, CAFE_DOOR, FROM_CAFE, HOUSE_MAP, HOUSE_ROWS, ROOMS, SLEEP_SPOT, WAKE_UP, bedroomIndex, roomAt } from './house';
import { CAFE_MAP, FROM_HOUSE, HOUSE_DOOR } from './map';

describe('casa', () => {
  it('tem todas as linhas do mesmo tamanho', () => {
    for (const r of HOUSE_ROWS) expect(r.length).toBe(HOUSE_MAP.w);
  });

  it('cada um acorda no próprio quarto e consegue chegar à porta do café', () => {
    WAKE_UP.forEach((p, i) => {
      expect(roomAt(p)?.id).toBe(`bedroom${i}`);
      expect(walkable(HOUSE_MAP, p.x, p.y)).toBe(true);
      const path = pathIn(HOUSE_MAP, p, CAFE_DOOR);
      expect(path.at(-1)).toEqual(CAFE_DOOR);
    });
  });

  it('todos os cômodos são alcançáveis a partir da porta', () => {
    for (const r of ROOMS) {
      const mid = { x: Math.floor((r.x0 + r.x1) / 2), y: r.y1 };
      expect(pathIn(HOUSE_MAP, FROM_CAFE, mid).length).toBeGreaterThan(0);
    }
  });

  it('portas e lugares especiais são andáveis', () => {
    for (const p of [...BEDROOM_DOORS, ...SLEEP_SPOT, CAFE_DOOR, FROM_CAFE]) expect(walkable(HOUSE_MAP, p.x, p.y)).toBe(true);
  });

  it('a porta do café leva para casa', () => {
    expect(walkable(CAFE_MAP, HOUSE_DOOR.x, HOUSE_DOOR.y)).toBe(true);
    expect(pathIn(CAFE_MAP, FROM_HOUSE, HOUSE_DOOR)).toEqual([HOUSE_DOOR]);
  });

  it('quarto de cada membro pela ordem de entrada', () => {
    expect(bedroomIndex(['a', 'b'], 'a')).toBe(0);
    expect(bedroomIndex(['a', 'b'], 'b')).toBe(1);
    expect(bedroomIndex(['a'], 'x')).toBe(0);
  });
});
