import { useMemo, useState } from 'react';
import { Play, Snail, X } from 'lucide-react';
import { buildEpisode, markTvWatched } from '@/lib/coffee/tv';
import { canSpeak, speak } from '@/lib/coffee/speech';
import type { DailyReward } from '@/lib/coffee/store/types';
import Pron from './Pron';

// TV: episódio de escuta do dia. Ouça a frase (normal ou devagar) e escolha o que ouviu.
export default function TvPanel({ day, onReward, onClose }: { day: string; onReward: (correct: number, total: number) => Promise<DailyReward>; onClose: () => void }) {
  const episode = useMemo(() => buildEpisode(day), [day]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<DailyReward | null>(null);
  const [heard, setHeard] = useState(false);
  const q = episode[i];
  const done = i >= episode.length;

  const play = (rate: number) => {
    speak(q.en, rate);
    setHeard(true);
  };

  const next = async () => {
    const n = i + 1;
    setI(n);
    setPicked(null);
    setHeard(false);
    if (n >= episode.length) {
      markTvWatched(day);
      try {
        setResult(await onReward(correct, episode.length));
      } catch {
        setResult({ coins: 0, total_coins: 0 });
      }
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/60 p-3" onClick={onClose}>
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-[6px] border-[#3a2a24] bg-[#1d2a3a] text-[#eef3f8] shadow-[0_6px_0_#2a1d18]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-[#3a2a24] px-4 py-2">
          <span className="text-sm font-bold">📺 Coffee Cats TV · Listening</span>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!canSpeak() && <p className="px-5 pt-4 text-sm text-[#f2cc8f]">Este navegador não tem voz em inglês. Tente no Chrome ou no celular.</p>}

        {!done ? (
          <div className="p-5">
            <div className="text-xs uppercase tracking-wide opacity-60">
              Today's episode · {i + 1} / {episode.length}
            </div>
            <p className="mt-1 text-sm opacity-80">Listen and choose what you heard. (Ouça e escolha o que ouviu.)</p>
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" onClick={() => play(0.95)} className="flex items-center gap-2 rounded-full bg-[#e07a5f] px-5 py-3 font-bold text-white shadow-[0_3px_0_#a8443d] active:translate-y-0.5">
                <Play className="h-5 w-5" /> Play
              </button>
              <button type="button" onClick={() => play(0.65)} className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm hover:bg-white/20" title="Mais devagar">
                <Snail className="h-4 w-4" /> Slow
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {q.options.map((o, k) => {
                const state = picked === null ? '' : k === q.answer ? 'bg-[#4f8a5b] border-[#6aa36f]' : k === picked ? 'bg-[#8a3a34] border-[#c4554d]' : 'opacity-50';
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={picked !== null || !heard}
                    onClick={() => {
                      setPicked(k);
                      if (k === q.answer) setCorrect((c) => c + 1);
                    }}
                    className={`w-full rounded-xl border-2 border-white/15 px-3 py-2 text-left text-sm transition disabled:cursor-default ${state} ${picked === null && heard ? 'hover:bg-white/10' : ''}`}
                  >
                    {o}
                  </button>
                );
              })}
              {!heard && <p className="text-center text-xs opacity-60">Aperte Play primeiro 🎧</p>}
            </div>
            {picked !== null && (
              <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm animate-in fade-in duration-300">
                <div className="flex items-center gap-1.5 font-semibold">
                  {picked === q.answer ? '✅ Nice ear!' : '👂 Almost!'} <Pron text={q.en} showIpa={false} className="[&_button]:text-[#f2cc8f]" />
                </div>
                <div className="mt-1">{q.en}</div>
                <div className="text-xs italic opacity-70">{q.pt}</div>
                <button type="button" onClick={next} className="mt-3 w-full rounded-lg bg-[#e07a5f] py-2 font-bold text-white">
                  {i + 1 < episode.length ? 'Next' : 'Finish'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="text-4xl">🎬</div>
            <h2 className="mt-1 text-xl font-bold">That's a wrap!</h2>
            <p className="text-sm opacity-80">
              Você acertou {correct} de {episode.length}.
            </p>
            {result && (
              <p className="mt-3 text-lg font-bold text-[#f2cc8f]">{result.coins > 0 ? `+${result.coins} 🪙` : 'Moedas da TV de hoje já ganhas — mas o treino vale!'}</p>
            )}
            <p className="mt-2 text-xs opacity-60">Amanhã tem episódio novo.</p>
            <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg bg-[#e07a5f] py-2 font-bold text-white">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
