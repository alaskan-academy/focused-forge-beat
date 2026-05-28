import { useState } from 'react';
import { Play, Pause, Save, X, AlertTriangle } from 'lucide-react';
import { useActiveTimer, useStartTimer, useSaveTimer, useDiscardTimer, useElapsedTime } from '@/hooks/useTimer';
import { formatSeconds } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STALE_THRESHOLD_SECONDS = 8 * 60 * 60; // 8 hours — warn user

interface TimerButtonProps {
  taskId: string;
}

export default function TimerButton({ taskId }: TimerButtonProps) {
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const saveTimer = useSaveTimer();
  const discardTimer = useDiscardTimer();

  const isActive = activeTimer?.task_id === taskId;
  const [paused, setPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const elapsed = useElapsedTime(isActive ? activeTimer?.started_at ?? null : null, paused);

  const isStale = elapsed > STALE_THRESHOLD_SECONDS;

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPaused(true);
    setPausedAt(Date.now());
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeTimer || !pausedAt) return;
    saveTimer.mutate(
      { sessionId: activeTimer.id, pausedAt },
      {
        onSuccess: () => {
          setPaused(false);
          setPausedAt(null);
          toast.success('Tempo salvo!');
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Erro ao salvar tempo');
        },
      }
    );
  };

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeTimer) return;
    discardTimer.mutate(activeTimer.id, {
      onSuccess: () => {
        setPaused(false);
        setPausedAt(null);
        toast.info('Tempo descartado');
      },
    });
  };

  if (!isActive) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); startTimer.mutate(taskId); }}
        className="p-1.5 rounded-md transition-all bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Iniciar timer"
      >
        <Play className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {/* Stale warning */}
      {isStale && (
        <span title="Timer rodando há muito tempo — considere descartar" className="text-yellow-500">
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
      )}

      <span className={cn(
        'text-xs font-mono min-w-[52px] text-right',
        isStale
          ? 'text-yellow-500'
          : paused
            ? 'text-priority-medium'
            : 'text-status-in-progress animate-pulse-glow'
      )}>
        {formatSeconds(elapsed)}
      </span>

      {paused ? (
        <>
          <button
            onClick={handleSave}
            disabled={saveTimer.isPending || isStale}
            className="p-1.5 rounded-md bg-status-done/20 text-status-done hover:bg-status-done/30 transition-all disabled:opacity-40"
            title={isStale ? 'Sessão muito longa — descarte e reinicie' : 'Salvar tempo'}
          >
            <Save className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDiscard}
            disabled={discardTimer.isPending}
            className="p-1.5 rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all"
            title="Descartar tempo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <button
          onClick={handlePause}
          className="p-1.5 rounded-md bg-status-in-progress/20 text-status-in-progress hover:bg-status-in-progress/30 transition-all"
          title="Pausar timer"
        >
          <Pause className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
