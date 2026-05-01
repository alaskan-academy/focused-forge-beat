import { useState } from 'react';
import { Play, Pause, Save, X } from 'lucide-react';
import { useActiveTimer, useStartTimer, useSaveTimer, useDiscardTimer, useElapsedTime } from '@/hooks/useTimer';
import { formatSeconds } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (paused) {
      // Resume not supported with DB — just start fresh or save
      // For simplicity: if paused and clicking play, resume by restarting
      setPaused(false);
      setPausedAt(null);
      return;
    }
    startTimer.mutate(taskId);
  };

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
      >
        <Play className="h-3.5 w-3.5" />
      </button>
    );
  }

  // Active timer — show time + controls
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span className={cn(
        "text-xs font-mono min-w-[52px] text-right",
        paused ? "text-priority-medium" : "text-status-in-progress animate-pulse-glow"
      )}>
        {formatSeconds(elapsed)}
      </span>

      {paused ? (
        <>
          <button
            onClick={handleSave}
            className="p-1.5 rounded-md bg-status-done/20 text-status-done hover:bg-status-done/30 transition-all"
            title="Salvar tempo"
          >
            <Save className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDiscard}
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
        >
          <Pause className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
