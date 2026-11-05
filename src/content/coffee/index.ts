// Ponto único de acesso ao conteúdo. Para adicionar um personagem: crie characters/<id>.ts e
// coloque-o em CHARACTERS. Pedidos vão em orders.ts e conversas avulsas em talks.ts.
import ben from './characters/ben';
import dana from './characters/dana';
import gary from './characters/gary';
import junAlex from './characters/jun-alex';
import luna from './characters/luna';
import maya from './characters/maya';
import parker from './characters/parker';
import priya from './characters/priya';
import sofia from './characters/sofia';
import tom from './characters/tom';
import { CHUNKS } from './chunks';
import { GRAMMAR } from './grammar';
import { HANDOFFS } from './handoffs';
import { ORDERS as BASE_ORDERS } from './orders';
import { MORE_ORDERS } from './orders-more';
import { TALKS as BASE_TALKS } from './talks';
import { MORE_TALKS } from './talks-more';
import { VOCAB } from './vocab';
import { SUDOKU_WORDS } from './sudokuWords';
import { isLine, type Character, type Level, type Scene, type Theme } from './types';

export const CHARACTERS: Character[] = [maya, tom, gary, priya, parker, junAlex, sofia, ben, luna, dana];
export const CHARACTER_BY_ID: Record<string, Character> = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

export const ORDERS = [...BASE_ORDERS, ...MORE_ORDERS];
export const TALKS = [...BASE_TALKS, ...MORE_TALKS];
export { HANDOFFS };

// Item de aprendizagem (vocabulário ou gramática), como o SRS e o caderninho enxergam.
export type LearnItem = {
  id: string;
  kind: 'vocab' | 'grammar' | 'chunk' | 'word' | 'mine'; // word = Sudoku (w:...) · mine = anotada à mão (u:...)
  label: string; // como aparece no caderninho
  pt: string;
  level: Level;
  theme?: Theme;
  en?: string; // vocabulário e chunks: texto que aparece nas falas
  example?: string;
};

export const ITEMS: Record<string, LearnItem> = Object.fromEntries([
  ...VOCAB.map((v) => [v.id, { id: v.id, kind: 'vocab', label: v.en, pt: v.pt, level: v.level, theme: v.theme, en: v.en } as LearnItem]),
  ...GRAMMAR.map((g) => [g.id, { id: g.id, kind: 'grammar', label: g.name, pt: g.pt, level: g.level, example: g.example } as LearnItem]),
  ...CHUNKS.map((c) => [c.id, { id: c.id, kind: 'chunk', label: c.en, pt: c.pt, level: c.level, en: c.en, example: c.examples[0]?.en } as LearnItem]),
  // palavras do Sudoku que ainda não existem em vocab.ts
  ...SUDOKU_WORDS.filter((w) => !w.vocab).map((w) => [`w:${w.id}`, { id: `w:${w.id}`, kind: 'word', label: w.en, pt: w.pt, level: w.level, en: w.en, example: w.gap.replace('___', w.en) } as LearnItem]),
]);

// (as despedidas entram com marcadores {partner}/{sub}…; veja personalize.ts)
export const ALL_SCENES: Scene[] = [...ORDERS, ...TALKS, ...HANDOFFS, ...CHARACTERS.flatMap((c) => [...c.chapters, ...c.regulars])];
export const SCENE_BY_ID: Record<string, Scene> = Object.fromEntries(ALL_SCENES.map((s) => [s.id, s]));

// Todo o texto em inglês de uma cena (falas, perguntas, opções, respostas).
export function sceneText(s: Scene): string {
  const parts: string[] = [];
  for (const st of s.steps) {
    if (isLine(st)) {
      parts.push(st.say);
      continue;
    }
    const a = st.activity;
    switch (a.type) {
      case 'choose_reply':
        a.options.forEach((o) => parts.push(o.text, o.reaction?.say ?? ''));
        break;
      case 'build_reply':
        parts.push(a.text);
        break;
      case 'gap':
        parts.push(a.before + a.answers[0] + a.after);
        break;
      case 'free_write':
        parts.push(a.prompt, ...a.examples);
        break;
      case 'build_order':
        parts.push(...Object.values(a.order).flat().filter((v): v is string => typeof v === 'string'));
        break;
      case 'group_order':
        parts.push(...a.choices);
        break;
      default:
        parts.push(a.question, ...a.options);
    }
  }
  return parts.join(' ');
}

// Exemplo de uso de cada item de vocabulário (primeira fala em que aparece), para o caderninho.
export const ITEM_EXAMPLES: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  const lines = ALL_SCENES.filter((s) => s.kind !== 'handoff').flatMap((s) => s.steps.filter(isLine).map((l) => l.say));
  for (const item of Object.values(ITEMS)) {
    if (item.example) out[item.id] = item.example;
    else if (item.en) {
      const hit = lines.find((l) => l.toLowerCase().includes(item.en!.toLowerCase()));
      if (hit) out[item.id] = hit;
    }
  }
  return out;
})();
