import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { UPGRADE_NAMES, feedText, timeAgo } from '@/lib/coffee/feed';
import type { Snapshot } from '@/lib/coffee/store/types';

type Props = { snap: Snapshot; now: Date; onContribute: (amount: number) => Promise<void>; onClose: () => void };

// Mural do café: a melhoria que vocês constroem juntos + o que cada um fez recentemente.
export default function CafeBoard({ snap, now, onContribute, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const u = snap.upgrade;
  const nameOf = (id: string | null) => (id === snap.me.user_id ? snap.me.display_name : id === snap.partner?.user_id ? snap.partner.display_name : 'Alguém');
  const remaining = u ? u.cost - u.funded : 0;

  const give = async (amount: number) => {
    setBusy(true);
    try {
      await onContribute(Math.min(amount, remaining));
      toast(`Você colocou ${Math.min(amount, remaining)} 🪙 no ${UPGRADE_NAMES[u!.key] ?? 'projeto'} 🐱`);
    } catch {
      toast('Não deu certo. Confira se você tem moedas suficientes.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-2 sm:p-4" onClick={onClose}>
      <div className="cc-panel flex max-h-[94%] w-full max-w-md flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-[#e6d2ad] bg-[#f6ead3] px-4 py-2">
          <h2 className="cc-title text-xl">📜 Mural do café</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#e9d5b5]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto bg-[#fbf3e4] p-3">
          {u && (
            <div className="cc-card">
              <div className="flex items-center justify-between">
                <span className="cc-title text-base">🐱 {UPGRADE_NAMES[u.key] ?? u.key}</span>
                <span className="text-xs font-semibold">
                  {u.funded}/{u.cost} 🪙
                </span>
              </div>
              <p className="mt-0.5 text-xs opacity-70">Uma cama e um arranhador perto da almofada. Projeto dos dois: cada um coloca as próprias moedas.</p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e6d2ad]">
                <div className="h-full rounded-full bg-[#81b29a] transition-all" style={{ width: `${Math.min(100, (u.funded / u.cost) * 100)}%` }} />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
                {[snap.me.user_id, ...(snap.partner ? [snap.partner.user_id] : [])].map((id) => (
                  <span key={id}>
                    {nameOf(id)}: <b>{u.contributions[id] ?? 0} 🪙</b>
                  </span>
                ))}
              </div>
              {u.completed_at ? (
                <div className="mt-2 rounded-lg bg-[#81b29a]/25 px-3 py-2 text-sm font-semibold text-[#2f5d46]">Pronto! O gato ganhou um cantinho novo no café 🎉</div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {[10, 50, 100].map((n) => (
                    <button key={n} type="button" disabled={busy || snap.me.coins < Math.min(n, remaining)} onClick={() => give(n)} className="cc-btn px-3 py-1.5 text-xs">
                      +{Math.min(n, remaining)} 🪙
                    </button>
                  ))}
                  <span className="text-xs opacity-60">você tem {snap.me.coins} 🪙</span>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7d4f33]/80">O que aconteceu</div>
            {snap.feed.length === 0 && <p className="py-4 text-center text-sm opacity-60">Nada por aqui ainda.</p>}
            <ul className="space-y-1.5">
              {snap.feed.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm">
                  <span>{feedText(e, nameOf)}</span>
                  <span className="shrink-0 text-[11px] opacity-50">{timeAgo(e.created_at, now)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
