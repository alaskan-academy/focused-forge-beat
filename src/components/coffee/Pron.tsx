import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRICKY_SOUNDS, ipaFor } from '@/content/coffee/ipa';
import { canSpeak, speak } from '@/lib/coffee/speech';

// Pronúncia de uma palavra/expressão: IPA (toque para ver os sons difíceis) + 🔊 para ouvir.
// Sem IPA conhecido (ex.: anotação à mão com palavra nova), mostra só o 🔊.
export default function Pron({ text, className, showIpa = true }: { text: string; className?: string; showIpa?: boolean }) {
  const ipa = showIpa ? ipaFor(text) : null;
  const [guide, setGuide] = useState(false);
  if (!ipa && !canSpeak()) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 align-middle', className)}>
      {ipa && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setGuide(true);
          }}
          className="font-mono text-[12px] tracking-tight text-[#5b6ea8] hover:underline"
          title="Ver como ler os símbolos"
        >
          {ipa}
        </button>
      )}
      {canSpeak() && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            speak(text);
          }}
          className="rounded-full p-0.5 text-[#7d4f33] hover:bg-[#e9d5b5]"
          aria-label={`Ouvir "${text}"`}
          title="Ouvir"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>
      )}
      {/* fora do painel (que tem rolagem e animação e cortaria o "fixed"), mas dentro do jogo (cores do .cc-root) */}
      {guide && createPortal(<IpaGuide onClose={() => setGuide(false)} />, document.querySelector('.cc-root') ?? document.body)}
    </span>
  );
}

// Os sons que mais confundem brasileiros, com exemplo para ouvir.
export function IpaGuide({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#24170f]/60 p-3"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="cc-panel flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden text-left" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-[#e6d2ad] bg-[#f6ead3] px-4 py-2">
          <h2 className="cc-title text-lg">🗣️ Como ler o IPA</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#e9d5b5]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto bg-[#fbf3e4] p-3 text-sm">
          <p className="text-xs opacity-70">
            O IPA mostra o som, não a escrita. Aqui estão os símbolos que mais confundem quem fala português (inglês americano).
          </p>
          {TRICKY_SOUNDS.map((s) => (
            <div key={s.symbol} className="cc-card py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold text-[#5b6ea8]">{s.symbol}</span>
                <span className="flex items-center gap-1 text-xs italic opacity-80">
                  {s.example}
                  {canSpeak() && (
                    <button type="button" onClick={() => speak(s.example.replace(/\/[^/]*\//g, '').replace(/[ˈˌ×]/g, ' '), 0.8)} className="rounded-full p-0.5 hover:bg-[#e9d5b5]" aria-label="Ouvir exemplos">
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              </div>
              <div className="mt-0.5 text-xs opacity-80">{s.tip_pt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
