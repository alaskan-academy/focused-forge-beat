import { useEffect, useMemo, useRef, useState } from 'react';
import { Droplets, Lock, Volume2, X } from 'lucide-react';
import { ITEMS } from '@/content/coffee';
import { CROPS, CROP_BY_ID, KIND_INFO, MAX_PLOTS, fmtLeft, plotPrice, type CropKind, type Plant, type PlantView } from '@/lib/coffee/garden';
import { waterQuiz } from '@/lib/coffee/gardenWords';
import { canSpeak, speak } from '@/lib/coffee/speech';
import { drawPlant } from '@/game/art/plants';
import Pron from './Pron';
import { QuizWhy, SentenceBuilder } from './LessonBits';
import { GLUE_BY_ID, GLUE_GROUPS } from '@/content/coffee/glue';

export function PlantPreview({ cropId, stage = 3, size = 40 }: { cropId: string; stage?: number; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(drawPlant(cropId, stage), 0, 0, c.width, c.height);
  }, [cropId, stage]);
  return <canvas ref={ref} width={size} height={size} style={{ imageRendering: 'pixelated' }} />;
}

function Shell({ title, sub, onClose, children }: { title: React.ReactNode; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-3" onClick={onClose}>
      <div className="cc-panel relative flex max-h-[94%] w-full max-w-md flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between gap-2 border-b-2 border-[#e6d2ad] px-4 py-3">
          <div>
            <h2 className="cc-title text-xl">{title}</h2>
            {sub && <p className="text-xs opacity-70">{sub}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#efe0c4]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

const STAGE_PT = ['semente', 'broto', 'crescendo', 'pronta'];

type PlotProps = {
  plot: number;
  mine: boolean;
  ownerName: string;
  locked: boolean;
  plots: number;
  plant: Plant | null;
  view: PlantView | null;
  now: number;
  seeds: Record<string, number>;
  coins: number;
  onPlant: (cropId: string) => Promise<string>;
  onWater: () => Promise<void>;
  onQuiz: (correct: boolean) => void;
  onHarvest: () => Promise<void>;
  onBuyPlot: () => Promise<void>;
  onShop: () => void;
  onClose: () => void;
};

// Painel de um canteiro: plantar, regar (com exercício), acompanhar e colher.
export function GardenPlotPanel(p: PlotProps) {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  if (p.locked) {
    const price = plotPrice(p.plots);
    return (
      <Shell title="🔒 Canteiro trancado" sub={p.mine ? 'Compre mais canteiros para plantar mais de uma vez' : `Esse canteiro ainda não é da ${p.ownerName}`} onClose={p.onClose}>
        {p.mine ? (
          <div className="text-center">
            <p className="text-sm">
              Você tem {p.plots} de {MAX_PLOTS} canteiros.
            </p>
            <button type="button" disabled={busy || p.coins < price} onClick={() => run(p.onBuyPlot)} className="cc-btn mt-3 disabled:opacity-50">
              Comprar canteiro · {price} 🪙
            </button>
          </div>
        ) : (
          <p className="text-sm opacity-70">Só a dona da horta pode comprar canteiros. 🙂</p>
        )}
      </Shell>
    );
  }

  if (!p.plant) {
    const have = CROPS.filter((c) => (p.seeds[c.id] ?? 0) > 0);
    return (
      <Shell title="🌱 Canteiro vazio" sub={p.mine ? 'Cada semente traz uma palavra-cola: as palavrinhas que montam e ligam as frases' : `Canteiro da ${p.ownerName}`} onClose={p.onClose}>
        {!p.mine ? (
          <p className="text-sm opacity-70">Nada plantado aqui ainda.</p>
        ) : have.length === 0 ? (
          <div className="text-center text-sm">
            <p>Você está sem sementes. 3 grátis chegam todo dia, ou compre na barraquinha.</p>
            <button type="button" onClick={p.onShop} className="cc-btn-ghost mt-2">
              🧺 Ir à barraquinha
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wide opacity-60">Escolha a semente</div>
            {have.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={busy}
                onClick={() => run(() => p.onPlant(c.id).then(() => p.onClose()))}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-[#e6d2ad] bg-[#fffaf0] px-3 py-2 text-left hover:border-[#e07a5f]"
              >
                <PlantPreview cropId={c.id} size={32} />
                <span className="flex-1">
                  <span className="cc-title text-base">{c.en}</span> <span className="text-xs opacity-60">({c.pt})</span>
                  <span className="block text-[11px] opacity-60">
                    {KIND_INFO[c.kind].pt} · pronta em ~{fmtLeft(KIND_INFO[c.kind].stageMinutes * 3 * 60_000)} · +{KIND_INFO[c.kind].coins} 🪙
                  </span>
                </span>
                <span className="rounded-full bg-[#efe0c4] px-2 text-sm font-bold">×{p.seeds[c.id]}</span>
              </button>
            ))}
          </div>
        )}
      </Shell>
    );
  }

  const crop = CROP_BY_ID[p.plant.crop_id];
  const word = ITEMS[p.plant.item_id];
  const v = p.view!;
  return (
    <Shell
      title={
        <span className="flex items-center gap-2">
          {crop?.emoji} {crop?.en} <Pron text={crop?.en ?? ''} />
        </span>
      }
      sub={`${crop?.pt} · ${p.mine ? 'sua planta' : `planta da ${p.ownerName}`}`}
      onClose={p.onClose}
    >
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-[#7a5232] p-1">
          <PlantPreview cropId={p.plant.crop_id} stage={v.stage} size={64} />
        </div>
        <div className="flex-1">
          <div className="flex gap-1">
            {STAGE_PT.map((s, i) => (
              <span key={s} className={`h-2 flex-1 rounded-full ${i <= v.stage ? 'bg-[#6aa36f]' : 'bg-[#e6d2ad]'}`} title={s} />
            ))}
          </div>
          <div className="mt-1 text-sm">
            {v.ready ? '✨ Pronta para colher!' : v.thirsty ? '💧 Com sede — regue para crescer' : `🌤️ Crescendo · próximo estágio em ${fmtLeft((v.nextAt ?? p.now) - p.now)}`}
          </div>
        </div>
      </div>

      {/* com sede, a palavra fica escondida (senão entrega a resposta do exercício de regar) */}
      {word && !v.thirsty && (
        <div className="mt-3 rounded-xl border-2 border-dashed border-[#d4bf9a] px-3 py-2">
          <div className="text-[11px] font-bold uppercase tracking-wide opacity-60">
            {GLUE_BY_ID[word.id] ? `Palavra-cola · ${GLUE_GROUPS[GLUE_BY_ID[word.id].group].emoji} ${GLUE_GROUPS[GLUE_BY_ID[word.id].group].pt}` : 'Palavra desta planta'}
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="cc-title text-lg">{word.label}</span>
            {word.en && <Pron text={word.en} />}
          </div>
          <div className="text-sm opacity-75">{word.pt}</div>
          {word.note && <p className="mt-1 text-xs leading-snug opacity-75"><b>Por quê?</b> {word.note}</p>}
          {word.example && GLUE_BY_ID[word.id] && <p className="mt-1 text-xs italic opacity-70">“{word.example}”</p>}
        </div>
      )}

      {v.thirsty && !v.ready && <WaterQuizBox itemId={p.plant.item_id} stage={v.stage} golden={crop.kind === 'golden'} onCorrect={() => run(p.onWater)} onAnswer={p.onQuiz} busy={busy} />}

      {v.ready &&
        (p.mine ? (
          <button type="button" disabled={busy} onClick={() => run(() => p.onHarvest().then(() => p.onClose()))} className="cc-btn mt-4 w-full">
            🧺 Colher · +{KIND_INFO[crop.kind].coins} 🪙
          </button>
        ) : (
          <p className="mt-3 text-sm opacity-70">Pronta! Só a {p.ownerName} pode colher. 🙂</p>
        ))}
    </Shell>
  );
}

// Regar = acertar um exercício rápido com a palavra da planta.
function WaterQuizBox({ itemId, stage, golden, onCorrect, onAnswer, busy }: { itemId: string; stage: number; golden: boolean; onCorrect: () => void; onAnswer: (correct: boolean) => void; busy: boolean }) {
  const [round, setRound] = useState(0);
  const q = useMemo(() => waterQuiz(itemId, stage + round, Math.random, golden), [itemId, stage, round, golden]);
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setPicked(null), [round]);
  if (!q) {
    return (
      <button type="button" disabled={busy} onClick={onCorrect} className="cc-btn mt-4 inline-flex w-full items-center justify-center gap-1.5">
        <Droplets className="h-4 w-4" /> Regar
      </button>
    );
  }
  const right = picked !== null && picked === q.answer;
  return (
    <div className="mt-4 rounded-xl bg-[#e3f0f6] p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-[#2f6f86]">💧 Para regar: {q.prompt}</div>
        {q.speak && canSpeak() && (
          <button type="button" onClick={() => speak(q.speak!)} className="rounded-full bg-white p-1.5 text-[#2f6f86] shadow" aria-label="Ouvir">
            <Volume2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {q.shown && <div className="cc-title mt-1 text-lg">{q.shown}</div>}
      {q.build && (
        <div className="mt-2">
          <SentenceBuilder
            key={round}
            build={q.build}
            disabled={busy}
            onDone={(ok) => {
              setPicked(ok ? q.answer : -2);
              onAnswer(ok);
              if (ok) onCorrect();
            }}
          />
        </div>
      )}
      <div className="mt-2 space-y-1.5">
        {q.options.map((o, i) => {
          const tone = picked === null ? 'border-white bg-white hover:border-[#5bb0c4]' : i === q.answer ? 'border-[#6aa36f] bg-[#e3f1e4]' : i === picked ? 'border-[#c4554d] bg-[#fbe3e3]' : 'border-white bg-white opacity-50';
          return (
            <button
              key={o}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                onAnswer(i === q.answer);
                if (i === q.answer) onCorrect();
              }}
              className={`w-full rounded-lg border-2 px-3 py-1.5 text-left text-sm ${tone}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && <QuizWhy quiz={q} />}
      {picked !== null &&
        (right ? (
          <p className="mt-2 text-sm font-semibold text-[#4f8a5b]">💧 Regada! A plantinha agradece.</p>
        ) : (
          <button type="button" onClick={() => setRound((r) => r + 1)} className="cc-btn-ghost mt-2 w-full text-sm">
            Quase! Tentar outra pergunta
          </button>
        ))}
    </div>
  );
}

const KINDS: CropKind[] = ['herb', 'veg', 'fruit', 'golden'];

// Barraquinha: comprar sementes e ver a despensa.
export function SeedStand({ coins, level, seeds, pantry, onBuy, onClose }: { coins: number; level: number; seeds: Record<string, number>; pantry: Record<string, number>; onBuy: (cropId: string) => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const pantryList = CROPS.filter((c) => (pantry[c.id] ?? 0) > 0);
  return (
    <Shell title="🧺 Seed stand" sub={`Barraquinha de sementes · 3 grátis por dia · você tem 🪙 ${coins}`} onClose={onClose}>
      {KINDS.map((k) => {
        const info = KIND_INFO[k];
        const locked = level < info.minLevel;
        return (
          <section key={k} className="mb-3">
            <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold">
              {info.pt} <span className="text-xs font-normal opacity-60">· ~{fmtLeft(info.stageMinutes * 3 * 60_000)} · colheita +{info.coins} 🪙</span>
              {locked && (
                <span className="inline-flex items-center gap-0.5 text-xs opacity-60">
                  <Lock className="h-3 w-3" /> Nv {info.minLevel}
                </span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {CROPS.filter((c) => c.kind === k).map((c) => (
                <div key={c.id} className={`flex items-center gap-2 rounded-xl border-2 border-[#e6d2ad] bg-[#fffaf0] p-1.5 ${locked ? 'opacity-50' : ''}`}>
                  <PlantPreview cropId={c.id} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-sm font-semibold leading-tight">
                      {c.en} <Pron text={c.en} showIpa={false} />
                    </div>
                    <div className="text-[11px] opacity-60">
                      {c.pt} · tem {seeds[c.id] ?? 0}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={locked || coins < info.price || busy === c.id}
                    onClick={async () => {
                      setBusy(c.id);
                      try {
                        await onBuy(c.id);
                      } finally {
                        setBusy(null);
                      }
                    }}
                    className="cc-btn !px-2 !py-0.5 text-xs disabled:opacity-50"
                  >
                    {info.price} 🪙
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <div className="mt-2 rounded-xl bg-[#f2cc8f]/40 p-3 text-sm">
        <div className="font-bold">🥫 Despensa</div>
        {pantryList.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pantryList.map((c) => (
              <span key={c.id} className="rounded-full bg-[#fffaf0] px-2 py-0.5">
                {c.emoji} {c.en} ×{pantry[c.id]}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs opacity-70">O que você colher fica guardado aqui (para receitas no futuro!).</div>
        )}
      </div>
    </Shell>
  );
}
