import { isBefore, startOfToday } from 'date-fns';
import { parseRecurrence, toLocalDateKey } from './recurrence';
import { doesRecurrenceMatchDate } from './recurrenceExpander';
import { parseLocalDate } from './dateUtils';
import { getEffectiveStatus } from './effectiveStatus';

/**
 * For recurring tasks: finds the most recently missed occurrence in the
 * past 7 days (not completed, not skipped).
 * Returns the date key (YYYY-MM-DD) or null if none found.
 */
export function getMissedDateKey(task: {
  due_date?: string | null;
  created_at?: string;
  recurrence_config?: unknown;
}): string | null {
  const recConfig = parseRecurrence(task.recurrence_config);
  if (recConfig.type === 'none') return null;

  const completedDates = new Set(recConfig.completed_dates || []);
  const skippedDates = new Set(recConfig.skipped_dates || []);
  const createdAt = (task.due_date || task.created_at) ?? '';

  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toLocalDateKey(d);
    if (
      doesRecurrenceMatchDate(recConfig, createdAt, d) &&
      !completedDates.has(key) &&
      !skippedDates.has(key)
    ) {
      return key;
    }
  }
  return null;
}

/**
 * Returns true if a task should appear in the "Atrasadas" section.
 * Works for both recurring and non-recurring tasks.
 *
 * - Recurring: any occurrence in the past 7 days that was not completed
 *   and not skipped counts as overdue.
 * - Non-recurring: has a due_date in the past and is not done/skipped.
 */
export function isOverdueTask(task: any): boolean {
  const recConfig = parseRecurrence(task.recurrence_config);
  const isRecurring = recConfig.type !== 'none';

  if (isRecurring) {
    return getMissedDateKey(task) !== null;
  }

  const dueDate = parseLocalDate(task.due_date);
  if (!dueDate) return false;
  if (task.status === 'done') return false;

  const effStatus = getEffectiveStatus(task, 'custom', { from: dueDate, to: dueDate });
  if (effStatus === 'done' || effStatus === 'skipped') return false;

  return isBefore(dueDate, startOfToday());
}
