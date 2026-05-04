import { isToday, isYesterday, isTomorrow, isThisWeek } from 'date-fns';
import { DateFilter } from '@/lib/types';

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
