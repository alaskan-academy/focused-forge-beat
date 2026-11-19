import { describe, expect, it } from 'vitest';
import type { HouseItem } from './houseItems';
import { prepQuestion } from './prepositions';

const item = (p: Partial<HouseItem> & Pick<HouseItem, 'item_id' | 'x' | 'y'>): HouseItem => ({ id: Math.random().toString(36), owner_id: 'a', variant: 0, room: 'living', flip: false, created_at: '', ...p });
const fixed = (seed: number) => {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
};

describe('Where did you put the…?', () => {
  it('ao lado do sofá fixo da sala', () => {
    // sofá fixo em (3,10)-(4,10); poltrona fixa em (6,10); colocar em (2,10) = ao lado do sofá
    const plant = item({ item_id: 'potted_plant', x: 2, y: 10 });
    const q = prepQuestion(plant, [plant], fixed(1))!;
    expect(q.question).toBe('Where did you put the potted plant?');
    expect(q.options[q.answer]).toBe("It's next to the sofa.");
    expect(q.options).toHaveLength(3);
    expect(new Set(q.options).size).toBe(3);
  });

  it('entre dois móveis', () => {
    // (5,10) fica entre o sofá (3-4,10) e a poltrona (6,10)
    const stool = item({ item_id: 'stool', x: 5, y: 10 });
    const q = prepQuestion(stool, [stool], fixed(2))!;
    expect(q.options[q.answer]).toBe("It's between the sofa and the armchair.");
  });

  it('na frente / atrás e em cima do tapete', () => {
    const table = item({ item_id: 'coffee_table', x: 3, y: 11 }); // logo abaixo do sofá
    expect(prepQuestion(table, [table], fixed(3))!.options).toContain("It's in front of the sofa.");
    const rug = item({ item_id: 'oval_rug', x: 8, y: 12 });
    const chair = item({ item_id: 'armchair', x: 9, y: 12 });
    const q = prepQuestion(chair, [rug, chair], fixed(4))!;
    expect(q.options[q.answer]).toBe("It's on the oval rug.");
    const q2 = prepQuestion(rug, [rug, chair], fixed(5))!;
    expect(q2.options[q2.answer]).toBe("It's under the armchair.");
  });

  it('sem nada por perto não pergunta', () => {
    const lonely = item({ item_id: 'cactus', x: 9, y: 13 });
    expect(prepQuestion(lonely, [lonely], fixed(6))).toBeNull();
  });

  it('as opções erradas são mesmo falsas', () => {
    for (let s = 1; s < 30; s++) {
      const plant = item({ item_id: 'potted_plant', x: 2, y: 10 });
      const q = prepQuestion(plant, [plant], fixed(s))!;
      q.options.forEach((o, i) => {
        if (i !== q.answer) expect(o).not.toBe("It's next to the sofa.");
      });
    }
  });
});
