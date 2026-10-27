import { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DIAS_SEMANA, META_CHECKLIST, TOTAL_DIAS } from '@/lib/caverna/plano';

interface Props {
  dia: number;
  pontosPorDia: Map<number, number>;
  onIrPara: (dia: number) => void;
  onRecomecar: () => void;
  recomecando: boolean;
}

// Escolhe qualquer dia de 1 a 30 e permite voltar ao dia 1 do zero.
export default function CavernaSeletorDia({ dia, pontosPorDia, onIrPara, onRecomecar, recomecando }: Props) {
  const [aberto, setAberto] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  return (
    <>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="h-9 px-2 flex items-center gap-1 text-sm font-semibold text-foreground tabular-nums min-w-[64px] justify-center hover:text-primary"
            aria-label="Escolher o dia"
          >
            Dia {dia} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[272px] p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Em que dia vocês estão?</p>
          <div className="grid grid-cols-7 gap-1">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="text-center text-[10px] text-muted-foreground">{d.slice(0, 1)}</span>
            ))}
            {Array.from({ length: TOTAL_DIAS }, (_, i) => i + 1).map((d) => {
              const p = pontosPorDia.get(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    onIrPara(d);
                    setAberto(false);
                  }}
                  className={cn(
                    'h-8 rounded-md text-xs tabular-nums transition-colors',
                    d === dia
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : (p ?? 0) >= META_CHECKLIST
                        ? 'bg-status-in-progress/20 text-foreground hover:bg-status-in-progress/30'
                        : 'text-foreground hover:bg-secondary',
                  )}
                  aria-current={d === dia ? 'true' : undefined}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              setConfirmar(true);
            }}
            className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-md border border-border py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Recomeçar do dia 1
          </button>
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recomeçar o Modo Caverna?</AlertDialogTitle>
            <AlertDialogDescription>
              Volta para o dia 1 e apaga o seu checklist, a água e as medidas dos 30 dias. A pessoa, o papel e as suas cargas
              continuam. Só afeta o seu progresso, não o do outro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onRecomecar} disabled={recomecando}>
              Recomeçar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
