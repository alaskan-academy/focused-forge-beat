import { DateFilter, Task } from '@/lib/types';
import { parseRecurrence, toLocalDateKey } from '@/lib/recurrence';
import { doesRecurrenceMatchDate, getRecurrenceAnchor, listOccurrenceKeys } from '@/lib/recurrenceExpander';
import { getEffectiveStatus } from '@/lib/effectiveStatus';
import {
  DayRange,
  completedAtMatchesFilter,
  eachDayOfRange,
  getFilterRange,
  recurringCompletedOnFilterDate,
  taskDateRangeMatchesFilter,
} from '@/lib/dateUtils';

interface FilterableTask {
  due_date: string | null;
  start_date?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  recurrence_config?: unknown;
}

/**
 * Whether a task belongs to the viewed period:
 * - recurring: has an occurrence (or a completed occurrence) on one of the period's days;
 * - non-recurring: its date range overlaps the period, it was completed in the period,
 *   or it has no due date and the period is today.
 * A custom filter without a chosen range shows everything.
 */
export function taskMatchesDateFilter(
  task: FilterableTask,
  dateFilter: DateFilter,
  customRange?: DayRange | null,
): boolean {
  const range = getFilterRange(dateFilter, customRange);
  if (!range) return true;

  const recConfig = parseRecurrence(task.recurrence_config);
  if (recConfig.type !== 'none') {
    const anchor = getRecurrenceAnchor(task);
    if (eachDayOfRange(range).some((day) => doesRecurrenceMatchDate(recConfig, anchor, day))) return true;
    return recurringCompletedOnFilterDate(recConfig, dateFilter, customRange);
  }

  if (taskDateRangeMatchesFilter(task, dateFilter, customRange)) return true;
  if (!task.due_date && dateFilter === 'today') return true;
  return completedAtMatchesFilter(task.completed_at, dateFilter, customRange);
}

export interface TaskInPeriod {
  task: Task;
  /** Status within the period (see getEffectiveStatus). */
  status: string;
  /** Recurring: the occurrence that completing the row affects. */
  occurrenceKey: string | null;
}

/**
 * For a recurring task in a period: the period's day when it is a single day, otherwise its
 * first pending occurrence from today on (or the first pending one, or the last one).
 */
export function getPeriodOccurrenceKey(task: Task, dateFilter: DateFilter, customRange?: DayRange | null): string | null {
  const rc = parseRecurrence(task.recurrence_config);
  if (rc.type === 'none') return null;
  const range = getFilterRange(dateFilter, customRange) ?? getFilterRange('today')!;
  if (range.from.getTime() === range.to.getTime()) return toLocalDateKey(range.from);

  const keys = listOccurrenceKeys(rc, getRecurrenceAnchor(task), range.from, range.to);
  const closed = new Set([...(rc.completed_dates || []), ...(rc.skipped_dates || [])]);
  const pending = keys.filter((k) => !closed.has(k));
  const todayKey = toLocalDateKey(new Date());
  return pending.find((k) => k >= todayKey) ?? pending[0] ?? keys[keys.length - 1] ?? null;
}

/** Tasks shown in a period with their status there; occurrences skipped in the period are left out. */
export function getTasksForPeriod(tasks: Task[], dateFilter: DateFilter, customRange?: DayRange | null): TaskInPeriod[] {
  return tasks
    .filter((t) => taskMatchesDateFilter(t, dateFilter, customRange))
    .map((task) => ({
      task,
      status: getEffectiveStatus(task, dateFilter, customRange),
      occurrenceKey: getPeriodOccurrenceKey(task, dateFilter, customRange),
    }))
    .filter((t) => t.status !== 'skipped');
}
