import { CalendarClock, Repeat } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import PriorityBadge from '@/components/PriorityBadge';
import TimerButton from '@/components/TimerButton';
import EditableActualMinutes from '@/components/EditableActualMinutes';
import { cn } from '@/lib/utils';
import { formatDate, formatMinutes, statusLabel } from '@/lib/formatters';
import { formatDayLabel } from '@/lib/occurrences';
import { getRescheduledFrom, parseRecurrence, toLocalDateKey } from '@/lib/recurrence';
import {
  DayRange, getDailyEstimatedMinutes, getFilterLabel, getFilterSingleDay, getTaskDisplayMinutes, isMultiDayNonRecurring,
} from '@/lib/dateUtils';
import { DateFilter, Task } from '@/lib/types';

interface TaskRowProps {
  task: Task;
  /** Status within the viewed period. */
  status: string;
  dateFilter: DateFilter;
  customRange: DayRange | null;
  /** Recurring: the occurrence the checkbox completes (and that a missed row refers to). */
  occurrenceKey?: string | null;
  /** Overdue list styling: shows the missed day / due date in red. */
  overdue?: boolean;
  /** Show project / area chips (hidden in the denser dashboard blocks). */
  showContext?: boolean;
  onOpen: (task: Task) => void;
  onToggleDone: (task: Task, done: boolean, occurrenceKey: string | null) => void;
  onToggleInProgress?: (task: Task) => void;
}

/** One task in a list: checkbox, name, dates, estimated vs. tracked time, priority and timer. */
export default function TaskRow({
  task, status, dateFilter, customRange, occurrenceKey = null, overdue = false, showContext = true,
  onOpen, onToggleDone, onToggleInProgress,
}: TaskRowProps) {
  const isRecurring = parseRecurrence(task.recurrence_config).type !== 'none';
  const isMultiDay = isMultiDayNonRecurring(task);
  const isDone = status === 'done';
  const periodLabel = getFilterLabel(dateFilter, customRange);

  const estTotal = task.estimated_minutes || 0;
  const estPeriod = getDailyEstimatedMinutes(task, dateFilter, customRange);
  const realTotal = isRecurring ? 0 : Number(task.total_tracked_minutes || 0);
  const realPeriod = getTaskDisplayMinutes(task, dateFilter, customRange);

  // Manual time goes to the viewed day (or the missed occurrence for overdue rows)
  const singleDay = getFilterSingleDay(dateFilter, customRange);
  const timeDayKey = overdue && occurrenceKey ? occurrenceKey : singleDay ? toLocalDateKey(singleDay) : undefined;

  const movedFrom = occurrenceKey ? getRescheduledFrom(task.recurrence_config, occurrenceKey) : null;

  return (
    <div
      onClick={() => onOpen(task)}
      className={cn(
        'flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors border',
        overdue
          ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40'
          : 'bg-card border-border hover:border-primary/30',
      )}
    >
      <Checkbox
        checked={isDone}
        onCheckedChange={(checked) => onToggleDone(task, checked === true, occurrenceKey)}
        onClick={(e) => e.stopPropagation()}
        aria-label={isDone ? `Reabrir ${task.name}` : `Concluir ${task.name}`}
        className={cn(
          'mt-0.5 h-5 w-5 rounded-full border-2 shrink-0',
          overdue ? 'border-destructive' : 'data-[state=checked]:bg-status-done data-[state=checked]:border-status-done',
        )}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className={cn('flex-1 min-w-0 text-sm font-medium truncate', isDone ? 'line-through text-muted-foreground' : 'text-foreground')}>
            {task.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isRecurring && !isDone && onToggleInProgress && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleInProgress(task); }}
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full transition-all hover:opacity-80',
                  status === 'in_progress' ? 'bg-status-in-progress/15 text-status-in-progress' : 'bg-status-todo/15 text-status-todo',
                )}
                title={status === 'in_progress' ? 'Voltar para A Fazer' : 'Marcar Em Andamento'}
              >
                {statusLabel(status)}
              </button>
            )}
            <span className="hidden sm:inline"><PriorityBadge priority={task.priority || 'medium'} /></span>
            {!isDone && <TimerButton taskId={task.id} />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
          {showContext && task.area === 'work' && task.project_name && <span className="text-work">{task.project_name}</span>}
          {showContext && task.area === 'personal' && <span className="text-personal">Pessoal</span>}
          <span className="sm:hidden"><PriorityBadge priority={task.priority || 'medium'} /></span>
          {overdue && isRecurring && occurrenceKey && (
            <span className="text-destructive font-medium">Perdida: {formatDayLabel(occurrenceKey)}</span>
          )}
          {overdue && !isRecurring && task.due_date && (
            <span className="text-destructive font-medium">Prazo: {formatDate(task.due_date)}</span>
          )}
          {!overdue && !isRecurring && (task.start_date && task.due_date
            ? <span>{formatDate(task.start_date)} → {formatDate(task.due_date)}</span>
            : task.due_date ? <span>Prazo: {formatDate(task.due_date)}</span> : null)}
          {isRecurring && (
            <span className="inline-flex items-center gap-1 text-primary/80"><Repeat className="h-3 w-3" /> Recorrente</span>
          )}
          {movedFrom && (
            <span className="inline-flex items-center gap-1 text-primary">
              <CalendarClock className="h-3 w-3" /> Remarcada de {formatDayLabel(movedFrom)}
            </span>
          )}
          {isDone && task.completed_at && !isRecurring && (
            <span className="text-status-done">
              ✓ {new Date(task.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>

        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="whitespace-nowrap">
            Est{' '}
            <span className="font-medium text-foreground/80">{estTotal ? formatMinutes(estTotal) : '—'}</span>
            {isMultiDay && (
              <> · <span className="font-medium text-foreground/80">{estPeriod ? formatMinutes(estPeriod) : '—'}</span> {periodLabel}</>
            )}
          </span>
          <span className="whitespace-nowrap inline-flex items-center gap-1">
            Real
            {isMultiDay && (
              <><span className="font-medium text-foreground/80">{realTotal ? formatMinutes(realTotal) : '—'}</span> ·</>
            )}
            <span className="font-medium text-foreground/80">
              <EditableActualMinutes taskId={task.id} value={realPeriod} dateKey={timeDayKey} />
            </span>
            {(isMultiDay || isRecurring) && <span>{periodLabel}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
