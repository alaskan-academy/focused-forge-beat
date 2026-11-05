import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { pickUpdateNote } from '@/lib/coffee/updateCheck';

// Aviso engraçado de atualização (sorteado entre os do UPDATE_NOTES).
export default function UpdateNotice({ version, partner, onLater }: { version: string; partner: string | null; onLater: () => void }) {
  // um sorteio por versão nova
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const note = useMemo(() => pickUpdateNote(partner), [version]);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center px-3">
      <div className="cc-panel pointer-events-auto w-full max-w-sm px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-500" role="alert">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">{note.emoji}</span>
          <div className="min-w-0 text-sm">
            <div className="cc-title text-base leading-tight">{note.title}</div>
            <p className="mt-1 leading-snug opacity-85">{note.body}</p>
            <p className="mt-1 text-xs italic text-[#7d4f33]">“{note.english}”</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" className="cc-btn-ghost px-3 py-1.5 text-xs" onClick={onLater}>
            Depois
          </button>
          <button type="button" className="cc-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </button>
        </div>
      </div>
    </div>
  );
}
