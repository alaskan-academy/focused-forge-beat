import { isToday, isYesterday, isTomorrow, isThisWeek } from 'date-fns';
import { parseRecurrence } from '@/lib/recurrence';
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
  if (task.status !== 'done' || !task.completed_at) return task.status;

  const recConfig = parseRecurrence(task.recurrence_config);
  if (recConfig.type === 'none') return task.status; // non-recurring keeps real status

  const completedDate = new Date(task.completed_at);

  if (dateFilter === 'today' && isToday(completedDate)) return 'done';
  if (dateFilter === 'yesterday' && isYesterday(completedDate)) return 'done';
  if (dateFilter === 'tomorrow' && isTomorrow(completedDate)) return 'done';
  if (dateFilter === 'week' && isThisWeek(completedDate)) return 'done';
  if (dateFilter === 'custom' && customRange) {
    const from = new Date(customRange.from.getFullYear(), customRange.from.getMonth(), customRange.from.getDate());
    const to = new Date(customRange.to.getFullYear(), customRange.to.getMonth(), customRange.to.getDate(), 23, 59, 59);
    if (completedDate >= from && completedDate <= to) return 'done';
  }

  return 'todo'; // completed outside this period → show as todo
}
