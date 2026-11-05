// Monta a visita do Belmont Sulphur: capítulo novo (se liberado) ou uma visita de cobrança,
// uma pergunta sobre o que você fez desde a última visita (com os dados de verdade do mural) e,
// a partir da 2ª visita, a cena da conta com os números do dia.
import belmont, { BELMONT_BILLS } from '@/content/coffee/characters/belmont';
import { CHARACTER_BY_ID } from '@/content/coffee';
import { fillPlaceholders, type PartnerInfo } from '@/content/coffee/personalize';
import type { Scene } from '@/content/coffee/types';
import { chapterStatus, type ArcState } from './arcs';
import { fillBill, type LandlordBill } from './landlord';
import type { Encounter } from './director';
import type { FeedEntry } from './store/types';

export const BELMONT_ID = belmont.id;

export type LandlordContext = {
  arcs: Record<string, ArcState>;
  recentScenes: string[];
  bill: LandlordBill;
  partner: PartnerInfo | null;
  bookedByMe: boolean | null;
  feed: FeedEntry[];
  userId: string;
  now: Date;
};

// {booker}: "you" (fui eu) ou o nome da outra pessoa. Antes da resposta do capítulo 1, a outra pessoa.
function fillBooker(text: string, bookedByMe: boolean | null, partner: PartnerInfo | null) {
  const name = partner?.name ?? 'your partner';
  const me = bookedByMe === true;
  return text
    .replace(/\{Booker\}/g, me ? 'You' : name)
    .replace(/\{booker\}/g, me ? 'you' : name)
    .replace(/\{Booker_pt\}/g, me ? 'Você' : name)
    .replace(/\{booker_pt\}/g, me ? 'você' : name);
}

// Cópia da cena com os textos personalizados (outra pessoa, quem reservou, números da conta).
export function personalizeBelmont<T extends Scene>(scene: T, ctx: Pick<LandlordContext, 'bill' | 'partner' | 'bookedByMe'>): T {
  const partner = ctx.partner ?? { name: 'your partner', pronoun: 'she' as const };
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return fillBill(fillBooker(fillPlaceholders(v, partner), ctx.bookedByMe, ctx.partner), ctx.bill);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(scene) as T;
}

// "Eu vejo tudo": pergunta sobre um cliente recorrente com quem você conversou nos últimos dois dias.
export function memoryScene(ctx: Pick<LandlordContext, 'feed' | 'userId' | 'now'>, rng: () => number = Math.random): Scene | null {
  const since = ctx.now.getTime() - 2 * 86_400_000;
  const talked = ctx.feed
    .filter((e) => e.user_id === ctx.userId && (e.kind === 'served' || e.kind === 'chapter') && new Date(e.created_at).getTime() >= since)
    .map((e) => (e.data as { character?: string | null }).character)
    .filter((c): c is string => !!c && !!CHARACTER_BY_ID[c]);
  if (talked.length === 0) return null;
  const answer = CHARACTER_BY_ID[talked[0]].name;
  const others = Object.values(CHARACTER_BY_ID)
    .map((c) => c.name)
    .filter((n) => !talked.some((t) => CHARACTER_BY_ID[t].name === n))
    .sort(() => rng() - 0.5)
    .slice(0, 2);
  if (others.length < 2) return null;
  return {
    id: 'belmont-memory',
    kind: 'regular',
    theme: 'life',
    level: 'B1',
    long: true,
    steps: [
      {
        say: "I watch everything, you know. Through the windows, mostly. You talked to one of my tenants since my last visit.",
        pt: 'Eu vejo tudo, sabia? Pelas janelas, principalmente. Você conversou com um dos meus inquilinos desde a minha última visita.',
        mood: 'thinking',
        speaker: 'Belmont',
      },
      {
        activity: {
          id: 'memory',
          type: 'comprehension',
          items: ['g:aux_do', 'g:past_simple'],
          question: 'Who did you talk to recently?',
          options: [answer, ...others],
          answer: 0,
        },
      },
    ],
  };
}

const leastRecent = (list: Scene[], recent: string[]) =>
  [...list].sort((a, b) => {
    const ia = recent.indexOf(a.id);
    const ib = recent.indexOf(b.id);
    return (ib < 0 ? 1000 : ib) - (ia < 0 ? 1000 : ia);
  })[0];

export function planLandlordVisit(ctx: LandlordContext, rng: () => number = Math.random): Encounter {
  const st = chapterStatus(belmont, ctx.arcs[belmont.id], ctx.now);
  // a primeira visita é sempre o capítulo 1 (que já inclui o primeiro pagamento)
  const chapter = st.state === 'available' ? st.chapter : null;
  const main = chapter ?? leastRecent(belmont.regulars, ctx.recentScenes);
  const scenes: Scene[] = [main];
  if (!ctx.bill.first) {
    const memory = memoryScene(ctx, rng);
    if (memory) scenes.push(memory);
    scenes.push(leastRecent(BELMONT_BILLS, ctx.recentScenes));
  }
  return {
    kind: 'landlord',
    characterId: belmont.id,
    chapterId: chapter?.id ?? null,
    scenes: scenes.map((s) => personalizeBelmont(s, ctx)),
  };
}

// Desconto da negociação: a atividade `negotiate` certa de primeira (sem erro nem dica) vale 5.
export function negotiationDiscount(results: { activityId: string; mistakes: number; hints: number; revealed: boolean }[]) {
  const r = results.find((x) => x.activityId === 'negotiate');
  return r && r.mistakes === 0 && r.hints === 0 && !r.revealed ? 5 : 0;
}
