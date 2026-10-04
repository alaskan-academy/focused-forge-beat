import { isBefore, startOfToday } from 'date-fns';
import { parseRecurrence, toLocalDateKey } from './recurrence';
import { doesRecurrenceMatchDate, getRecurrenceAnchor } from './recurrenceExpander';
import { parseLocalDate } from './dateUtils';

/**
 * For recurring tasks: finds the most recently missed occurrence in the
 * past 7 days (not completed, not skipped). Occurrences moved to another
 * day count on their new date.
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
  const anchor = getRecurrenceAnchor(task);

  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toLocalDateKey(d);
    if (
      doesRecurrenceMatchDate(recConfig, anchor, d) &&
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
 * - Daily recurring tasks are NEVER overdue: a missed day simply means the
 *   next occurrence is today — no overdue state needed.
 * - Weekly / monthly recurring tasks: any occurrence in the past 7 days that
 *   was not completed and not skipped counts as overdue.
 * - Non-recurring: has a due_date in the past and is not done.
 */
export function isOverdueTask(task: {
  status?: string;
  due_date?: string | null;
  created_at?: string;
  recurrence_config?: unknown;
}): boolean {
  const recConfig = parseRecurrence(task.recurrence_config);

  if (recConfig.type !== 'none') {
    // Daily tasks restart automatically each day — never mark as overdue
    if (recConfig.type === 'daily') return false;
    return getMissedDateKey(task) !== null;
  }

  const dueDate = parseLocalDate(task.due_date);
  if (!dueDate) return false;
  if (task.status === 'done') return false;
  return isBefore(dueDate, startOfToday());
}
