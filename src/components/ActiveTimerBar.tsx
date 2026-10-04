import { Timer } from 'lucide-react';
import { useActiveTimer } from '@/hooks/useTimer';
import { useTasks } from '@/hooks/useTasks';
import TimerControls from '@/components/TimerControls';
import { cn } from '@/lib/utils';

/**
 * The running timer, visible on every page: a card in the desktop sidebar,
 * a bar pinned to the top of the content on mobile.
 */
export default function ActiveTimerBar({ variant }: { variant: 'sidebar' | 'mobile' }) {
  const { data: session } = useActiveTimer();
  const { data: tasks } = useTasks();
  if (!session) return null;

  const taskName = tasks?.find((t) => t.id === session.task_id)?.name ?? 'Tarefa';

  if (variant === 'sidebar') {
    return (
      <div className="mx-3 mb-3 rounded-lg border border-status-in-progress/30 bg-status-in-progress/10 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-status-in-progress font-medium">
          <Timer className="h-3.5 w-3.5" /> Timer rodando
        </div>
        <p className="text-sm text-foreground truncate" title={taskName}>{taskName}</p>
        <TimerControls session={session} className="justify-end" />
      </div>
    );
  }

  return (
    <div className={cn(
      'md:hidden sticky top-0 z-30 flex items-center gap-2 px-3 py-2',
      'bg-card/95 backdrop-blur border-b border-status-in-progress/30',
    )}>
      <Timer className="h-4 w-4 text-status-in-progress shrink-0" />
      <span className="flex-1 min-w-0 text-sm text-foreground truncate">{taskName}</span>
      <TimerControls session={session} />
    </div>
  );
}
