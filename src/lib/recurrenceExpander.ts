import { getDay, getDate, isSameDay } from 'date-fns';
import { RecurrenceConfig, parseRecurrence } from './recurrence';
import { parseLocalDate, startOfLocalDay } from './dateUtils';

/**
 * Given a recurring task, check if it "occurs" on a specific target date.
 * This allows showing the task on every applicable day without DB duplication.
 */
export function doesRecurrenceMatchDate(
  config: RecurrenceConfig,
  taskCreatedAt: string,
  targetDate: Date
): boolean {
  if (config.type === 'none') return false;

  const start = parseLocalDate(taskCreatedAt);
  if (!start) return false;
  // Normalize to date-only for comparison
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
 * Check if a recurring task should appear on any date within a range.
 */
export function doesRecurrenceMatchDateRange(
  config: RecurrenceConfig,
  taskCreatedAt: string,
  startDate: Date,
  endDate: Date
): boolean {
  const current = new Date(startDate);
  while (current <= endDate) {
    if (doesRecurrenceMatchDate(config, taskCreatedAt, current)) return true;
    current.setDate(current.getDate() + 1);
  }
  return false;
}
