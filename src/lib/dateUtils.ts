import { isToday, isYesterday, isTomorrow, isThisWeek } from 'date-fns';
import { DateFilter } from '@/lib/types';
import { parseRecurrence, toLocalDateKey } from '@/lib/recurrence';

/**
 * Returns true if the task's date range [start_date, due_date] overlaps the filter period.
 * When start_date is absent, falls back to matching only on due_date (original behavior).
 */
export function taskDateRangeMatchesFilter(
  task: { due_date: string | null; start_date?: string | null },
  dateFilter: DateFilter,
  customRange?: { from: Date; to: Date } | null,
): boolean {
  const dueDate = parseLocalDate(task.due_date);
  if (!dueDate) return false;

  const startDate = parseLocalDate(task.start_date ?? null);
  const taskEnd = startOfLocalDay(dueDate);

  if (!startDate) {
    if (dateFilter === 'today') return isToday(dueDate);
    if (dateFilter === 'yesterday') return isYesterday(dueDate);
    if (dateFilter === 'tomorrow') return isTomorrow(dueDate);
    if (dateFilter === 'week') return isThisWeek(dueDate);
    if (dateFilter === 'custom' && customRange) {
      const from = startOfLocalDay(customRange.from);
      const to = startOfLocalDay(customRange.to);
      return taskEnd >= from && taskEnd <= to;
    }
    return false;
  }

  const taskStart = startOfLocalDay(startDate);
  const overlaps = (fStart: Date, fEnd: Date) => taskStart <= fEnd && taskEnd >= fStart;

  if (dateFilter === 'today') {
    const today = startOfLocalDay(new Date());
    return overlaps(today, today);
  }
  if (dateFilter === 'yesterday') {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yd = startOfLocalDay(y);
    return overlaps(yd, yd);
  }
  if (dateFilter === 'tomorrow') {
    const tm = new Date(); tm.setDate(tm.getDate() + 1);
    const tmd = startOfLocalDay(tm);
    return overlaps(tmd, tmd);
  }
  if (dateFilter === 'week') {
    const now = new Date();
    const ws = new Date(now); ws.setDate(now.getDate() - now.getDay());
    const we = new Date(ws); we.setDate(ws.getDate() + 6);
    return overlaps(startOfLocalDay(ws), startOfLocalDay(we));
  }
  if (dateFilter === 'custom' && customRange) {
    return overlaps(startOfLocalDay(customRange.from), startOfLocalDay(customRange.to));
  }
  return false;
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

/**
 * Check if a task's completed_at timestamp falls within the given date filter.
 * Used to show overdue tasks completed on the viewed date.
 */
export function completedAtMatchesFilter(
  completedAt: string | null | undefined,
  dateFilter: DateFilter,
  customRange?: { from: Date; to: Date } | null,
): boolean {
  if (!completedAt) return false;
  const d = new Date(completedAt);
  if (isNaN(d.getTime())) return false;

  if (dateFilter === 'today') return isToday(d);
  if (dateFilter === 'yesterday') return isYesterday(d);
  if (dateFilter === 'tomorrow') return isTomorrow(d);
  if (dateFilter === 'week') return isThisWeek(d);
  if (dateFilter === 'custom' && customRange) {
    const from = startOfLocalDay(customRange.from);
    const to = new Date(customRange.to.getFullYear(), customRange.to.getMonth(), customRange.to.getDate(), 23, 59, 59, 999);
    return d >= from && d <= to;
  }
  return false;
}

/**
 * Check if a recurring task has a completed_dates entry matching the filter date.
 */
export function recurringCompletedOnFilterDate(
  recurrenceConfig: unknown,
  dateFilter: DateFilter,
  customRange?: { from: Date; to: Date } | null,
): boolean {
  const rc = parseRecurrence(recurrenceConfig);
  if (rc.type === 'none') return false;
  const completedDates = rc.completed_dates || [];
  if (completedDates.length === 0) return false;

  const dateSet = new Set(completedDates);

  if (dateFilter === 'today') return dateSet.has(toLocalDateKey(new Date()));
  if (dateFilter === 'yesterday') {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return dateSet.has(toLocalDateKey(y));
  }
  if (dateFilter === 'tomorrow') {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return dateSet.has(toLocalDateKey(t));
  }
  if (dateFilter === 'week') {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      if (dateSet.has(toLocalDateKey(day))) return true;
    }
    return false;
  }
  if (dateFilter === 'custom' && customRange) {
    const current = new Date(customRange.from.getFullYear(), customRange.from.getMonth(), customRange.from.getDate());
    const end = new Date(customRange.to.getFullYear(), customRange.to.getMonth(), customRange.to.getDate());
    while (current <= end) {
      if (dateSet.has(toLocalDateKey(current))) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  }
  return false;
}
