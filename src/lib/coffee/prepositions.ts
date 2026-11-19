// "Where did you put the sofa?" — depois de colocar um móvel, uma pergunta de preposição de lugar
// montada a partir da casa de verdade (o que está ao lado, na frente, atrás, embaixo…).
// Visão de cima: o que fica logo ABAIXO de um móvel no mapa está "in front of" ele; logo acima, "behind".
import { FURNITURE_BY_ID } from '@/content/coffee/furniture';
import { charAt } from './grid';
import { HOUSE_MAP, HOUSE_WINDOWS_X, roomAt } from './house';
import type { HouseItem } from './houseItems';

type Rect = { x0: number; y0: number; x1: number; y1: number };
type Obj = Rect & { name: string; kind: 'floor' | 'rug' | 'wall'; id?: string };

export type PrepQuestion = { question: string; options: string[]; answer: number; explain_pt: string };

const FIXED_NAMES: Record<string, string> = { B: 'bed', O: 'sofa', A: 'armchair', F: 'stove', C: 'kitchen counter', X: 'moving box' };

// móveis fixos do mapa (camas, sofá, poltrona, fogão, bancada, caixas), agrupando letras vizinhas
function fixedObjects(): Obj[] {
  const seen = new Set<string>();
  const out: Obj[] = [];
  for (let y = 0; y < HOUSE_MAP.h; y++)
    for (let x = 0; x < HOUSE_MAP.w; x++) {
      const ch = charAt(HOUSE_MAP, x, y);
      if (!FIXED_NAMES[ch] || seen.has(`${x},${y}`)) continue;
      const r: Rect = { x0: x, y0: y, x1: x, y1: y };
      const stack = [{ x, y }];
      seen.add(`${x},${y}`);
      while (stack.length) {
        const p = stack.pop()!;
        r.x0 = Math.min(r.x0, p.x);
        r.x1 = Math.max(r.x1, p.x);
        r.y0 = Math.min(r.y0, p.y);
        r.y1 = Math.max(r.y1, p.y);
        for (const n of [
          { x: p.x + 1, y: p.y },
          { x: p.x - 1, y: p.y },
          { x: p.x, y: p.y + 1 },
          { x: p.x, y: p.y - 1 },
        ])
          if (charAt(HOUSE_MAP, n.x, n.y) === ch && !seen.has(`${n.x},${n.y}`)) {
            seen.add(`${n.x},${n.y}`);
            stack.push(n);
          }
      }
      out.push({ ...r, name: FIXED_NAMES[ch], kind: 'floor' });
    }
  return out;
}
const FIXED = fixedObjects();

function itemObj(it: Pick<HouseItem, 'item_id' | 'x' | 'y' | 'id'>): Obj | null {
  const f = FURNITURE_BY_ID[it.item_id];
  if (!f) return null;
  return { id: it.id, name: f.en, kind: f.place, x0: it.x, y0: it.y, x1: it.x + f.w - 1, y1: it.y + f.h - 1 };
}

const overlapX = (a: Rect, b: Rect) => a.x0 <= b.x1 && b.x0 <= a.x1;
const overlapY = (a: Rect, b: Rect) => a.y0 <= b.y1 && b.y0 <= a.y1;
const overlap = (a: Rect, b: Rect) => overlapX(a, b) && overlapY(a, b);

type Prep = 'next to' | 'in front of' | 'behind' | 'under' | 'on' | 'above';
const PREP_PT: Record<Prep, string> = {
  'next to': 'ao lado de',
  'in front of': 'na frente de',
  behind: 'atrás de',
  under: 'embaixo de',
  on: 'em cima de',
  above: 'acima de',
};

