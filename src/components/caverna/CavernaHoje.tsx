import { useEffect, useState } from 'react';
import { Check, Clock, Droplets, Dumbbell, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  PESSOAS, aquecimento, checklistDoDia, infoFase, metaAgua, roteiroDoDia, treinoDoDia, TREINOS,
  type ItemId, type Linha, type Papel, type Pessoa,
} from '@/lib/caverna/plano';

interface Props {
  dia: number;
  pessoa: Pessoa;
  papel: Papel;
  itens: Partial<Record<ItemId, boolean>>;
  aguaMl: number;
  cargas: Record<string, string>;
  onChange: (itens: Partial<Record<ItemId, boolean>>, aguaMl: number) => void;
  onCarga: (id: string, valor: string) => void;
}

const litros = (ml: number) => `${(ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`;

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-card border border-border rounded-xl p-4', className)}>{children}</div>;
}

function Checklist({ dia, itens, aguaMl, meta, onChange }: { dia: number; itens: Props['itens']; aguaMl: number; meta: number; onChange: Props['onChange'] }) {
  const lista = checklistDoDia(dia);
  const pontos = lista.filter((i) => (i.id === 'agua' ? aguaMl >= meta : itens[i.id])).length;
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground">Checklist do dia</h2>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums',
            pontos >= 6 ? 'bg-status-done/15 text-status-done' : 'bg-secondary text-muted-foreground',
          )}
        >
          {pontos}/7
        </span>
      </div>
      <div className="space-y-1">
        {lista.map((item) => {
          const auto = item.id === 'agua';
          const marcado = auto ? aguaMl >= meta : !!itens[item.id];
          return (
            <button
              key={item.id}
              type="button"
              disabled={auto}
              onClick={() => onChange({ ...itens, [item.id]: !marcado }, aguaMl)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                auto ? 'cursor-default' : 'hover:bg-secondary',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                  marcado ? 'border-status-done bg-status-done text-white' : 'border-muted-foreground/40',
                )}
              >
                {marcado && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
              <span className={cn('flex-1', marcado ? 'text-muted-foreground line-through decoration-muted-foreground/40' : 'text-foreground')}>
                {item.label}
              </span>
              {auto && <span className="text-[10px] text-muted-foreground">automático</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Agua({ aguaMl, meta, onAgua }: { aguaMl: number; meta: number; onAgua: (ml: number) => void }) {
  const pct = Math.min(100, Math.round((aguaMl / meta) * 100));
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Droplets className="h-4 w-4 text-sky-400" /> Água
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          <strong className="text-foreground">{litros(aguaMl)}</strong> de {litros(meta)}
        </span>
      </div>
      <div className="h-3 rounded-full bg-secondary overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onAgua(Math.max(0, aguaMl - 250))}
          disabled={aguaMl === 0}
          className="h-9 w-10 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40"
          aria-label="Tirar 250 ml"
        >
          <Minus className="h-4 w-4" />
        </button>
        {[250, 500].map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => onAgua(aguaMl + ml)}
            className="h-9 flex-1 flex items-center justify-center gap-1 rounded-lg bg-sky-500/15 text-sky-300 text-sm font-medium hover:bg-sky-500/25 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> {ml} ml
          </button>
        ))}
      </div>
    </Card>
  );
}

function CargaInput({ id, valor, onCarga }: { id: string; valor: string; onCarga: Props['onCarga'] }) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  return (
    <Input
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto !== valor && onCarga(id, texto)}
      placeholder="Minha carga (ex.: verde + azul)"
      className="h-8 text-xs bg-background/60"
      aria-label="Minha carga"
    />
  );
}

