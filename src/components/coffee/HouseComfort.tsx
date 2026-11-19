import { X } from 'lucide-react';
import { COMFORT_TITLES, MAX_SAME, nextTitle, titleFor, type MorningBonus } from '@/lib/coffee/comfort';
import { brasiliaHour } from '@/game/effects/dayPhase';
import Pron from './Pron';

// Selo no topo (em casa): título e conforto da casa.
export function ComfortChip({ comfort, onClick }: { comfort: number; onClick: () => void }) {
  const t = titleFor(comfort);
  return (
    <button type="button" onClick={onClick} className="cc-hud flex items-center gap-1.5 whitespace-nowrap text-sm" title="Conforto da casa">
      <span>{t.emoji}</span>
      <span className="hidden lg:inline">{t.pt}</span>
      <span className="rounded-md bg-[#efe0c4] px-1.5 text-xs font-bold">♥ {comfort}</span>
    </button>
  );
}

function Progress({ comfort }: { comfort: number }) {
  const t = titleFor(comfort);
  const next = nextTitle(comfort);
  if (!next) return <div className="text-xs opacity-70">Título máximo! 🎉</div>;
  const pct = ((comfort - t.min) / (next.min - t.min)) * 100;
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e6d2ad]">
        <div className="h-full bg-[#e07a5f]" style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} />
      </div>
      <div className="mt-1 text-xs opacity-75">
        Faltam {next.min - comfort} de conforto para {next.emoji} {next.pt} (+{next.bonus} 🪙 por dia)
      </div>
    </div>
  );
}

// Painel: como funciona o conforto, os títulos e o bônus de cada um.
export function ComfortPanel({ comfort, onClose }: { comfort: number; onClose: () => void }) {
  const t = titleFor(comfort);
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-3" onClick={onClose}>
      <div className="cc-panel relative w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-3 top-3 rounded-lg p-1.5 hover:bg-[#efe0c4]" aria-label="Fechar">
          <X className="h-5 w-5" />
        </button>
        <div className="text-xs font-bold uppercase tracking-wide opacity-60">Conforto da casa</div>
        <h2 className="cc-title flex flex-wrap items-center gap-x-2 text-2xl">
          {t.emoji} {t.pt}
        </h2>
        <div className="mb-3 flex items-center gap-1.5 text-sm italic">
          a {t.en} <Pron text={`a ${t.en}`} />
        </div>
        <div className="mb-1 text-sm">
          <b>♥ {comfort}</b> de conforto · ao acordar, cada um ganha <b>+{t.bonus} 🪙</b> por dia
        </div>
        <Progress comfort={comfort} />

        <div className="mt-4 space-y-1">
          {COMFORT_TITLES.map((x) => (
            <div key={x.pt} className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${x.pt === t.pt ? 'bg-[#f2cc8f]/60 font-semibold' : ''}`}>
              <span>
                {x.emoji} {x.pt} <span className="text-xs opacity-60">({x.en})</span>
              </span>
              <span className="text-xs">
                ♥ {x.min}+ · <b>+{x.bonus} 🪙</b>
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed opacity-75">
          Cada móvel colocado na casa soma conforto (o valor aparece na lojinha) e vale para os dois. O mesmo móvel conta até {MAX_SAME} vezes, então vale variar! O
          bônus cai uma vez por dia, quando você acorda no quarto.
        </p>
      </div>
    </div>
  );
}

// Card de "bom dia" quando o bônus do dia cai.
export function MorningCard({ bonus, name, onClose }: { bonus: MorningBonus; name: string; onClose: () => void }) {
  const h = brasiliaHour();
  const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const line = h < 12 ? 'Rise and shine!' : 'Welcome home!';
  const t = titleFor(bonus.comfort);
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/40 p-3" onClick={onClose}>
      <div className="cc-panel relative w-full max-w-sm p-5 text-center animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="text-4xl">{h < 12 ? '☀️' : h < 18 ? '🌤️' : '🌙'}</div>
        <h2 className="cc-title mt-1 text-2xl">
          {hello}, {name}!
        </h2>
        <div className="flex items-center justify-center gap-1.5 text-sm italic opacity-80">
          “{line}” <Pron text={line} />
        </div>
        <div className="mt-4 rounded-xl bg-[#f2cc8f]/40 px-3 py-2 text-sm">
          Sua casa — {t.emoji} <b>{t.pt}</b>, ♥ {bonus.comfort} de conforto — rendeu
          <div className="cc-title mt-1 text-3xl">+{bonus.coins} 🪙</div>
        </div>
        <div className="mt-3 text-left">
          <Progress comfort={bonus.comfort} />
        </div>
        <button type="button" onClick={onClose} className="cc-btn mt-4 w-full">
          Bora! ☕
        </button>
      </div>
    </div>
  );
}
