// Revisão em cards: quais itens do SRS estão vencidos (mais atrasados primeiro).
import { ITEMS } from '@/content/coffee';
import { isDue, overdueDays, type VocabState } from './srs';

export function dueItems(states: Record<string, VocabState>, now: Date): string[] {
  return Object.values(states)
    .filter((s) => ITEMS[s.item_id] && isDue(s, now))
    .sort((a, b) => overdueDays(b, now) - overdueDays(a, now))
    .map((s) => s.item_id);
}
