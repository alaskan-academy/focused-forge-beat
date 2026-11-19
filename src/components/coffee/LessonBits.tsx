import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import type { WaterQuiz } from '@/lib/coffee/gardenWords';
import Pron from './Pron';

// "Por quê?": depois de responder, a frase certa inteira (com 🔊) e a regra em uma linha.
export function QuizWhy({ quiz, tone = 'light' }: { quiz: WaterQuiz; tone?: 'light' | 'card' }) {
  if (!quiz.why && !quiz.full) return null;
  return (
    <div className={`mt-2 rounded-lg px-3 py-2 text-left text-sm ${tone === 'card' ? 'bg-[#fffaf0] border-2 border-dashed border-[#d4bf9a]' : 'bg-white/80'}`}>
      {quiz.full && (
        <div className="flex flex-wrap items-center gap-x-1.5">
          <span className="font-semibold">“{quiz.full}”</span>
          <Pron text={quiz.full} showIpa={false} />
        </div>
      )}
      {quiz.why && (
        <p className="mt-1 text-xs leading-snug opacity-80">
          <b>Por quê?</b> {quiz.why}
        </p>
      )}
    </div>
  );
}

// Montar a frase tocando nos pedaços na ordem certa. Chama onDone(true/false) ao completar.
export function SentenceBuilder({ build, disabled, onDone }: { build: NonNullable<WaterQuiz['build']>; disabled?: boolean; onDone: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [done, setDone] = useState<boolean | null>(null);
  const sentence = picked.map((i) => build.tokens[i]);
  const tap = (i: number) => {
    if (disabled || done !== null || picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (next.length === build.tokens.length) {
      const ok = next.map((k) => build.tokens[k]).join(' ') === build.answer.join(' ');
      setDone(ok);
      onDone(ok);
    }
  };
  return (
    <div>
      <div className={`flex min-h-[44px] flex-wrap items-center gap-1 rounded-lg border-2 border-dashed px-2 py-1.5 ${done === null ? 'border-[#a9cfe0] bg-white/70' : done ? 'border-[#6aa36f] bg-[#e3f1e4]' : 'border-[#c4554d] bg-[#fbe3e3]'}`}>
        {sentence.length ? sentence.map((t, k) => <span key={k} className="rounded bg-[#f2cc8f]/60 px-1.5 py-0.5 text-sm font-semibold">{t}</span>) : <span className="text-xs opacity-50">toque nas palavras na ordem certa</span>}
        {picked.length > 0 && done === null && (
          <button type="button" onClick={() => setPicked(picked.slice(0, -1))} className="ml-auto rounded-full bg-white p-1 shadow" aria-label="Desfazer">
            <Undo2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {build.tokens.map((t, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled || done !== null || picked.includes(i)}
            onClick={() => tap(i)}
            className={`rounded-lg border-2 px-2.5 py-1 text-sm font-semibold ${picked.includes(i) ? 'border-transparent opacity-25' : 'border-white bg-white hover:border-[#5bb0c4]'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {done === false && <p className="mt-1.5 text-xs">Certo seria: <b>{build.answer.join(' ')}</b></p>}
    </div>
  );
}