function Treino({ dia, pessoa, cargas, onCarga }: { dia: number; pessoa: Pessoa; cargas: Props['cargas']; onCarga: Props['onCarga'] }) {
  const treino = treinoDoDia(dia);
  if (!treino) return null;
  const pares = TREINOS[treino.letra];
  const comecoPuxadores = pessoa === 'lucas' ? treino.lucasComecaComPuxadores : !treino.lucasComecaComPuxadores;
  const outro = PESSOAS[pessoa === 'lucas' ? 'jessica' : 'lucas'].nome;

  return (
    <Card className="lg:col-span-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" /> Treino {treino.letra}
        </h2>
        <span className="text-xs text-muted-foreground">{infoFase(dia).series} por par · 10 a 15 repetições</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Você começa no exercício <strong className="text-foreground">{comecoPuxadores ? 'com puxadores' : 'livre'}</strong>; {outro} começa no outro. Terminou a série, trocam.
      </p>

      <div className="mb-4 rounded-lg bg-secondary/50 p-3">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Aquecimento (5 min)</p>
        <ol className="space-y-1 text-sm text-foreground list-decimal list-inside">
          {aquecimento(dia).map((a) => <li key={a}>{a}</li>)}
        </ol>
      </div>

      <div className="space-y-3">
        {pares.map((par, i) => (
          <div key={par.comPuxadores.id} className="rounded-lg border border-border">
            <div className="px-3 py-1.5 border-b border-border text-xs font-medium text-muted-foreground">Par {i + 1}</div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {[
                { ex: par.comPuxadores, tag: 'Puxadores' },
                { ex: par.livre, tag: 'Livre' },
              ].map(({ ex, tag }) => (
                <div key={ex.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded', tag === 'Livre' ? 'bg-personal/15 text-personal' : 'bg-primary/15 text-primary')}>
                      {tag}
                    </span>
                    <span className="text-sm font-medium text-foreground">{ex.nome}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ex.como}</p>
                  <p className="text-xs text-foreground">Sugestão: {ex[pessoa]}</p>
                  <CargaInput id={ex.id} valor={cargas[ex.id] ?? ''} onCarga={onCarga} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function detalheDaFase(l: Linha, dia: number) {
  const info = infoFase(dia);
  if (l.tipo === 'cardio') return info.cardio;
  if (l.tipo === 'trilha') return info.trilha;
  if (l.tipo === 'treino') {
    const t = treinoDoDia(dia);
    return t ? `Treino ${t.letra}` : undefined;
  }
  return undefined;
}

function Roteiro({ dia, pessoa, papel }: { dia: number; pessoa: Pessoa; papel: Papel }) {
  const linhas = roteiroDoDia(dia, papel);
  const i = pessoa === 'lucas' ? 0 : 1;
  return (
    <Card>
      <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" /> Roteiro do dia
      </h2>
      <div className="space-y-0.5">
        {linhas.map((l, idx) => {
          const fase = detalheDaFase(l, dia);
          const detalhe = l[pessoa];
          return (
            <div
              key={`${l.hora}-${idx}`}
              className={cn('flex gap-3 rounded-lg px-2.5 py-2 border-l-2', l.destaque ? 'border-primary bg-primary/5' : 'border-transparent')}
            >
              <span className="w-[86px] shrink-0 text-xs font-medium text-muted-foreground tabular-nums pt-0.5">{l.hora}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{l.oque}</p>
                {(fase || detalhe) && (
                  <p className="text-xs text-muted-foreground mt-0.5">{[fase, detalhe].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              {l.agua && l.agua[i] > 0 && (
                <span className="shrink-0 self-start text-[11px] font-medium text-sky-300 bg-sky-500/10 rounded-full px-2 py-0.5 tabular-nums">
                  {l.agua[i] >= 1000 ? litros(l.agua[i]) : `${l.agua[i]} ml`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function CavernaHoje(props: Props) {
  const { dia, pessoa, papel, itens, aguaMl, cargas, onChange, onCarga } = props;
  const meta = metaAgua(dia, papel, pessoa);
  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      <div className="space-y-3 sm:space-y-4">
        <Checklist dia={dia} itens={itens} aguaMl={aguaMl} meta={meta} onChange={onChange} />
        <Agua aguaMl={aguaMl} meta={meta} onAgua={(ml) => onChange(itens, ml)} />
      </div>
      <Roteiro dia={dia} pessoa={pessoa} papel={papel} />
      <Treino dia={dia} pessoa={pessoa} cargas={cargas} onCarga={onCarga} />
    </div>
  );
}
