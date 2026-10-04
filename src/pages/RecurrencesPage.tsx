import { useState, useMemo } from 'react';
import { Plus, Repeat, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks, updateTaskRecurrence } from '@/hooks/useTasks';
import {
  endRecurrence, isRecurrenceActive, parseRecurrence, recurrenceLabel, resumeRecurrence, toLocalDateKey,
} from '@/lib/recurrence';
import { addLocalDays } from '@/lib/dateUtils';
import { formatDayLabel } from '@/lib/occurrences';
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TaskModal from '@/components/TaskModal';
import PriorityBadge from '@/components/PriorityBadge';
import { cn, UNDO_TOAST_DURATION } from '@/lib/utils';

export default function RecurrencesPage() {
  const { data: tasks, isLoading } = useTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showEnded, setShowEnded] = useState(false);
  const [toEnd, setToEnd] = useState<Task | null>(null);
  const [endOpen, setEndOpen] = useState(false);

  const { active, ended } = useMemo(() => {
    const recurring = (tasks || []).filter((t) => parseRecurrence(t.recurrence_config).type !== 'none');
    return {
      active: recurring.filter((t) => isRecurrenceActive(t.recurrence_config)),
      ended: recurring.filter((t) => !isRecurrenceActive(t.recurrence_config)),
    };
  }, [tasks]);

  const list = showEnded ? ended : active;

  const handleEnd = async (task: Task) => {
    const lastKey = toLocalDateKey(addLocalDays(new Date(), -1));
    try {
      await updateTaskRecurrence(task.id, (rc) => endRecurrence(rc, lastKey));
      toast.success('Recorrência encerrada — o histórico foi mantido', {
        description: task.name,
        duration: UNDO_TOAST_DURATION,
        action: {
          label: 'Desfazer',
          onClick: () => updateTaskRecurrence(task.id, resumeRecurrence).catch(() => toast.error('Erro ao desfazer')),
        },
      });
    } catch {
      toast.error('Erro ao encerrar recorrência');
    }
  };

  const handleResume = async (task: Task) => {
    try {
      await updateTaskRecurrence(task.id, resumeRecurrence);
      toast.success('Recorrência retomada', { description: task.name });
    } catch {
      toast.error('Erro ao retomar recorrência');
    }
  };

  const openTask = (t: Task | null) => {
    setEditTask(t);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recorrências</h1>
          <p className="text-sm text-muted-foreground mt-1">{active.length} recorrência(s) ativa(s)</p>
        </div>
        <Button onClick={() => openTask(null)} className="gap-2">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Tarefa Recorrente</span><span className="sm:hidden">Nova</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button variant={!showEnded ? 'default' : 'outline'} size="sm" onClick={() => setShowEnded(false)}>
          Ativas ({active.length})
        </Button>
        <Button variant={showEnded ? 'default' : 'outline'} size="sm" onClick={() => setShowEnded(true)}>
          Encerradas ({ended.length})
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Carregando...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {showEnded ? 'Nenhuma recorrência encerrada' : 'Nenhuma recorrência ativa'}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const config = parseRecurrence(t.recurrence_config);
            const isActive = !showEnded;
            return (
              <div
                key={t.id}
                onClick={() => openTask(t)}
                className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/30 cursor-pointer transition-all"
              >
                <div className={cn('p-2 rounded-lg shrink-0', isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                  <Repeat className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 min-w-0">
                    <span className={cn('font-medium truncate', !isActive && 'text-muted-foreground')}>{t.name}</span>
                    {t.area === 'work' && t.project_name && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-work/15 text-work shrink-0">{t.project_name}</span>
                    )}
                    {t.area === 'personal' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-personal/15 text-personal shrink-0">Pessoal</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className={cn('px-2 py-0.5 rounded-full', isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                      {recurrenceLabel(config)}
                    </span>
                    {config.end_date && (
                      <span>{isActive ? 'Termina' : 'Encerrada'} em {formatDayLabel(config.end_date)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline"><PriorityBadge priority={t.priority || 'medium'} /></span>
                  {isActive ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setToEnd(t); setEndOpen(true); }}
                      title="Encerrar recorrência"
                      aria-label="Encerrar recorrência"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); handleResume(t); }}
                      title="Retomar recorrência"
                      aria-label="Retomar recorrência"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={endOpen} onOpenChange={setEndOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar a recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toEnd?.name}” deixa de aparecer a partir de hoje. As conclusões passadas ficam guardadas e dá para retomar em Encerradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toEnd && handleEnd(toEnd)}
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TaskModal
        key={modalKey}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        task={editTask}
      />
    </div>
  );
}
