import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHARACTERS, ITEMS, ITEM_EXAMPLES } from '@/content/coffee';
import { MAX_HEARTS, MILESTONES, chapterStatus, isSpecial, type ArcState } from '@/lib/coffee/arcs';
import { MAX_BOX, type VocabState } from '@/lib/coffee/srs';
import CharacterPreview from './CharacterPreview';

type Props = {
  states: Record<string, VocabState>;
  arcs: Record<string, ArcState>;
  now: Date;
  onClose: () => void;
};

type Tab = 'vocab' | 'chunk' | 'grammar' | 'people';

// Caderninho: expressões e estruturas já vistas + fichas dos clientes recorrentes.
export default function Journal({ states, arcs, now, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('people');
  const [q, setQ] = useState('');

  const seen = useMemo(
    () =>
      Object.values(states)
        .map((s) => ({ s, item: ITEMS[s.item_id] }))
        .filter((x) => x.item)
        .sort((a, b) => b.s.last_seen_at.localeCompare(a.s.last_seen_at)),
    [states],
  );
  const filtered = (kind: 'vocab' | 'chunk' | 'grammar') =>
    seen.filter((x) => x.item.kind === kind && (!q || `${x.item.label} ${x.item.pt}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-2 sm:p-4">
      <div className="cc-panel flex max-h-[94%] w-full max-w-lg flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b-2 border-[#e6d2ad] bg-[#f6ead3] px-4 py-2">
          <h2 className="cc-title text-xl">📓 Caderninho</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#e9d5b5]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-1.5 bg-[#f6ead3] px-3 pb-2">
          {(
            [
              ['people', 'Clientes'],
              ['vocab', `Expressões (${seen.filter((x) => x.item.kind === 'vocab').length})`],
              ['chunk', `Chunks (${seen.filter((x) => x.item.kind === 'chunk').length})`],
              ['grammar', `Gramática (${seen.filter((x) => x.item.kind === 'grammar').length})`],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={cn('cc-chip', tab === k && 'cc-chip-on')}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-[#fbf3e4] p-3">
          {tab === 'people' && (
            <div className="space-y-3">
              {CHARACTERS.map((c) => {
                const arc = arcs[c.id];
                if (!arc) {
                  return (
                    <div key={c.id} className="cc-card flex items-center gap-3 opacity-60">
                      <div className="flex h-12 w-10 items-center justify-center rounded-lg bg-[#e9d5b5] text-xl">?</div>
                      <div className="text-sm">Alguém que você ainda não conheceu…</div>
                    </div>
                  );
                }
                const status = chapterStatus(c, arc, now);
                const done = c.chapters.filter((ch) => arc.done.includes(ch.id));
                const mainTotal = c.chapters.filter((ch) => !isSpecial(ch)).length;
                return (
                  <div key={c.id} className="cc-card">
                    <div className="flex items-start gap-3">
                      <div className="flex h-14 w-11 shrink-0 items-end justify-center overflow-hidden rounded-lg bg-[#e9d5b5]">
                        <CharacterPreview appearance={c.look} scale={2} animate={false} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="cc-title text-lg leading-tight">{c.name}</div>
                        <Hearts n={arc.hearts} />
                        <p className="mt-1 text-xs opacity-75">{c.bio_pt}</p>
                      </div>
                    </div>
                    <ol className="mt-2 space-y-1.5 border-l-2 border-[#e6d2ad] pl-3">
                      {done.map((ch) => (
                        <li key={ch.id} className="text-sm">
                          <span className="font-semibold">{isSpecial(ch) ? '✨ ' : ''}{ch.title_pt}.</span> <span className="opacity-80">{ch.summary_pt}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-2 text-xs opacity-70">
                      {done.filter((ch) => !isSpecial(ch)).length}/{mainTotal} capítulos ·{' '}
                      {status.state === 'available' && 'Tem novidade! Atenda quando aparecer no café 📖'}
                      {status.state === 'waiting' && `Próximo capítulo ${relDays(status.availableAt, now)}`}
                      {status.state === 'locked' && `Capítulo especial com ${status.needHearts} 💛`}
                      {status.state === 'finished' && 'História completa (por enquanto)'}
                    </div>
                    {arc.unlocks.length > 0 && (
                      <div className="mt-1 text-xs font-semibold">
                        {MILESTONES.filter((m) => arc.unlocks.includes(m.unlock)).map((m) => `🎁 ${m.label_pt}`).join(' · ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab !== 'people' && (
            <>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="buscar…" className="cc-input mb-3 w-full py-1.5 text-sm" />
              {filtered(tab).length === 0 && <p className="py-6 text-center text-sm opacity-60">Nada por aqui ainda. Atenda clientes para encher o caderninho!</p>}
              <ul className="space-y-2">
                {filtered(tab).map(({ s, item }) => (
                  <li key={item.id} className="cc-card py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{item.label}</span>
                      <Mastery box={s.box} />
                    </div>
                    <div className="text-sm opacity-80">{item.pt}</div>
                    {ITEM_EXAMPLES[item.id] && <div className="mt-0.5 text-xs italic opacity-60">“{ITEM_EXAMPLES[item.id]}”</div>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Hearts({ n }: { n: number }) {
  return (
    <div className="text-sm leading-none tracking-tight" aria-label={`${n} de ${MAX_HEARTS} corações`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <span key={i} className={i < n ? '' : 'opacity-25 grayscale'}>
          💛
        </span>
      ))}
    </div>
  );
}

function Mastery({ box }: { box: number }) {
  return (
    <span className="flex gap-0.5" title={`caixa ${box} de ${MAX_BOX}`}>
      {Array.from({ length: MAX_BOX }, (_, i) => (
        <span key={i} className={cn('h-2 w-2 rounded-full', i < box ? 'bg-[#81b29a]' : 'bg-[#e6d2ad]')} />
      ))}
    </span>
  );
}

function relDays(at: Date, now: Date) {
  const h = Math.ceil((at.getTime() - now.getTime()) / 3_600_000);
  if (h <= 24) return `em ${h}h`;
  return `em ${Math.ceil(h / 24)} dias`;
}
