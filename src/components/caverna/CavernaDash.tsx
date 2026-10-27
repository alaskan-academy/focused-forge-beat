import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FASES, META_CHECKLIST, TOTAL_DIAS, fase, infoFase, semanaCorrida } from '@/lib/caverna/plano';

interface Props {
  dia: number;
  sequencia: { atual: number; recorde: number };
  pontosPorDia: Map<number, number>;
}

function Anel({ valor, total }: { valor: number; total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, valor / total);
  return (
    <div className="relative h-[128px] w-[128px] shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="caverna-anel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--personal))" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke="url(#caverna-anel)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold leading-none text-foreground tabular-nums">{valor}</span>
        <span className="text-xs text-muted-foreground mt-1">de {total} dias</span>
      </div>
    </div>
  );
}

export default function CavernaDash({ dia, sequencia, pontosPorDia }: Props) {
  const f = fase(dia);
  const info = infoFase(dia);
  const semana = semanaCorrida(dia);
  const inicioSemana = (semana - 1) * 7 + 1;
  const diasDaSemana = Array.from({ length: 7 }, (_, i) => inicioSemana + i).filter((d) => d <= TOTAL_DIAS);

  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-[1.35fr_1fr]">
      {/* Dia X de 30 */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/20 via-card to-card p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-center gap-5">
          <Anel valor={dia} total={TOTAL_DIAS} />
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Semana {semana} · {info.nome}</p>
              <p className="mt-1 text-lg font-semibold text-foreground leading-snug">{info.foco}</p>
              <p className="text-xs text-muted-foreground">Faltam {TOTAL_DIAS - dia} {TOTAL_DIAS - dia === 1 ? 'dia' : 'dias'}</p>
            </div>
            <div className="flex gap-1.5" aria-label={`Fase ${f} de 4`}>
              {FASES.map((fs, i) => (
                <div key={fs.nome} className="flex-1 min-w-[36px]">
                  <div className={cn('h-1.5 rounded-full', i < f ? 'bg-primary' : 'bg-secondary')} />
                  <p className={cn('mt-1 text-[10px] truncate', i === f - 1 ? 'text-foreground font-medium' : 'text-muted-foreground')}>{fs.nome}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sequência */}
      <div className="relative overflow-hidden rounded-2xl border border-status-in-progress/25 bg-gradient-to-br from-status-in-progress/15 via-card to-card p-5">
        <div className="pointer-events-none absolute -right-12 -bottom-16 h-40 w-40 rounded-full bg-status-in-progress/15 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-status-in-progress">Sequência</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-5xl font-bold leading-none text-foreground tabular-nums">{sequencia.atual}</span>
                <span className="text-sm text-muted-foreground">{sequencia.atual === 1 ? 'dia' : 'dias'} seguidos</span>
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">com {META_CHECKLIST} de 7 ou mais</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-in-progress/15">
              <Flame className="h-6 w-6 text-status-in-progress" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {diasDaSemana.map((d) => {
                const p = pontosPorDia.get(d);
                const bateu = (p ?? 0) >= META_CHECKLIST;
                return (
                  <div key={d} className="flex-1 text-center">
                    <div
                      className={cn(
                        'h-2 rounded-full',
                        bateu ? 'bg-status-in-progress' : p ? 'bg-status-in-progress/30' : 'bg-secondary',
                        d === dia && 'ring-2 ring-foreground/40 ring-offset-1 ring-offset-card',
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground tabular-nums">{d}</span>
                  </div>
                );
              })}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" /> Recorde: <strong className="text-foreground">{sequencia.recorde}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
