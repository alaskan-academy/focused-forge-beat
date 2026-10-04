import { getDay, getDate, isSameDay } from 'date-fns';
import { RecurrenceConfig, parseRecurrence, toLocalDateKey } from './recurrence';
import { parseLocalDate, startOfLocalDay } from './dateUtils';

/** The date a recurring task's schedule is counted from (intervals, first occurrence). */
export function getRecurrenceAnchor(task: { due_date?: string | null; created_at?: string | null }): string {
  return task.due_date || task.created_at || '';
}

/** Whether the recurrence rule itself (ignoring moves and end date) lands on `targetDate`. */
function matchesSchedule(config: RecurrenceConfig, anchor: string, targetDate: Date): boolean {
  const start = parseLocalDate(anchor);
  if (!start) return false;
  const startDate = startOfLocalDay(start);
  const target = startOfLocalDay(targetDate);

  // Target must be on or after the start date
  if (target < startDate) return false;
  // Same day as creation always matches
  if (isSameDay(startDate, target)) return true;

  const interval = config.interval || 1;

  if (config.type === 'daily') {
    const diffDays = Math.round((target.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays % interval === 0;
  }

  if (config.type === 'weekly') {
    const targetDayOfWeek = getDay(target);
    const daysOfWeek = config.days_of_week?.length ? config.days_of_week : [getDay(startDate)];
    if (!daysOfWeek.includes(targetDayOfWeek)) return false;

    const diffDays = Math.round((target.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    return diffWeeks % interval === 0;
  }

  if (config.type === 'monthly') {
    const targetDayOfMonth = getDate(target);
    const daysOfMonth = config.days_of_month?.length ? config.days_of_month : [getDate(startDate)];
    if (!daysOfMonth.includes(targetDayOfMonth)) return false;

    const diffMonths = (target.getFullYear() - startDate.getFullYear()) * 12 + (target.getMonth() - startDate.getMonth());
    return diffMonths > 0 && diffMonths % interval === 0;
  }

  return false;
}

/**
 * Given a recurring task, check if it "occurs" on a specific target date.
 * Respects occurrences moved to another day and the recurrence end date.
 * This allows showing the task on every applicable day without DB duplication.
 */
export function doesRecurrenceMatchDate(
  config: RecurrenceConfig,
  anchor: string,
  targetDate: Date
): boolean {
  if (config.type === 'none') return false;
  const key = toLocalDateKey(targetDate);
  if (config.end_date && key > config.end_date) return false;

  const moves = config.rescheduled || {};
  if (Object.values(moves).includes(key)) return true; // an occurrence was moved here
  if (key in moves) return false; // this occurrence was moved away

  return matchesSchedule(config, anchor, targetDate);
}

/**
 * Check if a recurring task should appear on any date within a range.
 */
export function doesRecurrenceMatchDateRange(
  config: RecurrenceConfig,
  anchor: string,
  startDate: Date,
  endDate: Date
): boolean {
  const current = startOfLocalDay(startDate);
  const end = startOfLocalDay(endDate);
  while (current <= end) {
    if (doesRecurrenceMatchDate(config, anchor, current)) return true;
    current.setDate(current.getDate() + 1);
  }
  return false;
}

/** Date keys (yyyy-MM-dd) of every occurrence between `from` and `to`, inclusive. */
export function listOccurrenceKeys(
  recurrenceConfig: unknown,
  anchor: string,
  from: Date,
  to: Date
): string[] {
  const config = parseRecurrence(recurrenceConfig);
  const keys: string[] = [];
  const current = startOfLocalDay(from);
  const end = startOfLocalDay(to);
  while (current <= end) {
    if (doesRecurrenceMatchDate(config, anchor, current)) keys.push(toLocalDateKey(current));
    current.setDate(current.getDate() + 1);
  }
  return keys;
}
