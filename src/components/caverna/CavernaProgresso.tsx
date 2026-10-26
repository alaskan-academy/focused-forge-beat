import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { META_CHECKLIST, TOTAL_DIAS } from '@/lib/caverna/plano';
import { useCavernaMedidas, useSalvarMedida, type CavernaMedida } from '@/hooks/useCaverna';

const CAMPOS = [
  { key: 'peso_kg', label: 'Peso', unidade: 'kg', menorMelhor: true },
  { key: 'cintura_cm', label: 'Cintura', unidade: 'cm', menorMelhor: true },
  { key: 'flexoes', label: 'Flexões', unidade: '', menorMelhor: false },
  { key: 'bike_min', label: 'Bike contínua', unidade: 'min', menorMelhor: false },
] as const;

type CampoKey = (typeof CAMPOS)[number]['key'];
type Valores = Record<CampoKey, string>;

const vazio: Valores = { peso_kg: '', cintura_cm: '', flexoes: '', bike_min: '' };

function paraValores(m?: CavernaMedida): Valores {
  if (!m) return vazio;
  return {
    peso_kg: m.peso_kg?.toString() ?? '',
    cintura_cm: m.cintura_cm?.toString() ?? '',
    flexoes: m.flexoes?.toString() ?? '',
    bike_min: m.bike_min?.toString() ?? '',
  };
}

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

function Grade({ dia, pontosPorDia }: { dia: number; pontosPorDia: Map<number, number> }) {
  const semanas = Math.ceil(TOTAL_DIAS / 7);
  const batidos = Array.from(pontosPorDia.entries()).filter(([d, p]) => d <= dia && p >= META_CHECKLIST).length;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="font-semibold text-foreground">Os 30 dias</h2>
        <span className="text-xs text-muted-foreground">
          Meta batida em <strong className="text-foreground">{batidos}</strong> de {dia} {dia === 1 ? 'dia' : 'dias'}
        </span>
      </div>
      <div className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] gap-1.5 sm:gap-2 max-w-md">
        <span />
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => (
          <span key={i} className="text-center text-[10px] text-muted-foreground">{l}</span>
        ))}
        {Array.from({ length: semanas }, (_, s) => (
          <div key={s} className="contents">
            <span className="pr-1 self-center text-[10px] text-muted-foreground">S{s + 1}</span>
            {Array.from({ length: 7 }, (_, i) => {
              const d = s * 7 + i + 1;
              if (d > TOTAL_DIAS) return <span key={i} />;
              const p = pontosPorDia.get(d);
              const futuro = d > dia;
              return (
                <div
                  key={i}
                  title={p !== undefined ? `Dia ${d}: ${p}/7` : `Dia ${d}`}
                  className={cn(
                    'aspect-square rounded-md flex items-center justify-center text-[11px] font-medium tabular-nums',
                    futuro ? 'bg-secondary/40 text-muted-foreground/50'
                      : (p ?? 0) >= META_CHECKLIST ? 'bg-status-done/80 text-white'
                        : (p ?? 0) >= 4 ? 'bg-status-in-progress/50 text-foreground'
                          : p ? 'bg-destructive/30 text-foreground'
                            : 'bg-secondary text-muted-foreground',
                    d === dia && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                  )}
                >
                  {d}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-status-done/80" /> 6 ou 7</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-status-in-progress/50" /> 4 ou 5</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-destructive/30" /> 1 a 3</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-secondary" /> sem registro</span>
      </div>
    </div>
  );
}

function Medidas() {
  const { data: medidas } = useCavernaMedidas();
  const salvar = useSalvarMedida();
  const [valores, setValores] = useState<Record<1 | 30, Valores>>({ 1: vazio, 30: vazio });

  useEffect(() => {
    setValores({
      1: paraValores(medidas?.find((m) => m.dia === 1)),
      30: paraValores(medidas?.find((m) => m.dia === TOTAL_DIAS)),
    });
  }, [medidas]);

  const guardar = (dia: 1 | 30) => {
    const v = valores[dia];
    const n = (k: CampoKey) => num(v[k]);
    salvar.mutate(
      {
        dia,
        peso_kg: n('peso_kg'),
        cintura_cm: n('cintura_cm'),
        flexoes: n('flexoes') === null ? null : Math.round(n('flexoes')!),
        bike_min: n('bike_min') === null ? null : Math.round(n('bike_min')!),
      },
      {
        onSuccess: () => toast.success(`Medidas do dia ${dia} salvas`),
        onError: () => toast.error('Erro ao salvar as medidas'),
      },
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h2 className="font-semibold text-foreground flex items-center gap-2 mb-1">
        <Ruler className="h-4 w-4 text-muted-foreground" /> Medidas
      </h2>
      <p className="text-xs text-muted-foreground mb-4">No dia 1 e no dia 30. Para quem ganha músculo, cintura e força contam mais que a balança.</p>
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 text-sm">
        <span />
        <span className="text-xs font-medium text-muted-foreground">Dia 1</span>
        <span className="text-xs font-medium text-muted-foreground">Dia 30</span>
        <span className="text-xs font-medium text-muted-foreground w-14 text-right">Mudança</span>
        {CAMPOS.map((c) => {
          const a = num(valores[1][c.key]);
          const b = num(valores[30][c.key]);
          const delta = a !== null && b !== null ? Math.round((b - a) * 10) / 10 : null;
          const bom = delta !== null && delta !== 0 && (c.menorMelhor ? delta < 0 : delta > 0);
          return (
            <div key={c.key} className="contents">
              <span className="text-muted-foreground">
                {c.label}
                {c.unidade && <span className="text-xs"> ({c.unidade})</span>}
              </span>
              {([1, 30] as const).map((d) => (
                <Input
                  key={d}
                  inputMode="decimal"
                  value={valores[d][c.key]}
                  onChange={(e) => setValores((v) => ({ ...v, [d]: { ...v[d], [c.key]: e.target.value } }))}
                  className="h-8 text-sm"
                  aria-label={`${c.label} no dia ${d}`}
                />
              ))}
              <span className={cn('w-14 text-right text-xs font-medium tabular-nums', delta === null ? 'text-muted-foreground' : bom ? 'text-status-done' : 'text-foreground')}>
                {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toLocaleString('pt-BR')}`}
              </span>
            </div>
          );
        })}
        <span />
        <Button size="sm" variant="secondary" onClick={() => guardar(1)} disabled={salvar.isPending}>Salvar dia 1</Button>
        <Button size="sm" variant="secondary" onClick={() => guardar(30)} disabled={salvar.isPending}>Salvar dia 30</Button>
        <span />
      </div>
    </div>
  );
}

export default function CavernaProgresso({ dia, pontosPorDia }: { dia: number; pontosPorDia: Map<number, number> }) {
  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      <Grade dia={dia} pontosPorDia={pontosPorDia} />
      <Medidas />
    </div>
  );
}
