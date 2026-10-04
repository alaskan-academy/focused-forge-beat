import { DateFilter } from '@/lib/types';
import { parseRecurrence, toLocalDateKey } from '@/lib/recurrence';

export interface DayRange {
  from: Date;
  to: Date;
}

export function parseLocalDate(dateValue: string | null | undefined): Date | null {
  if (!dateValue) return null;

  const isoDate = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    const year = Number(isoDate[1]);
    const month = Number(isoDate[2]);
    const day = Number(isoDate[3]);
    const parsed = new Date(year, month - 1, day);

    if (parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day) {
      return parsed;
    }

    return null;
  }

  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Sunday-to-Saturday week containing `date`, matching date-fns' default `isThisWeek`. */
export function getWeekRange(date: Date = new Date()): DayRange {
  const from = addLocalDays(startOfLocalDay(date), -date.getDay());
  return { from, to: addLocalDays(from, 6) };
}

/**
 * The days covered by a date filter, as local midnights (inclusive on both ends).
 * Returns null for a custom filter without a chosen range.
 */
export function getFilterRange(
  dateFilter: DateFilter,
  customRange?: DayRange | null,
): DayRange | null {
  const today = startOfLocalDay(new Date());
  switch (dateFilter) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const d = addLocalDays(today, -1);
      return { from: d, to: d };
    }
    case 'tomorrow': {
      const d = addLocalDays(today, 1);
      return { from: d, to: d };
    }
    case 'week':
      return getWeekRange(today);
    case 'custom':
      if (!customRange) return null;
      return { from: startOfLocalDay(customRange.from), to: startOfLocalDay(customRange.to) };
  }
  return null;
}

