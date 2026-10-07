import { getCompletionDays, parseRecurrence, toLocalDateKey } from '@/lib/recurrence';
import { doesRecurrenceMatchDate, getRecurrenceAnchor } from '@/lib/recurrenceExpander';
import { DayRange, eachDayOfRange, getFilterRange } from '@/lib/dateUtils';
import { DateFilter } from '@/lib/types';

export type EffectiveStatus = 'todo' | 'in_progress' | 'done' | 'skipped';

/**
 * Status of a task within the viewed period.
 *
 * Non-recurring tasks keep their real status. Recurring tasks are judged by their occurrences:
 * - single day: done / skipped / todo for that day's occurrence; a day without a pending
 *   occurrence of its own shows done when another occurrence was done that day (late or early);
 * - several days (week, custom range): done when every occurrence in the period is done,
 *   in_progress when only some are, skipped when all were skipped.
 */
export function getEffectiveStatus(
  task: {
    status: string;
    recurrence_config?: unknown;
    due_date?: string | null;
    created_at?: string | null;
  },
  dateFilter: DateFilter,
  customRange?: DayRange | null,
): EffectiveStatus | string {
  const recConfig = parseRecurrence(task.recurrence_config);
  if (recConfig.type === 'none') return task.status;

  const range = getFilterRange(dateFilter, customRange) ?? getFilterRange('today');
  const completed = new Set(recConfig.completed_dates || []);
  const skipped = new Set(recConfig.skipped_dates || []);
  const days = eachDayOfRange(range!);
  const anchor = getRecurrenceAnchor(task);

  if (days.length === 1) {
    const key = toLocalDateKey(days[0]);
    if (completed.has(key)) return 'done';
    if (doesRecurrenceMatchDate(recConfig, anchor, days[0]) && !skipped.has(key)) return 'todo';
    if (getCompletionDays(recConfig).some((c) => c.doneOn === key)) return 'done';
    return skipped.has(key) ? 'skipped' : 'todo';
  }

  const occurrenceKeys = days
    .filter((d) => doesRecurrenceMatchDate(recConfig, anchor, d) || completed.has(toLocalDateKey(d)))
    .map(toLocalDateKey);
  const active = occurrenceKeys.filter((k) => !skipped.has(k));

  if (occurrenceKeys.length > 0 && active.length === 0) return 'skipped';
  const doneCount = active.filter((k) => completed.has(k)).length;
  if (active.length > 0 && doneCount === active.length) return 'done';
  if (doneCount > 0) return 'in_progress';
  return 'todo';
}
