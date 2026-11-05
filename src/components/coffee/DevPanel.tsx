import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { CHARACTERS } from '@/content/coffee';
import type { LocalStore } from '@/lib/coffee/store/localStore';

// Painel só de desenvolvimento (npm run dev): controla o relógio e chama clientes para testar.
export default function DevPanel({ store }: { store: LocalStore }) {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const act = (fn: () => void) => () => {
    fn();
    force((n) => n + 1);
  };

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="cc-hud pointer-events-auto absolute bottom-14 left-3 flex items-center gap-1 text-xs md:bottom-3">
        <Wrench className="h-3.5 w-3.5" /> Teste
      </button>
    );

  return (
    <div className="cc-hud pointer-events-auto absolute bottom-14 left-3 w-52 space-y-1.5 text-xs md:bottom-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-bold">
          <Wrench className="h-3.5 w-3.5" /> Painel de teste
        </span>
        <button type="button" onClick={() => setOpen(false)} className="opacity-60 hover:opacity-100">
          ocultar
        </button>
      </div>
      <div className="opacity-70">Relógio: +{store.clockOffsetDays()} dia(s)</div>
      <div className="grid grid-cols-2 gap-1">
        <button type="button" className="cc-btn-ghost px-2 py-1 text-xs" onClick={act(() => store.advanceDays(1))}>
          ⏩ +1 dia
        </button>
        <button type="button" className="cc-btn-ghost px-2 py-1 text-xs" onClick={act(() => store.resetPuzzles())}>
          ♟️ Sudoku novo
        </button>
        <button type="button" className="cc-btn-ghost px-2 py-1 text-xs" onClick={act(() => store.addXp(150))}>
          +150 XP
        </button>
        <button type="button" className="cc-btn-ghost px-2 py-1 text-xs" onClick={act(() => store.addCoins(50))}>
          +50 🪙
        </button>
        {CHARACTERS.map((c) => (
          <button key={c.id} type="button" className="cc-btn-ghost px-2 py-1 text-xs" onClick={act(() => store.callCustomer(c.id))}>
            Chamar {c.name}
          </button>
        ))}
        <button
          type="button"
          className="cc-btn-ghost px-2 py-1 text-xs"
          disabled={!store.hasPartner()}
          onClick={act(() => store.partnerServesAll())}
          title="Simula a outra pessoa conversando com os recorrentes que esperam por ela"
        >
          Jessica atende
        </button>
        <button type="button" className="cc-btn-ghost px-2 py-1 text-xs" onClick={act(() => store.togglePartner())}>
          {store.hasPartner() ? 'Jogar sozinho' : 'Com a Jessica'}
        </button>
        <button type="button" className="cc-btn-ghost px-2 py-1 text-xs" onClick={act(() => store.callCustomer(null))}>
          Chamar cliente
        </button>
        <button
          type="button"
          className="cc-btn-ghost px-2 py-1 text-xs text-[#8a3a26]"
          onClick={act(() => {
            if (window.confirm('Zerar todo o progresso local (SRS, corações, moedas)?')) store.reset();
          })}
        >
          Zerar
        </button>
      </div>
    </div>
  );
}