export function eachDayOfRange(range: DayRange): Date[] {
  const days: Date[] = [];
  const current = startOfLocalDay(range.from);
  const end = startOfLocalDay(range.to);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/** The single day a filter shows, or null when it spans several days (week, multi-day custom). */
export function getFilterSingleDay(dateFilter: DateFilter, customRange?: DayRange | null): Date | null {
  const range = getFilterRange(dateFilter, customRange);
  if (!range) return null;
  return range.from.getTime() === range.to.getTime() ? range.from : null;
}

/** Short label for the filtered period, used next to per-period values ("2h hoje", "2h em 06/10"). */
export function getFilterLabel(dateFilter: DateFilter, customRange?: DayRange | null): string {
  if (dateFilter === 'today') return 'hoje';
  if (dateFilter === 'yesterday') return 'ontem';
  if (dateFilter === 'tomorrow') return 'amanhã';
  if (dateFilter === 'week') return 'semana';
  const day = getFilterSingleDay(dateFilter, customRange);
  if (day) return `em ${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`;
  return 'período';
}

function rangeDayCount(from: Date, to: Date): number {
  if (to.getTime() < from.getTime()) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
}

/**
 * Returns true if the task's date range [start_date, due_date] overlaps the filter period.
 * When start_date is absent, only due_date is matched.
 */
export function taskDateRangeMatchesFilter(
  task: { due_date: string | null; start_date?: string | null },
  dateFilter: DateFilter,
  customRange?: DayRange | null,
): boolean {
  const dueDate = parseLocalDate(task.due_date);
  if (!dueDate) return false;
  const range = getFilterRange(dateFilter, customRange);
  if (!range) return false;

  const taskEnd = startOfLocalDay(dueDate);
  const startDate = parseLocalDate(task.start_date ?? null);
  const taskStart = startDate ? startOfLocalDay(startDate) : taskEnd;
  return taskStart <= range.to && taskEnd >= range.from;
}

/**
 * Check if a task's completed_at timestamp falls within the given date filter.
 * Used to show overdue tasks completed on the viewed date.
 */
export function completedAtMatchesFilter(
  completedAt: string | null | undefined,
  dateFilter: DateFilter,
  customRange?: DayRange | null,
): boolean {
  if (!completedAt) return false;
  const d = new Date(completedAt);
  if (isNaN(d.getTime())) return false;
  const range = getFilterRange(dateFilter, customRange);
  if (!range) return false;
  return d >= range.from && d < addLocalDays(range.to, 1);
}

function isMultiDayTask(task: { start_date?: string | null; due_date?: string | null }): boolean {
  const s = parseLocalDate(task.start_date);
  const e = parseLocalDate(task.due_date);
  return !!(s && e && startOfLocalDay(e).getTime() > startOfLocalDay(s).getTime());
}

/** Non-recurring task whose start and due dates span more than one day. */
export function isMultiDayNonRecurring(task: {
  start_date?: string | null;
  due_date?: string | null;
  recurrence_config?: unknown;
}): boolean {
  return parseRecurrence(task.recurrence_config).type === 'none' && isMultiDayTask(task);
}

/**
 * Returns the minutes to display for a task given the active date filter.
 *
 * For recurring tasks: reads per-date session data from session_minutes_by_date.
 * For non-recurring tasks with a multi-day date range (start_date + due_date spanning
 * more than one day): also reads per-date sessions, so today's view only shows today's work.
 * For simple non-recurring tasks: returns total_tracked_minutes (all-time total).
 */
export function getTaskDisplayMinutes(
  task: {
    total_tracked_minutes?: number | null;
    session_minutes_by_date?: Record<string, number>;
    recurrence_config?: unknown;
    start_date?: string | null;
    due_date?: string | null;
  },
  dateFilter: DateFilter,
  customRange?: DayRange | null,
): number {
  const recConfig = parseRecurrence(task.recurrence_config);
  if (recConfig.type === 'none' && !isMultiDayTask(task)) {
    return Number(task.total_tracked_minutes ?? 0);
  }

  const range = getFilterRange(dateFilter, customRange);
  if (!range) return 0;
  const sessionsByDate = task.session_minutes_by_date || {};
  return eachDayOfRange(range).reduce((sum, day) => sum + (sessionsByDate[toLocalDateKey(day)] ?? 0), 0);
}

/**
 * Returns the estimated minutes to display for a task given the active date filter.
 *
 * For non-recurring tasks that span multiple days (start_date to due_date), the total
 * estimated_minutes is divided evenly across the range and only the portion that falls
 * within the current filter period is returned. This lets you see "how much estimated
 * work is scheduled for today" instead of the full project total.
 *
 * Recurring tasks and single-day tasks always return estimated_minutes as-is.
 */
export function getDailyEstimatedMinutes(
  task: {
    estimated_minutes?: number | null;
    start_date?: string | null;
    due_date?: string | null;
    recurrence_config?: unknown;
  },
  dateFilter: DateFilter,
  customRange?: DayRange | null,
): number {
  const total = Number(task.estimated_minutes ?? 0);
  if (!total) return 0;
  if (!isMultiDayNonRecurring(task)) return total; // recurring: per occurrence; single-day: whole estimate

  const taskStart = startOfLocalDay(parseLocalDate(task.start_date)!);
  const taskEnd = startOfLocalDay(parseLocalDate(task.due_date)!);
  const range = getFilterRange(dateFilter, customRange);
  if (!range) return total;

  const perDay = total / rangeDayCount(taskStart, taskEnd);
  const overlapStart = taskStart > range.from ? taskStart : range.from;
  const overlapEnd = taskEnd < range.to ? taskEnd : range.to;
  return Math.round(perDay * rangeDayCount(overlapStart, overlapEnd));
}

/**
 * Check if a recurring task has a completed_dates entry within the filter period.
 */
export function recurringCompletedOnFilterDate(
  recurrenceConfig: unknown,
  dateFilter: DateFilter,
  customRange?: DayRange | null,
): boolean {
  const rc = parseRecurrence(recurrenceConfig);
  if (rc.type === 'none') return false;
  const completedDates = rc.completed_dates || [];
  if (completedDates.length === 0) return false;
  const range = getFilterRange(dateFilter, customRange);
  if (!range) return false;

  const fromKey = toLocalDateKey(range.from);
  const toKey = toLocalDateKey(range.to);
  return completedDates.some((d) => d >= fromKey && d <= toKey);
}
