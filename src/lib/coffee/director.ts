// "Diretor": decide o que acontece quando um jogador interage com um cliente.
//  - Personagem recorrente: o próximo capítulo dele para este jogador, se liberado; senão um
//    bate-papo de cliente fiel.
//  - Cliente avulso: um pedido ou uma conversa, escolhido pelo SRS do jogador (itens vencidos
//    primeiro, alguns novos por dia, sem repetir cena nem tema recentes, às vezes acima do nível).
import { CHARACTER_BY_ID, HANDOFFS, ORDERS, TALKS } from '@/content/coffee';
import { personalize, type PartnerInfo } from '@/content/coffee/personalize';
import { isLine, type Activity, type Scene, type Theme } from '@/content/coffee/types';
import { chapterStatus, type ArcState } from './arcs';
import { isDue, overdueDays, type VocabState } from './srs';

export const NEW_ITEMS_PER_DAY = 10;
export const STRETCH_CHANCE = 0.15;

export type PlayerContext = {
  states: Record<string, VocabState>;
  arcs: Record<string, ArcState>;
  recentScenes: string[]; // mais recente primeiro
  lastTheme: Theme | null;
  newToday: number;
};

export type Encounter = {
  kind: 'chapter' | 'regular' | 'order' | 'talk';
  characterId: string | null;
  chapterId: string | null;
  scenes: Scene[];
};

export const sceneActivities = (s: Scene): Activity[] => s.steps.flatMap((st) => (isLine(st) ? [] : [st.activity]));
export const sceneItems = (s: Scene): string[] => [...new Set(sceneActivities(s).flatMap((a) => a.items))];

export function scoreScene(s: Scene, ctx: PlayerContext, now: Date, stretch: boolean): number {
  let newBudget = Math.max(0, NEW_ITEMS_PER_DAY - ctx.newToday);
  let score = 0;
  for (const id of sceneItems(s)) {
    const st = ctx.states[id];
    if (!st) {
      if (newBudget > 0) {
        score += 1;
        newBudget--;
      } else score -= 1.5;
    } else if (isDue(st, now)) score += 3 + Math.min(overdueDays(st, now), 5) * 0.5;
    else score -= 0.4;
  }
  const recent = ctx.recentScenes.indexOf(s.id);
  if (recent >= 0) score -= 20 - recent;
  if (ctx.lastTheme && s.theme === ctx.lastTheme) score -= 2.5;
  if (s.level === 'B1') score += stretch ? 2 : -4;
  else if (s.level === 'A2+') score += stretch ? 1 : 0;
  return score;
}

function pickBest(list: Scene[], ctx: PlayerContext, now: Date, rng: () => number): Scene {
  const stretch = rng() < STRETCH_CHANCE;
  let best = list[0];
  let bestScore = -Infinity;
  for (const s of list) {
    const sc = scoreScene(s, ctx, now, stretch) + rng() * 1.2;
    if (sc > bestScore) {
      best = s;
      bestScore = sc;
    }
  }
  return best;
}

// `waitingFor`: o outro jogador, quando ele ainda não conversou com este cliente recorrente nesta
// visita. Aí o cliente termina perguntando por ele (despedida de "esperar a outra pessoa").
export function planEncounter(
  characterId: string | null,
  ctx: PlayerContext,
  now: Date,
  rng: () => number = Math.random,
  waitingFor: PartnerInfo | null = null,
): Encounter {
  const char = characterId ? CHARACTER_BY_ID[characterId] : undefined;
  if (char) {
    const handoff = waitingFor ? [personalize([...HANDOFFS].sort((a, b) => rank(ctx, b) - rank(ctx, a))[0], waitingFor)] : [];
    const st = chapterStatus(char, ctx.arcs[char.id], now);
    if (st.state === 'available') return { kind: 'chapter', characterId: char.id, chapterId: st.chapter.id, scenes: [st.chapter, ...handoff] };
    // bate-papo de fiel: o menos recente
    const regular = [...char.regulars].sort((a, b) => rank(ctx, b) - rank(ctx, a))[0];
    return { kind: 'regular', characterId: char.id, chapterId: null, scenes: [regular, ...handoff] };
  }

  const scene = pickBest([...ORDERS, ...TALKS], ctx, now, rng);
  if (scene.kind === 'talk' && scene.withOrder) {
    const order = pickBest(ORDERS, { ...ctx, recentScenes: [scene.id, ...ctx.recentScenes], lastTheme: scene.theme }, now, rng);
    return { kind: 'talk', characterId: null, chapterId: null, scenes: [scene, order] };
  }
  return { kind: scene.kind === 'order' ? 'order' : 'talk', characterId: null, chapterId: null, scenes: [scene] };
}

// Quanto mais tempo desde a última vez, maior (nunca vista = maior de todas).
function rank(ctx: PlayerContext, s: Scene) {
  const i = ctx.recentScenes.indexOf(s.id);
  return i < 0 ? 1000 : i;
}

// Balão sobre o cliente para este jogador: capítulo novo, bate-papo ou pedido.
export function bubbleFor(characterId: string | null, arcs: Record<string, ArcState>, now: Date): 'book' | 'talk' | 'coffee' {
  const char = characterId ? CHARACTER_BY_ID[characterId] : undefined;
  if (!char) return 'coffee';
  return chapterStatus(char, arcs[char.id], now).state === 'available' ? 'book' : 'talk';
}
