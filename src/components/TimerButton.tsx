import { Play, Pause } from 'lucide-react';
import { useActiveTimer, useStartTimer, useStopTimer, useElapsedTime } from '@/hooks/useTimer';
import { formatSeconds } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface TimerButtonProps {
  taskId: string;
}

export default function TimerButton({ taskId }: TimerButtonProps) {
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  
  const isActive = activeTimer?.task_id === taskId;
  const elapsed = useElapsedTime(isActive ? activeTimer?.started_at ?? null : null);

  const handleClick = () => {
    if (isActive && activeTimer) {
      stopTimer.mutate(activeTimer.id);
    } else {
      startTimer.mutate(taskId);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <span className="text-xs font-mono text-status-in-progress animate-pulse-glow">
          {formatSeconds(elapsed)}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
        className={cn(
          "p-1.5 rounded-md transition-all",
          isActive
            ? "bg-status-in-progress/20 text-status-in-progress hover:bg-status-in-progress/30"
            : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
