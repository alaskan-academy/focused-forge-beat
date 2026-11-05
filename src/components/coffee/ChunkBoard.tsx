import { useState } from 'react';
import { Languages, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHUNKS, CHUNK_BY_ID, type Chunk } from '@/content/coffee/chunks';
import { chunkStatus, CHUNK_EVERY_HOURS } from '@/lib/coffee/chunkSchedule';
import type { Grade, VocabState } from '@/lib/coffee/srs';
import ActivityCard, { type CardOutcome } from './activities/ActivityCard';

type Props = {
  states: Record<string, VocabState>;
  now: Date;
  onHint: (cost: number) => Promise<boolean>;
  onLearn: (chunkId: string, grade: Grade) => Promise<void>;
  onClose: () => void;
};

// Quadro-negro: o chunk novo (a cada 12 h), com quando usar, exemplos e um exercício; e os já aprendidos.
export default function ChunkBoard({ states, now, onHint, onLearn, onClose }: Props) {
  const status = chunkStatus(states, now);
  const [opened, setOpened] = useState<Chunk | null>(status.available ? status.next : null);
  const [done, setDone] = useState<{ grade: Grade } | null>(null);
  const [saving, setSaving] = useState(false);

  const finish = async (o: CardOutcome) => {
    if (!opened) return;
    const grade: Grade = o.revealed || o.mistakes >= 2 ? 'fail' : o.mistakes === 1 || o.hints > 0 ? 'ok' : 'good';
    setSaving(true);
    try {
      await onLearn(opened.id, grade);
      setDone({ grade });
    } finally {
      setSaving(false);
    }
  };

  const hoursLeft = status.availableAt ? Math.max(1, Math.ceil((status.availableAt.getTime() - now.getTime()) / 3_600_000)) : 0;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-2 sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[94%] w-full max-w-lg flex-col overflow-hidden rounded-[18px] border-[6px] border-[#7d4f33] bg-[#2f4a3a] text-[#eef3ea] shadow-[0_4px_0_#5e3a24,0_12px_30px_rgba(20,10,5,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-dashed border-[#eef3ea]/25 px-4 py-2">
          <h2 className="cc-title text-xl !text-[#eef3ea]">🧠 Chunk do dia</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          {opened ? (
            <>
              <ChunkCard chunk={opened} />
              {!done ? (
                <div className="text-[#3b2a20]">
                  <ActivityCard activity={opened.exercise} gapMode="options" onHint={onHint} onReaction={() => {}} onDone={finish} />
                </div>
              ) : (
                <div className="rounded-xl bg-[#eef3ea]/10 p-3 text-center text-sm">
                  {done.grade === 'good' ? '✨ Mandou bem! ' : '👍 Anotado! '}
                  Esse chunk entrou na sua revisão e vai voltar nas conversas.
                  <div className="mt-1 opacity-75">Use hoje numa frase com a outra pessoa. Próximo chunk em {CHUNK_EVERY_HOURS} h.</div>
                </div>
              )}
              {saving && <div className="text-center text-xs opacity-70">Guardando…</div>}
            </>
          ) : status.next ? (
            <div className="rounded-xl bg-[#eef3ea]/10 p-4 text-center">
              <div className="cc-title text-lg !text-[#eef3ea]">Próximo chunk em ~{hoursLeft} h ⏳</div>
              <p className="mt-1 text-sm opacity-80">Enquanto isso: use um chunk da lista abaixo numa frase de verdade hoje.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#eef3ea]/10 p-4 text-center text-sm">Você já recebeu todos os {CHUNKS.length} chunks! 🎉 Mais chegam em breve.</div>
          )}

          {status.learned.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-bold uppercase tracking-wide opacity-70">Seus chunks ({status.learned.length})</div>
              <ul className="space-y-1">
                {[...status.learned].reverse().map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpened(CHUNK_BY_ID[c.id]);
                        setDone({ grade: 'ok' });
                      }}
                      className={cn('w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-white/10', opened?.id === c.id && 'bg-white/10')}
                    >
                      <b>{c.en}</b> <span className="opacity-70">· {c.pt}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChunkCard({ chunk }: { chunk: Chunk }) {
  const [showPt, setShowPt] = useState<Set<number>>(new Set());
  return (
    <div className="rounded-xl border-2 border-dashed border-[#eef3ea]/30 p-4">
      <div className="cc-title text-center text-2xl !text-[#fffaf0]">“{chunk.en}”</div>
      <div className="mt-1 text-center text-sm opacity-85">{chunk.pt}</div>
      <div className="mt-3 rounded-lg bg-black/15 px-3 py-2 text-sm">
        <span className="font-semibold">Quando usar: </span>
        {chunk.when_pt}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {chunk.examples.map((e, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5">✏️</span>
            <span className="flex-1">
              {e.en}
              {showPt.has(i) ? (
                <span className="block text-xs italic opacity-70">{e.pt}</span>
              ) : (
                <button type="button" onClick={() => setShowPt(new Set(showPt).add(i))} className="ml-2 inline-flex items-center gap-0.5 text-[11px] opacity-60 hover:opacity-100">
                  <Languages className="h-3 w-3" /> pt
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
