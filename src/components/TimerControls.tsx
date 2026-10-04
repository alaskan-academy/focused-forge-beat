import { useState } from 'react';
import { Square, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ActiveTimerSession, MAX_SESSION_MINUTES, useDiscardTimer, useElapsedTime, useStopTimer } from '@/hooks/useTimer';
import { formatMinutes, formatSeconds, parseDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TimerControlsProps {
  session: ActiveTimerSession;
  className?: string;
}

/** Elapsed time plus stop / discard for the running timer. */
export default function TimerControls({ session, className }: TimerControlsProps) {
  const elapsed = useElapsedTime(session.started_at);
  const stopTimer = useStopTimer();
  const discardTimer = useDiscardTimer();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [staleOpen, setStaleOpen] = useState(false);
  const [realTime, setRealTime] = useState('');

  const isStale = elapsed / 60 > MAX_SESSION_MINUTES;
  const busy = stopTimer.isPending || discardTimer.isPending;

  const stop = (minutes?: number) => {
    stopTimer.mutate(
      { session, minutes },
      {
        onSuccess: (saved) => {
          setStaleOpen(false);
          toast.success(`Tempo salvo: ${saved < 1 ? 'menos de 1min' : formatMinutes(saved)}`);
        },
        onError: () => toast.error('Erro ao salvar o tempo'),
      },
    );
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isStale) {
      setRealTime('');
      setStaleOpen(true);
    } else {
      stop();
    }
  };

  const realMinutes = parseDuration(realTime);

  return (
    <div className={cn('flex items-center gap-1.5', className)} onClick={(e) => e.stopPropagation()}>
      {isStale && (
        <span title="Timer ligado há mais de 8h — informe o tempo real ao parar" className="text-yellow-500">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
      )}
      <span className={cn(
        'text-xs font-mono tabular-nums min-w-[52px] text-right',
        isStale ? 'text-yellow-500' : 'text-status-in-progress',
      )}>
        {formatSeconds(elapsed)}
      </span>
      <button
        onClick={handleStop}
        disabled={busy}
        className="p-1.5 rounded-md bg-status-done/20 text-status-done hover:bg-status-done/30 transition-all disabled:opacity-40"
        title="Parar e salvar"
        aria-label="Parar e salvar o tempo"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setConfirmDiscard(true); }}
        disabled={busy}
        className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all disabled:opacity-40"
        title="Descartar este tempo"
        aria-label="Descartar este tempo"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar {formatSeconds(elapsed)} de timer?</AlertDialogTitle>
            <AlertDialogDescription>Esse tempo não será registrado na tarefa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => discardTimer.mutate(session.id, {
                onSuccess: () => toast.info('Tempo descartado'),
                onError: () => toast.error('Erro ao descartar o tempo'),
              })}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={staleOpen} onOpenChange={setStaleOpen}>
        <DialogContent className="sm:max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>O timer ficou ligado por {formatMinutes(elapsed / 60)}</DialogTitle>
            <DialogDescription>Quanto tempo você trabalhou de fato nessa tarefa?</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (realMinutes !== null && realMinutes >= 0) stop(realMinutes);
            }}
            className="space-y-4"
          >
            <Input
              autoFocus
              value={realTime}
              onChange={(e) => setRealTime(e.target.value)}
              placeholder="ex: 2h30 ou 150"
              className="bg-secondary border-border"
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setStaleOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={realMinutes === null || realMinutes < 0 || stopTimer.isPending}>
                Salvar {realMinutes !== null && realMinutes >= 0 ? formatMinutes(realMinutes) : ''}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
