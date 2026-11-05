// Caderninho escrito à mão: as palavras que cada jogador anota viram itens de aprendizagem
// (kind 'mine', id `u:<id>`) no mesmo registro ITEMS que a revisão e o caderninho já usam.
import { ITEMS, ITEM_EXAMPLES, type LearnItem } from '.';
import type { CustomItem } from '@/lib/coffee/store/types';

export const customItemId = (c: Pick<CustomItem, 'id'>) => `u:${c.id}`;
export const isCustomId = (id: string) => id.startsWith('u:');

export function toLearnItem(c: CustomItem): LearnItem {
  return { id: customItemId(c), kind: 'mine', label: c.en.trim(), pt: c.pt.trim(), level: 'A2', en: c.en.trim(), example: c.example?.trim() || undefined };
}

// Coloca as minhas palavras no registro (e tira as que foram apagadas). Chamado a cada carga do café.
export function registerCustomItems(mine: CustomItem[]) {
  const keep = new Set(mine.map(customItemId));
  for (const id of Object.keys(ITEMS)) {
    if (isCustomId(id) && !keep.has(id)) {
      delete ITEMS[id];
      delete ITEM_EXAMPLES[id];
    }
  }
  for (const c of mine) {
    const item = toLearnItem(c);
    ITEMS[item.id] = item;
    if (item.example) ITEM_EXAMPLES[item.id] = item.example;
    else delete ITEM_EXAMPLES[item.id];
  }
}

// Já tenho essa palavra? (para o "copiar" do caderninho da outra pessoa)
export const sameWord = (a: Pick<CustomItem, 'en'>, b: Pick<CustomItem, 'en'>) => a.en.trim().toLowerCase() === b.en.trim().toLowerCase();