// a relação "T <prep> O" é verdadeira?
function holds(prep: Prep, t: Obj, o: Obj): boolean {
  if (t.kind === 'wall') return prep === 'above' && o.kind === 'floor' && overlapX(t, o) && o.y0 === t.y1 + 1;
  if (prep === 'on') return t.kind === 'floor' && o.kind === 'rug' && overlap(t, o);
  if (prep === 'under') return t.kind === 'rug' && o.kind === 'floor' && overlap(t, o);
  if (t.kind !== 'floor' || o.kind !== 'floor') return false;
  if (prep === 'next to') return overlapY(t, o) && (o.x1 === t.x0 - 1 || o.x0 === t.x1 + 1);
  if (prep === 'in front of') return overlapX(t, o) && o.y1 === t.y0 - 1;
  if (prep === 'behind') return overlapX(t, o) && o.y0 === t.y1 + 1;
  return false;
}

const ORDER: Prep[] = ['on', 'under', 'next to', 'in front of', 'behind', 'above'];

function shuffle<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Pergunta para o móvel `target` (já na posição nova) entre os outros móveis colocados.
// null se não houver nada por perto para comparar.
export function prepQuestion(target: Pick<HouseItem, 'item_id' | 'x' | 'y' | 'id'>, placed: HouseItem[], rand: () => number = Math.random): PrepQuestion | null {
  const t = itemObj(target);
  if (!t) return null;
  const room = roomAt({ x: t.x0, y: t.kind === 'wall' ? t.y0 + 1 : t.y0 });
  const inRoom = (o: Obj) => !!room && overlap(o, { x0: room.x0 - 1, y0: room.y0 - 1, x1: room.x1 + 1, y1: room.y1 + 1 });
  const others = [...FIXED, ...placed.filter((p) => p.room && p.id !== target.id).map(itemObj).filter((o): o is Obj => !!o)].filter(inRoom);

  // relações verdadeiras, na ordem de preferência
  const truths: { prep: Prep; o: Obj }[] = [];
  for (const prep of ORDER) for (const o of others) if (holds(prep, t, o)) truths.push({ prep, o });

  // "between": um vizinho de cada lado
  const left = others.find((o) => holds('next to', t, o) && o.x1 === t.x0 - 1);
  const right = others.find((o) => holds('next to', t, o) && o.x0 === t.x1 + 1);
  const name = t.name;
  let correct: string;
  let explain: string;
  if (left && right && left.name !== right.name) {
    correct = `It's between the ${left.name} and the ${right.name}.`;
    explain = `"between" = entre (um de cada lado).`;
  } else if (truths.length) {
    const tr = truths[0];
    correct = `It's ${tr.prep} the ${tr.o.name}.`;
    explain = `"${tr.prep}" = ${PREP_PT[tr.prep]}.`;
  } else if (t.kind === 'wall' && t.y0 === 1 && HOUSE_WINDOWS_X.some((wx) => wx === t.x0 - 1 || wx === t.x1 + 1)) {
    correct = `It's on the wall, next to the window.`;
    explain = `"on the wall" = na parede; "next to the window" = ao lado da janela.`;
  } else return null;

  // erradas: mesmo objeto com outra preposição, ou outro objeto — sempre falsas
  const wrong = new Set<string>();
  const subject = truths[0]?.o ?? left ?? others[0];
  const preps: Prep[] = t.kind === 'wall' ? ['next to', 'under', 'on'] : t.kind === 'rug' ? ['on', 'next to', 'behind'] : ['next to', 'in front of', 'behind', 'under', 'on'];
  const candidates: string[] = [];
  for (const o of shuffle([...others], rand)) for (const p of shuffle([...preps], rand)) if (!holds(p, t, o)) candidates.push(`It's ${p} the ${o.name}.`);
  if (subject) for (const p of shuffle([...preps], rand)) if (!holds(p, t, subject)) candidates.unshift(`It's ${p} the ${subject.name}.`);
  for (const c of candidates) {
    if (c !== correct && !truths.some((tr) => c === `It's ${tr.prep} the ${tr.o.name}.`)) wrong.add(c);
    if (wrong.size >= 2) break;
  }
  if (wrong.size < 2) return null;
  const options = shuffle([correct, ...wrong], rand);
  return { question: `Where did you put the ${name}?`, options, answer: options.indexOf(correct), explain_pt: explain };
}

