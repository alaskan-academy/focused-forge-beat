// Texto do mural a partir das linhas de coffee_activity (kind + data).
import { CHARACTER_BY_ID } from '@/content/coffee';
import { SUDOKU_THEMES } from '@/content/coffee/sudokuWords';
import type { FeedEntry } from './store/types';

export const UPGRADE_NAMES: Record<string, string> = { cat_corner: 'Cantinho do gato' };

export function feedText(e: FeedEntry, nameOf: (userId: string | null) => string): string {
  const who = nameOf(e.user_id);
  const d = e.data as { stars?: number; character?: string | null; chapter?: string | null; walkout?: boolean; upgrade?: string; amount?: number };
  const char = d.character ? CHARACTER_BY_ID[d.character] : undefined;
  const stars = '⭐'.repeat(Math.max(1, Math.min(3, d.stars ?? 1)));
  switch (e.kind) {
    case 'opened_cafe':
      return `${who} abriu o Coffee Cats ☕`;
    case 'joined_cafe':
      return `${who} entrou no café 🎉`;
    case 'chapter': {
      const title = char?.chapters.find((c) => c.id === d.chapter)?.title_pt;
      return d.walkout
        ? `${who} ouviu o capítulo "${title ?? '?'}" de ${char?.name ?? 'alguém'}, mas errou demais 😬`
        : `${who} ouviu o capítulo "${title ?? '?'}" de ${char?.name ?? 'alguém'} 💛 ${stars}`;
    }
    case 'served':
      if (d.walkout) return `Um cliente saiu sem pagar do atendimento de ${who} 😤`;
      return char ? `${who} conversou com ${char.name} ${stars}` : `${who} atendeu um cliente ${stars}`;
    case 'contributed':
      return `${who} colocou ${d.amount ?? 0} 🪙 no ${UPGRADE_NAMES[d.upgrade ?? ''] ?? 'projeto do café'}`;
    case 'rent': {
      const r = e.data as { paid?: number; debt?: number; first?: boolean };
      if (r.first) return `O Belmont levou todas as ${r.paid ?? 0} 🪙 de ${who} na primeira visita 😈`;
      return (r.debt ?? 0) > 0
        ? `${who} pagou ${r.paid ?? 0} 🪙 ao Belmont e ficou devendo ${r.debt} 😈`
        : `${who} pagou ${r.paid ?? 0} 🪙 de aluguel ao Belmont 😈`;
    }
    case 'puzzle': {
      const p = e.data as { size?: number; theme?: string };
      const theme = SUDOKU_THEMES.find((t) => t.id === p.theme);
      return `${who} resolveu o Sudoku ${p.size ?? '?'}×${p.size ?? '?'}${theme ? ` de ${theme.name_pt.toLowerCase()} ${theme.emoji}` : ''} ${stars}`;
    }
    case 'upgrade_done':
      return `${who} completou o ${UPGRADE_NAMES[d.upgrade ?? ''] ?? 'projeto do café'}! 🎉`;
    default:
      return `${who}: ${e.kind}`;
  }
}

export function timeAgo(iso: string, now: Date): string {
  const min = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} d`;
}
