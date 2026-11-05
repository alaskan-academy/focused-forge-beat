import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Languages, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ITEMS } from '@/content/coffee';
import { MOOD_EMOJI, isLine, type Line, type Mood } from '@/content/coffee/types';
import { HINT_LINE_COST, HINT_WORD_COST, WALKOUT_MISTAKES, gapMode, type ActivityResult } from '@/lib/coffee/activities';
import type { Encounter } from '@/lib/coffee/director';
import type { Appearance } from '@/lib/coffee/character';
import type { VocabState } from '@/lib/coffee/srs';
import CharacterPreview from './CharacterPreview';
import ActivityCard, { type CardOutcome } from './activities/ActivityCard';

export type EncounterSummary = {
  stars: 1 | 2 | 3;
  coins: number;
  tip: number;
  walkout: boolean;
  mistakes: number;
  xp: number;
  heartsDelta: number | null;
  hearts: number | null;
  newUnlocks: string[];
  items: string[];
  chapterTitle: string | null;
};

type Props = {
  encounter: Encounter;
  name: string;
  look: Appearance;
  states: Record<string, VocabState>;
  coins: number;
  onSpend: (cost: number) => Promise<boolean>;
  onCancel: () => void;
  onComplete: (results: ActivityResult[], durationMs: number) => Promise<EncounterSummary>;
  onClose: () => void;
};

type Entry = { key: string; who: 'customer' | 'player'; text: string; pt?: string; mood?: Mood; speaker?: string };

// Expressões de vocabulário (mais longas primeiro) para destacar nas falas.
const VOCAB_PHRASES = Object.values(ITEMS)
  .filter((i) => (i.kind === 'vocab' || i.kind === 'chunk') && i.en)
  .sort((a, b) => b.en!.length - a.en!.length);

