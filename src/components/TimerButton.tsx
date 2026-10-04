import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveTimer, useStartTimer } from '@/hooks/useTimer';
import TimerControls from '@/components/TimerControls';

interface TimerButtonProps {
  taskId: string;
}

export default function TimerButton({ taskId }: TimerButtonProps) {
  const { data: activeTimer } = useActiveTimer();
  const startTimer = useStartTimer();

  if (activeTimer?.task_id === taskId) {
    return <TimerControls session={activeTimer} />;
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        startTimer.mutate(taskId, {
          onSuccess: ({ closedStale }) => {
            if (closedStale) {
              toast.warning('O timer anterior ficou ligado mais de 8h e foi encerrado sem contar tempo. Ajuste o tempo na tarefa, se precisar.');
            }
          },
          onError: () => toast.error('Erro ao iniciar o timer'),
        });
      }}
      disabled={startTimer.isPending}
      className="p-1.5 rounded-md transition-all bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
      title="Iniciar timer"
      aria-label="Iniciar timer"
    >
      <Play className="h-3.5 w-3.5" />
    </button>
  );
}
