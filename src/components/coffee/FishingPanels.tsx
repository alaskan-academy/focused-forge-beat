import { useEffect, useRef, useState } from 'react';
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

const RarityTag = ({ f }: { f: Fish }) => (
  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: RARITY_INFO[f.rarity].color }}>
    {RARITY_INFO[f.rarity].pt}
    {f.night ? ' · 🌙' : ''}
  </span>
);

// Peixe fisgado: responda antes do tempo acabar para puxar.
export function FishQuizPanel({ fish, quiz, onDone }: { fish: Fish; quiz: WaterQuiz; onDone: (success: boolean) => void }) {
  const total = RARITY_INFO[fish.rarity].seconds;
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
          <div className="cc-title text-lg">🎣 Puxa! {quiz.prompt}</div>
          <RarityTag f={fish} />
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e6d2ad]">
          <div className="h-full transition-[width] duration-100" style={{ width: `${(left / total) * 100}%`, background: left < 3 ? '#c4554d' : '#6aa36f' }} />
        </div>
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
  quiz: WaterQuiz | null;
  canCastAgain: boolean;
  canFeed: boolean;
  onAgain: () => void;
  onFeed: () => void;
  onClose: () => void;
};

export function CatchResultPanel(p: ResultProps) {
  const word = p.itemId ? ITEMS[p.itemId] : null;
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
export function FishAlbum({ album, names, onClose }: { album: AlbumRow[]; names: (userId: string | null) => string; onClose: () => void }) {
  const byId = new Map(album.map((a) => [a.fish_id, a]));
  const caught = FISH.filter((f) => byId.has(f.id)).length;
  return (
    <Shell title="📖 Fish album" sub={`Álbum de peixes de vocês · ${caught}/${FISH.length} espécies`} onClose={onClose} wide>
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
    </Shell>
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

