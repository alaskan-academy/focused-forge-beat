import { format } from 'date-fns';
import { WEEKDAY_LABELS, fromLocalDateKey, parseRecurrence, toLocalDateKey } from './recurrence';
import { doesRecurrenceMatchDate, getRecurrenceAnchor, listOccurrenceKeys } from './recurrenceExpander';
import { getMissedDateKey } from './overdueUtils';
import { addLocalDays, startOfLocalDay } from './dateUtils';

interface RecurringTaskLike {
  due_date?: string | null;
  created_at?: string;
  recurrence_config?: unknown;
}

/** "qua, 07/10" */
export function formatDayLabel(dateKey: string): string {
  const date = fromLocalDateKey(dateKey);
  return `${WEEKDAY_LABELS[date.getDay()].toLowerCase()}, ${format(date, 'dd/MM')}`;
}

/**
 * Which occurrence of a recurring task an action (complete, skip, move) applies to:
 * the viewed day if the task occurs (or was completed) then, otherwise the most recent
 * missed occurrence, otherwise the next upcoming one.
 */
export function resolveOccurrenceKey(task: RecurringTaskLike, contextDate?: Date | null): string | null {
  const rc = parseRecurrence(task.recurrence_config);
  if (rc.type === 'none') return null;
  const anchor = getRecurrenceAnchor(task);

  if (contextDate) {
    const key = toLocalDateKey(contextDate);
    if (doesRecurrenceMatchDate(rc, anchor, contextDate) || (rc.completed_dates || []).includes(key)) return key;
  }
  const missed = getMissedDateKey(task);
  if (missed) return missed;
  const today = startOfLocalDay(new Date());
  return listOccurrenceKeys(rc, anchor, today, addLocalDays(today, 60))[0] ?? null;
}

/** Occurrences that can still be moved: from a week ago to two months ahead, not done or skipped. */
export function listMovableOccurrences(task: RecurringTaskLike): string[] {
  const rc = parseRecurrence(task.recurrence_config);
  if (rc.type === 'none') return [];
  const today = startOfLocalDay(new Date());
  const done = new Set([...(rc.completed_dates || []), ...(rc.skipped_dates || [])]);
  return listOccurrenceKeys(rc, getRecurrenceAnchor(task), addLocalDays(today, -7), addLocalDays(today, 60))
    .filter((k) => !done.has(k));
}

/** Whether the task already has an occurrence on `date` (so another one can't be moved there). */
export function hasOccurrenceOn(task: RecurringTaskLike, date: Date): boolean {
  return doesRecurrenceMatchDate(parseRecurrence(task.recurrence_config), getRecurrenceAnchor(task), date);
}