export default function DialogueOverlay({ encounter, name, look, states, coins, onSpend, onCancel, onComplete, onClose }: Props) {
  const steps = useMemo(() => encounter.scenes.flatMap((s) => s.steps), [encounter]);
  const phone = encounter.scenes.some((s) => s.channel === 'phone');
  const chapter = encounter.scenes.find((s) => s.kind === 'chapter') as { title_pt?: string } | undefined;

  const [idx, setIdx] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [results, setResults] = useState<ActivityResult[]>([]);
  const [activityDone, setActivityDone] = useState(false);
  const [summary, setSummary] = useState<EncounterSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [revealedPt, setRevealedPt] = useState<Set<string>>(new Set());
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const pendingHints = useRef(0);
  const appended = useRef(new Set<number>());
  const started = useRef(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);

  const mistakesSoFar = results.reduce((n, r) => n + r.mistakes, 0);
  const mood: Mood = [...entries].reverse().find((e) => e.who === 'customer')?.mood ?? 'neutral';
  const step = steps[idx];
  const finished = idx >= steps.length;

  const push = (e: Omit<Entry, 'key'>) => setEntries((cur) => [...cur, { ...e, key: `${cur.length}-${e.text.slice(0, 12)}` }]);

  // fala do cliente entra na conversa quando chega a vez dela; lembrança também é uma fala
  useEffect(() => {
    if (!step || appended.current.has(idx)) return;
    appended.current.add(idx);
    if (isLine(step)) push({ who: 'customer', text: step.say, pt: step.pt, mood: step.mood, speaker: step.speaker });
    else if (step.activity.type === 'recall') push({ who: 'customer', text: step.activity.question, mood: 'thinking' });
  }, [idx, step]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries, activityDone, idx]);

  // terminou todas as falas e atividades: grava e mostra o resumo
  useEffect(() => {
    if (!finished || summary || saving) return;
    setSaving(true);
    onComplete(results, Date.now() - started.current)
      .then(setSummary)
      .finally(() => setSaving(false));
  }, [finished, summary, saving, results, onComplete]);

  const next = () => {
    setActivityDone(false);
    setIdx((i) => i + 1);
  };

  const onDone = (o: CardOutcome) => {
    if (!step || isLine(step)) return;
    setResults((r) => [...r, { activityId: step.activity.id, mistakes: o.mistakes, hints: o.hints + pendingHints.current, revealed: o.revealed, hearts: o.hearts }]);
    pendingHints.current = 0;
    if (o.customerLine) push({ who: 'customer', text: o.customerLine, mood });
    if (o.utterance) push({ who: 'player', text: o.utterance });
    setActivityDone(true);
  };

  const onReaction = (line: Line) => push({ who: 'customer', text: line.say, pt: line.pt, mood: line.mood, speaker: line.speaker });

  const spend = async (cost: number) => {
    const ok = await onSpend(cost);
    if (ok) pendingHints.current += 1;
    return ok;
  };

  // dica de atividade: o próprio cartão conta a dica, então não soma em pendingHints
  const spendForCard = (cost: number) => onSpend(cost);

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-[#24170f]/55 p-2 sm:items-center sm:p-4">
      <div className="cc-panel flex max-h-[94%] w-full max-w-lg flex-col overflow-hidden">
        {/* cabeçalho */}
        <div className="flex items-center gap-3 border-b-2 border-[#e6d2ad] bg-[#f6ead3] px-3 py-2">
          <div className="relative flex h-16 w-14 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-[#e9d5b5]">
            {phone ? <Phone className="mb-4 h-7 w-7 text-[#7d4f33]" /> : <CharacterPreview appearance={look} scale={3} animate={false} />}
            <span className="absolute -right-0.5 -top-0.5 text-lg" aria-label={mood}>
              {MOOD_EMOJI[mood]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="cc-title truncate text-lg leading-tight">{phone ? 'Pedido por telefone' : name}</div>
            <div className="truncate text-xs opacity-70">
              {chapter?.title_pt ? `📖 ${chapter.title_pt}` : phone ? 'Só texto, sem imagens de apoio' : encounter.kind === 'order' ? 'Pedido' : 'Conversa'}
              <span className="ml-2">🪙 {coins}</span>
              {mistakesSoFar > 0 && (
                <span className={cn('ml-2 font-semibold', mistakesSoFar >= WALKOUT_MISTAKES - 1 && 'text-[#c4554d]')} title="Com 3 erros o cliente vai embora sem pagar">
                  ❌ {mistakesSoFar}/{WALKOUT_MISTAKES}
                </span>
              )}
            </div>
          </div>
          {!summary && (
            <button type="button" onClick={onCancel} className="rounded-lg p-1.5 hover:bg-[#e9d5b5]" aria-label="Sair">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* conversa */}
        <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-[#fbf3e4] px-3 py-3">
          {entries.map((e) => (
            <Bubble
              key={e.key}
              entry={e}
              showPt={revealedPt.has(e.key)}
              revealedWords={revealedWords}
              onTranslate={async () => {
                if (await spend(HINT_LINE_COST)) setRevealedPt(new Set(revealedPt).add(e.key));
              }}
              onWord={async (phrase) => {
                if (revealedWords.has(phrase)) return;
                if (await spend(HINT_WORD_COST)) setRevealedWords(new Set(revealedWords).add(phrase));
              }}
            />
          ))}

          {!finished && step && !isLine(step) && (
            <ActivityCard
              key={idx}
              activity={step.activity}
              gapMode={step.activity.type === 'gap' ? gapMode(step.activity, states) : 'options'}
              onHint={spendForCard}
              onReaction={onReaction}
              onDone={onDone}
            />
          )}

          {summary && <Summary s={summary} name={name} />}
          {finished && !summary && <div className="py-4 text-center text-sm opacity-60">Guardando…</div>}
        </div>

        {/* rodapé */}
        <div className="border-t-2 border-[#e6d2ad] bg-[#f6ead3] p-2">
          {summary ? (
            <button type="button" className="cc-btn w-full" onClick={onClose}>
              Voltar ao café
            </button>
          ) : !finished && step && (isLine(step) || activityDone) ? (
            <button type="button" className="cc-btn flex w-full items-center justify-center gap-1" onClick={next}>
              Continuar <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="py-1.5 text-center text-xs opacity-60">{finished ? '' : 'Responda para continuar'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({
  entry: e,
  showPt,
  revealedWords,
  onTranslate,
  onWord,
}: {
  entry: Entry;
  showPt: boolean;
  revealedWords: Set<string>;
  onTranslate: () => void;
  onWord: (phrase: string) => void;
}) {
  if (e.who === 'player')
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#81b29a] px-3 py-2 text-sm font-medium text-white shadow-sm">{e.text}</div>
      </div>
    );
  return (
    <div className="flex flex-col items-start">
      {e.speaker && <span className="mb-0.5 ml-1 text-[11px] font-semibold opacity-60">{e.speaker}</span>}
      <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[15px] leading-snug shadow-sm">
        <HintedText text={e.text} revealed={revealedWords} onWord={onWord} />
        {showPt && e.pt && <div className="mt-1 border-t border-dashed border-[#e6d2ad] pt-1 text-xs italic text-[#7d4f33]">{e.pt}</div>}
      </div>
      {e.pt && !showPt && (
        <button type="button" onClick={onTranslate} className="ml-1 mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#7d4f33]/70 hover:text-[#7d4f33]">
          <Languages className="h-3 w-3" /> traduzir · {HINT_LINE_COST}🪙
        </button>
      )}
    </div>
  );
}

// Destaca expressões do vocabulário; tocar revela a tradução (dica paga).
function HintedText({ text, revealed, onWord }: { text: string; revealed: Set<string>; onWord: (p: string) => void }) {
  const parts = useMemo(() => {
    const lower = text.toLowerCase();
    const taken: { start: number; end: number; id: string }[] = [];
    for (const item of VOCAB_PHRASES) {
      const en = item.en!.toLowerCase();
      let from = 0;
      while (true) {
        const i = lower.indexOf(en, from);
        if (i < 0) break;
        const before = i === 0 ? ' ' : lower[i - 1];
        const after = lower[i + en.length] ?? ' ';
        const boundary = !/[a-z']/.test(before) && !/[a-z]/.test(after);
        if (boundary && !taken.some((t) => i < t.end && i + en.length > t.start)) taken.push({ start: i, end: i + en.length, id: item.id });
        from = i + en.length;
      }
    }
    taken.sort((a, b) => a.start - b.start);
    const out: { text: string; id?: string }[] = [];
    let pos = 0;
    for (const t of taken) {
      if (t.start > pos) out.push({ text: text.slice(pos, t.start) });
      out.push({ text: text.slice(t.start, t.end), id: t.id });
      pos = t.end;
    }
    if (pos < text.length) out.push({ text: text.slice(pos) });
    return out;
  }, [text]);

  return (
    <span>
      {parts.map((p, i) =>
        p.id ? (
          <button
            key={i}
            type="button"
            onClick={() => onWord(p.id!)}
            className={cn('cursor-help border-b border-dotted border-[#b8573f]/60', revealed.has(p.id) && 'border-solid')}
            title={revealed.has(p.id) ? ITEMS[p.id].pt : `ver tradução · ${HINT_WORD_COST}🪙`}
          >
            {p.text}
            {revealed.has(p.id) && <span className="ml-1 rounded bg-[#f2cc8f]/60 px-1 text-[11px] text-[#5e4433]">{ITEMS[p.id].pt}</span>}
          </button>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  );
}

const UNLOCK_LABEL: Record<string, string> = { gift: '🎁 Presente para o café', photo: '📷 Foto no caderninho' };

function Summary({ s, name }: { s: EncounterSummary; name: string }) {
  return (
    <div className="cc-card animate-in zoom-in-95 fade-in text-center duration-300">
      <div className="text-3xl tracking-widest">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn('inline-block transition-transform', i <= s.stars ? 'scale-100' : 'opacity-25 grayscale')}>
            ⭐
          </span>
        ))}
      </div>
      {s.walkout ? (
        <div className="mt-2 rounded-lg bg-[#e07a5f]/20 px-3 py-2 text-sm font-semibold text-[#8a3a26]">
          😤 {s.mistakes} erros: o cliente foi embora sem pagar.
        </div>
      ) : (
        <div className="mt-1 text-xs opacity-70">
          {s.tip > 0 ? `inclui ${s.tip} 🪙 de gorjeta` : 'sem gorjeta desta vez'}
          {s.mistakes > 0 && ` (−3 de gorjeta por erro)`}
        </div>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm font-semibold">
        <span>+{s.coins} 🪙</span>
        <span>+{s.xp} XP</span>
        {s.heartsDelta !== null && (
          <span>
            {s.heartsDelta >= 0 ? '+' : ''}
            {s.heartsDelta} 💛 ({s.hearts}/10 com {name})
          </span>
        )}
      </div>
      {s.chapterTitle && <div className="mt-1 text-xs opacity-70">Capítulo “{s.chapterTitle}” anotado no caderninho 📓</div>}
      {s.newUnlocks.map((u) => (
        <div key={u} className="mt-2 rounded-lg bg-[#f2cc8f]/50 px-2 py-1 text-sm font-semibold">
          Desbloqueado: {UNLOCK_LABEL[u] ?? u}
        </div>
      ))}
      {s.items.length > 0 && (
        <div className="mt-3 text-left text-xs">
          <div className="mb-1 font-semibold opacity-70">Você treinou:</div>
          <div className="flex flex-wrap gap-1">
            {s.items.map((id) => (
              <span key={id} className="rounded-full bg-[#efe0c4] px-2 py-0.5">
                {ITEMS[id]?.label ?? id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
