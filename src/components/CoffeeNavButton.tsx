import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Botão do Coffee Cats no menu do To-Do, com o visual do jogo (de propósito diferente do resto do app).
const PIXEL = { fontFamily: '"Pixelify Sans", ui-monospace, monospace' };

export function CoffeeNavCard() {
  const { pathname } = useLocation();
  const active = pathname === '/coffee';
  return (
    <NavLink
      to="/coffee"
      style={PIXEL}
      className={cn(
        'group mt-3 block rounded-xl border-[3px] border-[#7d4f33] bg-[#fbf3e4] px-3 py-2.5 shadow-[0_3px_0_#5e3a24] transition-transform hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none',
        active && 'ring-2 ring-[#e07a5f] ring-offset-2 ring-offset-sidebar',
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e9d5b5] text-xl transition-transform group-hover:rotate-[-8deg]">☕</span>
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-tight text-[#3b2a20]">Coffee Cats</div>
          <div className="text-[11px] leading-tight text-[#7d4f33]">inglês no café 🐱</div>
        </div>
      </div>
    </NavLink>
  );
}

export function CoffeeNavTab() {
  const { pathname } = useLocation();
  const active = pathname === '/coffee';
  return (
    <NavLink to="/coffee" style={PIXEL} className="flex min-w-0 flex-1 flex-col items-center px-1 py-1">
      <span
        className={cn(
          'flex h-9 w-11 -translate-y-1 items-center justify-center rounded-lg border-2 border-[#7d4f33] bg-[#fbf3e4] text-lg shadow-[0_2px_0_#5e3a24]',
          active && 'bg-[#f2cc8f]',
        )}
      >
        ☕
      </span>
      <span className="-mt-0.5 text-[10px] font-bold text-[#e9a46a]">Café</span>
    </NavLink>
  );
}
