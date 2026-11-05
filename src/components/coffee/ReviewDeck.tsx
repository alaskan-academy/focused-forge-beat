import { useMemo, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ITEMS, ITEM_EXAMPLES, type LearnItem } from '@/content/coffee';
import { CHUNK_BY_ID } from '@/content/coffee/chunks';
import { dueItems } from '@/lib/coffee/review';
import type { Grade, VocabState } from '@/lib/coffee/srs';

export const REVIEW_SESSION = 20;

type Mode = 'en-pt' | 'pt-en';

type Props = {
  states: Record<string, VocabState>;
  now: Date;
  onGrade: (itemId: string, grade: Grade) => Promise<void>;
  onClose: () => void;
};

// Revisão em cards (estilo Anki) com os itens do SRS: vocabulário, chunks e gramática.
export default function ReviewDeck({ states, now, onGrade, onClose }: Props) {
  const due = useMemo(() => dueItems(states, now), [states, now]);
  const [queue, setQueue] = useState<string[] | null>(due.length ? due.slice(0, REVIEW_SESSION) : null);
  const [mode, setMode] = useState<Mode>('en-pt');
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ good: 0, ok: 0, fail: 0 });
  const [busy, setBusy] = useState(false);

  const practice = () => {
    // nada vencido: pratica os itens menos dominados
    const weakest = Object.values(states)
      .filter((s) => ITEMS[s.item_id])
      .sort((a, b) => a.box - b.box || a.last_seen_at.localeCompare(b.last_seen_at))
      .slice(0, 10)
      .map((s) => s.item_id);
    setQueue(weakest);
  };

  const current = queue?.[0] ? ITEMS[queue[0]] : null;
  const total = stats.good + stats.ok + stats.fail;

  const grade = async (g: Grade) => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await onGrade(current.id, g);
      setStats((s) => ({ ...s, [g]: s[g] + 1 }));
      setFlipped(false);
      // errou: o card volta no fim desta sessão
      setQueue((q) => (q ? [...q.slice(1), ...(g === 'fail' ? [q[0]] : [])] : q));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-2 sm:p-4" onClick={onClose}>
      <div className="cc-panel flex max-h-[94%] w-full max-w-md flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-[#e6d2ad] bg-[#f6ead3] px-4 py-2">
          <h2 className="cc-title text-xl">🃏 Revisão</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#e9d5b5]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#f6ead3] px-3 pb-2 text-xs">
          {(
            [
              ['en-pt', 'Inglês → português (reconhecer)'],
              ['pt-en', 'Português → inglês (lembrar)'],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button key={m} type="button" onClick={() => (setMode(m), setFlipped(false))} className={cn('cc-chip', mode === m && 'cc-chip-on')}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-[#fbf3e4] p-4">
          {queue === null ? (
            <div className="py-6 text-center">
              <div className="cc-title text-lg">Tudo em dia! ✨</div>
              <p className="mt-1 text-sm opacity-75">Nenhum item vencido agora. As palavras voltam sozinhas na hora certa.</p>
              {Object.keys(states).length > 0 && (
                <button type="button" className="cc-btn-ghost mt-4" onClick={practice}>
                  Praticar os mais difíceis mesmo assim
                </button>
              )}
            </div>
          ) : current ? (
            <>
              <div className="mb-2 flex justify-between text-xs opacity-60">
                <span>{KIND_LABEL[current.kind]}</span>
                <span>
                  {total} feitos · {queue.length} restando
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-2xl border-2 border-[#e6d2ad] bg-white p-5 text-center shadow-sm transition-transform active:scale-[0.99]"
              >
                <Front item={current} mode={mode} />
                {flipped ? (
                  <div className="mt-4 w-full border-t-2 border-dashed border-[#e6d2ad] pt-3 animate-in fade-in duration-200">
                    <Back item={current} mode={mode} />
                  </div>
                ) : (
                  <div className="mt-4 text-xs opacity-50">Tente responder em voz alta, depois toque para virar</div>
                )}
              </button>
              {flipped && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" disabled={busy} onClick={() => grade('fail')} className="rounded-xl bg-[#f6d5cb] px-2 py-2.5 text-sm font-semibold text-[#8a3a26]">
                    Errei
                  </button>
                  <button type="button" disabled={busy} onClick={() => grade('ok')} className="rounded-xl bg-[#f2cc8f]/70 px-2 py-2.5 text-sm font-semibold text-[#5e4433]">
                    Difícil
                  </button>
                  <button type="button" disabled={busy} onClick={() => grade('good')} className="rounded-xl bg-[#cfe6d9] px-2 py-2.5 text-sm font-semibold text-[#2f5d46]">
                    Fácil
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="cc-title text-lg">Sessão concluída! 🎉</div>
              <p className="mt-2 text-sm">
                {stats.good} fáceis · {stats.ok} difíceis · {stats.fail} erros
              </p>
              <p className="mt-1 text-xs opacity-70">O que você errou volta logo; o que foi fácil some por mais tempo.</p>
              <button type="button" className="cc-btn-ghost mt-4 inline-flex items-center gap-1" onClick={practice}>
                <RotateCcw className="h-3.5 w-3.5" /> Praticar mais um pouco
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const KIND_LABEL: Record<LearnItem['kind'], string> = { vocab: 'Expressão', chunk: 'Chunk', grammar: 'Gramática' };

function Front({ item, mode }: { item: LearnItem; mode: Mode }) {
  if (item.kind === 'grammar') {
    return mode === 'en-pt' ? (
      <>
        <div className="text-xs opacity-60">Que estrutura é essa?</div>
        <div className="cc-title mt-1 text-xl">“{item.example}”</div>
      </>
    ) : (
      <>
        <div className="text-xs opacity-60">Dê um exemplo em inglês de:</div>
        <div className="cc-title mt-1 text-xl">{item.label}</div>
      </>
    );
  }
  return mode === 'en-pt' ? <div className="cc-title text-2xl">{item.label}</div> : <div className="text-xl font-semibold">{item.pt}</div>;
}

function Back({ item, mode }: { item: LearnItem; mode: Mode }) {
  const example = ITEM_EXAMPLES[item.id];
  const chunk = item.kind === 'chunk' ? CHUNK_BY_ID[item.id] : undefined;
  if (item.kind === 'grammar') {
    return (
      <>
        <div className="font-semibold">{mode === 'en-pt' ? item.label : `“${item.example}”`}</div>
        <div className="mt-1 text-sm opacity-80">{item.pt}</div>
      </>
    );
  }
  return (
    <>
      <div className={mode === 'pt-en' ? 'cc-title text-2xl' : 'text-lg font-semibold'}>{mode === 'en-pt' ? item.pt : item.label}</div>
      {chunk && <div className="mt-1 text-xs opacity-70">{chunk.when_pt}</div>}
      {example && <div className="mt-2 text-sm italic opacity-75">“{example}”</div>}
    </>
  );
}
