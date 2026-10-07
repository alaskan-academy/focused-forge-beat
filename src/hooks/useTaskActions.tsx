import { useState } from 'react';
import { toast } from 'sonner';
import { useUpdateTask, updateTaskRecurrence } from '@/hooks/useTasks';
import CompletionDateDialog from '@/components/CompletionDateDialog';
import { addCompletedDate, completionDayFor, parseRecurrence, removeCompletedDate, toLocalDateKey } from '@/lib/recurrence';
import { formatDayLabel } from '@/lib/occurrences';
import { Task } from '@/lib/types';
import { UNDO_TOAST_DURATION } from '@/lib/utils';

/** When a task completed while viewing `day` is recorded: now for today, end of that day for past days. */
function completionTimeFor(day: Date | null): string {
  const now = new Date();
  if (!day || toLocalDateKey(day) >= toLocalDateKey(now)) return now.toISOString();
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59).toISOString();
}

/**
 * Completing and reopening tasks from lists. Completion is immediate, with a toast to undo
 * or change the date — no dialog in the way of the common case.
 * Render `dialogs` once in the page.
 */
export function useTaskActions() {
  const updateTask = useUpdateTask();
  const [dateDialog, setDateDialog] = useState<{ task: Task; initialDate: Date } | null>(null);

  const setDone = async (task: Task, completedAt: string) => {
    await updateTask.mutateAsync({ id: task.id, status: 'done', completed_at: completedAt });
  };

  /**
   * Marks a task done or not done.
   * Recurring: `occurrenceKey` is the occurrence affected. `viewedDay` is the day on screen: completions
   * count on it when it's in the past (logging yesterday), otherwise on today — so finishing yesterday's
   * missed occurrence today counts as today's work.
   */
  const toggleDone = async (task: Task, done: boolean, opts: { occurrenceKey?: string | null; viewedDay?: Date | null } = {}) => {
    const rc = parseRecurrence(task.recurrence_config);

    if (rc.type !== 'none') {
      const key = opts.occurrenceKey ?? toLocalDateKey(opts.viewedDay ?? new Date());
      const doneOn = completionDayFor(opts.viewedDay);
      try {
        await updateTask.mutateAsync({
          id: task.id,
          recurrence_config: done
            ? addCompletedDate(task.recurrence_config, key, doneOn)
            : removeCompletedDate(task.recurrence_config, key),
        });
        if (done) {
          const late = doneOn !== key;
          const doneLabel = doneOn === toLocalDateKey(new Date()) ? 'hoje' : `em ${formatDayLabel(doneOn)}`;
          toast.success(late ? `Ocorrência de ${formatDayLabel(key)} concluída ${doneLabel}` : `Concluída · ${formatDayLabel(key)}`, {
            description: task.name,
            duration: UNDO_TOAST_DURATION,
            action: {
              label: 'Desfazer',
              onClick: () => updateTaskRecurrence(task.id, (cfg) => removeCompletedDate(cfg, key))
                .catch(() => toast.error('Erro ao desfazer')),
            },
          });
        }
      } catch {
        toast.error('Erro ao atualizar status');
      }
      return;
    }

    const previous = { status: task.status, completed_at: task.completed_at };
    try {
      if (done) {
        const completedAt = completionTimeFor(opts.viewedDay ?? null);
        await setDone(task, completedAt);
        toast.success('Tarefa concluída', {
          description: task.name,
          duration: UNDO_TOAST_DURATION,
          action: {
            label: 'Alterar data',
            onClick: () => setDateDialog({ task, initialDate: new Date(completedAt) }),
          },
          cancel: {
            label: 'Desfazer',
            onClick: () => updateTask.mutate({ id: task.id, ...previous }),
          },
        });
      } else {
        await updateTask.mutateAsync({ id: task.id, status: 'todo', completed_at: null });
      }
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  /** Non-recurring status pill: A Fazer ↔ Em Andamento. */
  const toggleInProgress = async (task: Task) => {
    try {
      await updateTask.mutateAsync({ id: task.id, status: task.status === 'in_progress' ? 'todo' : 'in_progress' });
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const dialogs = (
    <CompletionDateDialog
      open={!!dateDialog}
      taskName={dateDialog?.task.name || ''}
      initialDate={dateDialog?.initialDate}
      onConfirm={async (completedAt) => {
        if (dateDialog) {
          try {
            await setDone(dateDialog.task, completedAt);
          } catch {
            toast.error('Erro ao alterar a data');
          }
        }
        setDateDialog(null);
      }}
      onCancel={() => setDateDialog(null)}
    />
  );

  return { toggleDone, toggleInProgress, dialogs };
}
