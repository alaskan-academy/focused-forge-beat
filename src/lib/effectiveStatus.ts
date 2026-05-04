import { parseRecurrence, toLocalDateKey } from '@/lib/recurrence';
import { DateFilter } from '@/lib/types';

/**
 * For recurring tasks, if `completed_at` doesn't fall within the viewed
 * date-filter period the task should appear as "todo" — not "done".
 * Non-recurring tasks keep their real status.
 */
export function getEffectiveStatus(
  task: { status: string; completed_at?: string | null; recurrence_config?: any },
  dateFilter: DateFilter,
  customRange?: { from: Date; to: Date } | null,
): string {
  const recConfig = parseRecurrence(task.recurrence_config);
  if (recConfig.type === 'none') return task.status; // non-recurring keeps real status

  const completedDates = new Set(recConfig.completed_dates || []);
  const skippedDates = new Set(recConfig.skipped_dates || []);
  const hasCompletedOccurrence = (date: Date) => completedDates.has(toLocalDateKey(date));
  const isSkipped = (date: Date) => skippedDates.has(toLocalDateKey(date));

  if (dateFilter === 'today') {
    if (isSkipped(new Date())) return 'skipped';
    return hasCompletedOccurrence(new Date()) ? 'done' : 'todo';
  }
  if (dateFilter === 'yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSkipped(yesterday)) return 'skipped';
    return hasCompletedOccurrence(yesterday) ? 'done' : 'todo';
  }
  if (dateFilter === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSkipped(tomorrow)) return 'skipped';
    return hasCompletedOccurrence(tomorrow) ? 'done' : 'todo';
  }
  if (dateFilter === 'custom' && customRange) {
    const current = new Date(customRange.from.getFullYear(), customRange.from.getMonth(), customRange.from.getDate());
    const end = new Date(customRange.to.getFullYear(), customRange.to.getMonth(), customRange.to.getDate());
    while (current <= end) {
      if (hasCompletedOccurrence(current)) return 'done';
      current.setDate(current.getDate() + 1);
    }
    return 'todo';
  }

  if (dateFilter === 'week') {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      if (hasCompletedOccurrence(day)) return 'done';
    }
  }

  return 'todo'; // completed outside this period → show as todo
}
