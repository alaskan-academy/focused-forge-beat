import { useEffect, useRef, useState } from 'react';
import { PATTERNS, PATTERN_BY_ID, PATTERN_CHUNK_BY_ID, TIER_INFO } from '@/content/coffee/patterns';
import { nextPattern, patternMastery, unlockedCount } from '@/lib/coffee/lakePatterns';
import { MAX_BOX, type VocabState } from '@/lib/coffee/srs';
import { QuizWhy } from './LessonBits';
import { Volume2, X } from 'lucide-react';
import { ITEMS } from '@/content/coffee';
import { FISH, RARITY_INFO, type AlbumRow, type CatchResult, type Fish } from '@/lib/coffee/fishing';
import { CROPS, CROP_BY_ID } from '@/lib/coffee/garden';
import type { WaterQuiz } from '@/lib/coffee/gardenWords';
import { canSpeak, speak } from '@/lib/coffee/speech';
import Pron from './Pron';

function Shell({ title, sub, onClose, children, wide }: { title: React.ReactNode; sub?: React.ReactNode; onClose?: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-3" onClick={onClose}>
      <div className={`cc-panel relative flex max-h-[94%] w-full flex-col overflow-hidden ${wide ? 'max-w-2xl' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between gap-2 border-b-2 border-[#e6d2ad] px-4 py-3">
          <div>
            <h2 className="cc-title text-xl">{title}</h2>
            {sub && <p className="text-xs opacity-70">{sub}</p>}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#efe0c4]" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

const RARITY_TO_TIER = { common: 'basic', uncommon: 'negq', rare: 'past', legendary: 'say', junk: 'basic' } as const;

const RarityTag = ({ f }: { f: Fish }) => (
  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: RARITY_INFO[f.rarity].color }}>
    {RARITY_INFO[f.rarity].pt}
    {f.night ? ' · 🌙' : ''}
  </span>
);

// Peixe fisgado: responda antes do tempo acabar para puxar.
export function FishQuizPanel({ fish, quiz, onDone }: { fish: Fish; quiz: WaterQuiz; onDone: (success: boolean) => void }) {
  // perguntas com frases inteiras ("o que você diria") pedem mais tempo de leitura
  const total = RARITY_INFO[fish.rarity].seconds + (quiz.type === 'pick' ? 6 : 0);
  const [left, setLeft] = useState(total);
  const [picked, setPicked] = useState<number | null>(null);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finish = (ok: boolean) => {
    if (done.current) return;
    done.current = true;
    window.setTimeout(() => onDoneRef.current(ok), ok ? 500 : 1400);
  };
  useEffect(() => {
    if (quiz.type === 'listen' && quiz.speak) speak(quiz.speak);
    const t = window.setInterval(() => setLeft((l) => Math.max(0, l - 0.1)), 100);
    return () => window.clearInterval(t);
  }, [quiz]);
  // tempo esgotado: o peixe escapa
  const timedOut = left <= 0 && picked === null;
  useEffect(() => {
    if (!timedOut || done.current) return;
    done.current = true;
    setPicked(-1);
    window.setTimeout(() => onDoneRef.current(false), 1400);
  }, [timedOut]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-2 sm:p-3">
      <div className="cc-panel w-full max-w-md p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between gap-2">
          <div className="cc-title text-lg">🎣 Puxa!{quiz.type === 'pick' ? '' : ` ${quiz.prompt}`}</div>
          <RarityTag f={fish} />
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e6d2ad]">
          <div className="h-full transition-[width] duration-100" style={{ width: `${(left / total) * 100}%`, background: left < 3 ? '#c4554d' : '#6aa36f' }} />
        </div>
        {quiz.type === 'pick' && <div className="mt-2 text-sm font-semibold">{quiz.prompt}</div>}
        <div className="mt-2 flex items-center gap-2">
          {quiz.shown && <div className="cc-title text-lg">{quiz.shown}</div>}
          {quiz.speak && canSpeak() && (
            <button type="button" onClick={() => speak(quiz.speak!)} className="rounded-full bg-[#efe0c4] p-1.5" aria-label="Ouvir">
              <Volume2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-2 grid gap-1.5">
          {quiz.options.map((o, i) => {
            const tone = picked === null ? 'border-[#e6d2ad] bg-[#fffaf0] hover:border-[#5bb0c4]' : i === quiz.answer ? 'border-[#6aa36f] bg-[#e3f1e4]' : i === picked ? 'border-[#c4554d] bg-[#fbe3e3]' : 'border-[#e6d2ad] opacity-50';
            return (
              <button
                key={o}
                type="button"
                disabled={picked !== null}
                onClick={() => {
                  setPicked(i);
                  finish(i === quiz.answer);
                }}
                className={`rounded-xl border-2 px-3 py-2 text-left text-sm ${tone}`}
              >
                {o}
              </button>
            );
          })}
        </div>
        {picked === -1 && <p className="mt-2 text-sm font-semibold text-[#c4554d]">⏰ O tempo acabou… o peixe escapou!</p>}
      </div>
    </div>
  );
}

type ResultProps = {
  fish: Fish;
  success: boolean;
  result: CatchResult | null;
  itemId: string | null;
  chunkId: string | null;
  quiz: WaterQuiz | null;
  canCastAgain: boolean;
  canFeed: boolean;
  onAgain: () => void;
  onFeed: () => void;
  onClose: () => void;
};

export function CatchResultPanel(p: ResultProps) {
  const word = p.itemId && !PATTERN_BY_ID[p.itemId] ? ITEMS[p.itemId] : null;
  const family = p.itemId ? PATTERN_BY_ID[p.itemId] : null;
  const chunk = p.chunkId ? PATTERN_CHUNK_BY_ID[p.chunkId] : null;
  const caught = p.success || p.fish.rarity === 'junk';
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-2 sm:p-3">
      <div className="cc-panel w-full max-w-md p-4 text-center animate-in fade-in zoom-in-95 duration-300">
        {caught ? (
          <>
            <div className="text-5xl">{p.fish.emoji}</div>
            {p.result?.first && <div className="mt-1 inline-block rounded-full bg-[#f2cc8f] px-3 py-0.5 text-xs font-bold">✨ First catch! Novo no álbum</div>}
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="cc-title text-2xl">{p.fish.rarity === 'junk' ? `Oops… a ${p.fish.en}!` : `You caught a ${p.fish.en}!`}</span>
              <Pron text={p.fish.en} />
            </div>
            <div className="mt-0.5 flex items-center justify-center gap-2 text-sm opacity-75">
              {p.fish.pt} <RarityTag f={p.fish} />
            </div>
            <div className="mt-2 text-sm">
              {p.result && p.result.coins > 0 && <b>+{p.result.coins} 🪙 · </b>}
              {p.result && `você já pegou ${p.result.count}`}
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl">💨</div>
            <div className="cc-title text-xl">It got away!</div>
            <div className="text-sm opacity-75">
              Era um(a) <b>{p.fish.en}</b> ({p.fish.pt}). Resposta certa: <b>{p.quiz ? p.quiz.options[p.quiz.answer] : ''}</b>
            </div>
          </>
        )}
        {family && p.quiz && p.fish.rarity !== 'junk' && (
          <div className="mt-3 rounded-xl border-2 border-dashed border-[#d4bf9a] px-3 py-2 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-60">Padrão deste peixe · {TIER_INFO[RARITY_TO_TIER[p.fish.rarity]].pt}</div>
            <div className="cc-title text-lg">{family.name}</div>
            <QuizWhy quiz={p.quiz} />
          </div>
        )}
        {chunk && caught && (
          <div className="mt-2 rounded-xl bg-[#f2cc8f]/40 px-3 py-2 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-60">🎁 Chunk novo (entrou na revisão)</div>
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="cc-title text-lg">{chunk.en}</span>
              <Pron text={chunk.en} showIpa={false} />
            </div>
            <div className="text-sm opacity-75">{chunk.pt}</div>
            <div className="mt-0.5 text-xs italic opacity-70">“{chunk.example}”</div>
          </div>
        )}
        {word && p.fish.rarity !== 'junk' && (
          <div className="mt-3 rounded-xl border-2 border-dashed border-[#d4bf9a] px-3 py-2 text-left">
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-60">Palavra deste peixe {caught ? '(entrou na revisão)' : ''}</div>
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="cc-title text-lg">{word.en}</span>
              <Pron text={word.en ?? word.label} />
            </div>
            <div className="text-sm opacity-75">{word.pt}</div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {p.canCastAgain && (
            <button type="button" onClick={p.onAgain} className="cc-btn">
              🎣 Lançar de novo
            </button>
          )}
          {p.canFeed && (
            <button type="button" onClick={p.onFeed} className="cc-btn-ghost">
              🐈‍⬛ Dar para a Mucego Frutífero
            </button>
          )}
          <button type="button" onClick={p.onClose} className="cc-btn-ghost">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// Álbum de peixes do café (compartilhado): silhueta até alguém pegar.
export function FishAlbum({ album, names, states, now, onClose }: { album: AlbumRow[]; names: (userId: string | null) => string; states: Record<string, VocabState>; now: Date; onClose: () => void }) {
  const byId = new Map(album.map((a) => [a.fish_id, a]));
  const caught = FISH.filter((f) => byId.has(f.id)).length;
  const [tab, setTab] = useState<'fish' | 'patterns'>('fish');
  const open = unlockedCount(now);
  return (
    <Shell title="📖 Fish album" sub={tab === 'fish' ? `Álbum de peixes de vocês · ${caught}/${FISH.length} espécies` : `Padrões do dia a dia · ${open}/${PATTERNS.length} liberados`} onClose={onClose} wide>
      <div className="mb-3 flex gap-1.5">
        <button type="button" onClick={() => setTab('fish')} className={`cc-chip ${tab === 'fish' ? 'cc-chip-on' : ''}`}>
          🐟 Peixes
        </button>
        <button type="button" onClick={() => setTab('patterns')} className={`cc-chip ${tab === 'patterns' ? 'cc-chip-on' : ''}`}>
          🧠 Padrões
        </button>
      </div>
      {tab === 'patterns' ? (
        <PatternList states={states} now={now} />
      ) : (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FISH.map((f) => {
          const row = byId.get(f.id);
          return (
            <div key={f.id} className={`rounded-xl border-2 p-2 ${row ? 'border-[#e6d2ad] bg-[#fffaf0]' : 'border-dashed border-[#d4bf9a] bg-[#f6ead3]'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-3xl ${row ? 'cc-swim' : 'opacity-30 grayscale'}`}>{row ? f.emoji : '🐟'}</span>
                <RarityTag f={f} />
              </div>
              {row ? (
                <>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="cc-title text-sm">{f.en}</span> <Pron text={f.en} showIpa={false} />
                  </div>
                  <div className="text-[11px] opacity-70">{f.pt}</div>
                  <div className="mt-1 text-[11px]">
                    1º: <b>{names(row.first_by)}</b> ·{' '}
                    {Object.entries(row.counts)
                      .map(([u, n]) => `${names(u)} ×${n}`)
                      .join(' · ')}
                  </div>
                </>
              ) : (
                <div className="mt-1 text-sm font-semibold opacity-50">???{f.night ? ' (só à noite)' : ''}</div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </Shell>
  );
}

// Padrões do lago: o que já foi liberado, quanto você domina e os chunks pescados de cada um.
function PatternList({ states, now }: { states: Record<string, VocabState>; now: Date }) {
  const open = unlockedCount(now);
  const next = nextPattern(now);
  const days = next ? Math.max(1, Math.ceil((next.at.getTime() - now.getTime()) / 86_400_000)) : 0;
  return (
    <div className="space-y-2">
      <p className="text-xs opacity-70">Cada peixe treina um destes padrões: comum = forma básica · incomum = negativa e pergunta · raro = passado · lendário = o que você diria.</p>
      {PATTERNS.map((p, i) => {
        if (i >= open)
          return (
            <div key={p.id} className="rounded-xl border-2 border-dashed border-[#d4bf9a] bg-[#f6ead3] px-3 py-2 text-sm opacity-70">
              🔒 {i === open && next ? `${p.name} · libera em ${days} dia${days > 1 ? 's' : ''}` : 'Em breve'}
            </div>
          );
        const m = patternMastery(p, states);
        return (
          <div key={p.id} className="rounded-xl border-2 border-[#e6d2ad] bg-[#fffaf0] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="cc-title text-base">{p.name}</span>
              <span className="text-[11px] opacity-70">{m.seen ? `domínio ${m.box}/${MAX_BOX}` : 'ainda não pescado'}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e6d2ad]">
              <div className="h-full bg-[#6aa36f]" style={{ width: `${(m.box / MAX_BOX) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs leading-snug opacity-80">{p.pt}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {p.forms.map((f) => (
                <span key={f} className="rounded bg-[#efe0c4] px-1.5 py-0.5 text-[11px]">
                  {f}
                </span>
              ))}
            </div>
            <div className="mt-1.5 space-y-0.5 text-xs">
              {p.chunks.map((c) =>
                states[c.id] ? (
                  <div key={c.id} className="flex flex-wrap items-center gap-x-1">
                    🎁 <b>{c.en}</b> <span className="opacity-70">— {c.pt}</span> <Pron text={c.en} showIpa={false} />
                  </div>
                ) : (
                  <div key={c.id} className="opacity-50">🎁 ??? (chunk ainda não pescado)</div>
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Iscas: lançamentos grátis do dia, comprar e fazer isca com ingredientes da horta.
export function BaitPanel({
  freeLeft,
  bait,
  lucky,
  coins,
  pantry,
  onBuy,
  onPantry,
  onClose,
}: {
  freeLeft: number;
  bait: number;
  lucky: number;
  coins: number;
  pantry: Record<string, number>;
  onBuy: (qty: number) => Promise<void>;
  onPantry: (cropId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const have = CROPS.filter((c) => (pantry[c.id] ?? 0) > 0);
  const GAIN = { herb: '+1 isca', veg: '+3 iscas', fruit: '+3 iscas e 3 de sorte 🍀', golden: '+5 iscas e 5 de sorte 🍀' } as const;
  return (
    <Shell title="🪱 Iscas" sub="10 lançamentos grátis por dia · depois, uma isca por lançamento" onClose={onClose}>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl bg-[#efe0c4] p-2">
          <div className="text-xl font-bold">{freeLeft}</div>grátis hoje
        </div>
        <div className="rounded-xl bg-[#efe0c4] p-2">
          <div className="text-xl font-bold">{bait}</div>iscas
        </div>
        <div className="rounded-xl bg-[#efe0c4] p-2" title="Lançamentos com mais chance de peixe raro">
          <div className="text-xl font-bold">{lucky}</div>de sorte 🍀
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 5, 10].map((n) => (
          <button key={n} type="button" disabled={busy || coins < 2 * n} onClick={() => run(() => onBuy(n))} className="cc-btn !px-3 !py-1 text-sm disabled:opacity-50">
            Comprar {n} · {2 * n} 🪙
          </button>
        ))}
      </div>
      <div className="mt-4 text-xs font-bold uppercase tracking-wide opacity-60">Isca da horta (despensa)</div>
      {have.length === 0 ? (
        <p className="mt-1 text-sm opacity-70">Colha plantas na horta: legumes e frutas viram iscas (frutas dão sorte!).</p>
      ) : (
        <div className="mt-1.5 space-y-1.5">
          {have.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy}
              onClick={() => run(() => onPantry(c.id))}
              className="flex w-full items-center justify-between rounded-xl border-2 border-[#e6d2ad] bg-[#fffaf0] px-3 py-1.5 text-left text-sm hover:border-[#e07a5f]"
            >
              <span>
                {CROP_BY_ID[c.id].emoji} {c.en} ×{pantry[c.id]}
              </span>
              <span className="text-xs opacity-70">{GAIN[c.kind]}</span>
            </button>
          ))}
        </div>
      )}
    </Shell>
  );
}

