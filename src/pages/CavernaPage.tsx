import { useMemo } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Headset, Home, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CavernaDash from '@/components/caverna/CavernaDash';
import CavernaHoje from '@/components/caverna/CavernaHoje';
import CavernaProgresso from '@/components/caverna/CavernaProgresso';
import CavernaRegras from '@/components/caverna/CavernaRegras';
import CavernaSeletorDia from '@/components/caverna/CavernaSeletorDia';
import { useCavernaDias, useCavernaPerfil, useRecomecar, useSalvarDia, useSalvarPerfil } from '@/hooks/useCaverna';
import { DIAS_SEMANA, PESSOAS, TOTAL_DIAS, diaDaSemana, metaAgua, semanaCorrida, type ItemId, type Papel, type Pessoa } from '@/lib/caverna/plano';
import { calcularPontos, calcularSequencia } from '@/lib/caverna/progresso';

function Spinner() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Escolher() {
  const salvar = useSalvarPerfil();
  const escolher = (pessoa: Pessoa) =>
    salvar.mutate({ pessoa, dia_atual: 1, papel: 'suporte', cargas: {} }, { onError: () => toast.error('Erro ao salvar') });
  return (
    <div className="p-3 sm:p-6">
      <div className="mx-auto max-w-md mt-10 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
          <Mountain className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Modo Caverna</h1>
        <p className="mt-1 text-sm text-muted-foreground">30 dias de trabalho focado, comida de verdade, treino e inglês. Quem está usando esta conta?</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {(Object.keys(PESSOAS) as Pessoa[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => escolher(p)}
              disabled={salvar.isPending}
              className="rounded-xl border border-border bg-card px-4 py-4 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary/10 transition-colors"
            >
              {PESSOAS[p].nome}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Define as metas de água e as cargas sugeridas. Cada um só vê o próprio progresso.</p>
      </div>
    </div>
  );
}

export default function CavernaPage() {
  const { data: perfil, isLoading, isError } = useCavernaPerfil();
  const { data: dias } = useCavernaDias();
  const salvarPerfil = useSalvarPerfil();
  const salvarDia = useSalvarDia();
  const recomecar = useRecomecar();

  const pontosPorDia = useMemo(() => new Map((dias ?? []).map((d) => [d.dia, d.pontos])), [dias]);

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <div className="p-6">
        <div className="bg-card border border-destructive/40 rounded-xl p-4 text-sm text-muted-foreground">
          Não foi possível carregar o Modo Caverna. Tente recarregar a página.
        </div>
      </div>
    );
  }
  if (!perfil) return <Escolher />;

  const dia = perfil.dia_atual;
  const registro = (dias ?? []).find((d) => d.dia === dia);
  const itens = registro?.itens ?? {};
  const aguaMl = registro?.agua_ml ?? 0;
  const sequencia = calcularSequencia(pontosPorDia, dia);

  const irPara = (novo: number) => {
    if (novo < 1 || novo > TOTAL_DIAS) return;
    salvarPerfil.mutate({ dia_atual: novo }, { onError: () => toast.error('Erro ao mudar o dia') });
  };

  const recomecarDesafio = () =>
    recomecar.mutate(undefined, {
      onSuccess: () => toast.success('De volta ao dia 1'),
      onError: () => toast.error('Erro ao recomeçar'),
    });

  const mudarPapel = (papel: Papel) => {
    if (papel === perfil.papel) return;
    salvarPerfil.mutate({ papel }, { onError: () => toast.error('Erro ao mudar o papel') });
  };

  const salvarHoje = (novosItens: Partial<Record<ItemId, boolean>>, novaAgua: number) => {
    const meta = metaAgua(dia, perfil.papel, perfil.pessoa);
    salvarDia.mutate(
      { dia, itens: novosItens, agua_ml: novaAgua, pontos: calcularPontos(novosItens, novaAgua, meta) },
      { onError: () => toast.error('Erro ao salvar') },
    );
  };

  const salvarCarga = (id: string, valor: string) => {
    salvarPerfil.mutate({ cargas: { ...perfil.cargas, [id]: valor } }, { onError: () => toast.error('Erro ao salvar a carga') });
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Modo Caverna</h1>
          <p className="text-sm text-muted-foreground">
            {PESSOAS[perfil.pessoa].nome} · {DIAS_SEMANA[diaDaSemana(dia)]} · Semana {semanaCorrida(dia)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-card">
            <button
              type="button"
              onClick={() => irPara(dia - 1)}
              disabled={dia <= 1}
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <CavernaSeletorDia
              dia={dia}
              pontosPorDia={pontosPorDia}
              onIrPara={irPara}
              onRecomecar={recomecarDesafio}
              recomecando={recomecar.isPending}
            />
            <button
              type="button"
              onClick={() => irPara(dia + 1)}
              disabled={dia >= TOTAL_DIAS}
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5" role="radiogroup" aria-label="Papel da semana">
            {([
              { papel: 'casa', label: 'Casa', icon: Home },
              { papel: 'suporte', label: 'Suporte', icon: Headset },
            ] as const).map(({ papel, label, icon: Icon }) => (
              <button
                key={papel}
                type="button"
                role="radio"
                aria-checked={perfil.papel === papel}
                onClick={() => mudarPapel(papel)}
                className={cn(
                  'h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors',
                  perfil.papel === papel ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CavernaDash dia={dia} sequencia={sequencia} pontosPorDia={pontosPorDia} />

      <Tabs defaultValue="hoje" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="progresso">Progresso</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
        </TabsList>
        <TabsContent value="hoje" className="mt-0">
          <CavernaHoje
            dia={dia}
            pessoa={perfil.pessoa}
            papel={perfil.papel}
            itens={itens}
            aguaMl={aguaMl}
            cargas={perfil.cargas ?? {}}
            onChange={salvarHoje}
            onCarga={salvarCarga}
          />
        </TabsContent>
        <TabsContent value="progresso" className="mt-0">
          <CavernaProgresso dia={dia} pontosPorDia={pontosPorDia} />
        </TabsContent>
        <TabsContent value="regras" className="mt-0">
          <CavernaRegras dia={dia} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
