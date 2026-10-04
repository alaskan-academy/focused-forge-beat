import { Task } from '@/lib/types';
import { parseRecurrence, toLocalDateKey } from '@/lib/recurrence';
import { getRecurrenceAnchor, listOccurrenceKeys } from '@/lib/recurrenceExpander';
import { DayRange, getDailyEstimatedMinutes, parseLocalDate, startOfLocalDay } from '@/lib/dateUtils';

/** One planned piece of work: a one-off task due in the period, or one occurrence of a recurring task. */
export interface PlannedItem {
  task: Task;
  /** Day it was planned for (yyyy-MM-dd). */
  dateKey: string;
  outcome: 'done' | 'skipped' | 'missed' | 'upcoming';
}

/** A completion: a one-off task finished, or a recurring occurrence checked off. */
export interface Completion {
  task: Task;
  dateKey: string;
}

/**
 * Everything planned within `range`: one-off tasks by due date, recurring tasks by occurrence.
 * Outcome is judged against `today`: past items not done are "missed", today and later are "upcoming".
 */
export function getPlannedItems(tasks: Task[], range: DayRange, today: Date = new Date()): PlannedItem[] {
  const todayKey = toLocalDateKey(today);
  const fromKey = toLocalDateKey(range.from);
  const toKey = toLocalDateKey(range.to);
  const items: PlannedItem[] = [];

  for (const task of tasks) {
    const rc = parseRecurrence(task.recurrence_config);
    if (rc.type === 'none') {
      if (!task.due_date || task.due_date < fromKey || task.due_date > toKey) continue;
      const outcome = task.status === 'done' ? 'done' : task.due_date < todayKey ? 'missed' : 'upcoming';
      items.push({ task, dateKey: task.due_date, outcome });
      continue;
    }
    const completed = new Set(rc.completed_dates || []);
    const skipped = new Set(rc.skipped_dates || []);
    for (const key of listOccurrenceKeys(rc, getRecurrenceAnchor(task), range.from, range.to)) {
      const outcome = completed.has(key) ? 'done' : skipped.has(key) ? 'skipped' : key < todayKey ? 'missed' : 'upcoming';
      items.push({ task, dateKey: key, outcome });
    }
  }
  return items;
}

/** Completions dated within `range` (one-off by completed_at, recurring by completed occurrence). */
export function getCompletions(tasks: Task[], range: DayRange): Completion[] {
  const fromKey = toLocalDateKey(range.from);
  const toKey = toLocalDateKey(range.to);
  const out: Completion[] = [];
  for (const task of tasks) {
    const rc = parseRecurrence(task.recurrence_config);
    if (rc.type === 'none') {
      if (task.status !== 'done' || !task.completed_at) continue;
      const key = toLocalDateKey(new Date(task.completed_at));
      if (key >= fromKey && key <= toKey) out.push({ task, dateKey: key });
      continue;
    }
    for (const key of rc.completed_dates || []) {
      if (key >= fromKey && key <= toKey) out.push({ task, dateKey: key });
    }
  }
  return out;
}

/** Estimated minutes planned for one day: one-off tasks spread over their days, plus recurring occurrences. */
export function getPlannedMinutesForDay(tasks: Task[], day: Date): number {
  const range = { from: day, to: day };
  const key = toLocalDateKey(day);
  let total = 0;
  for (const task of tasks) {
    const rc = parseRecurrence(task.recurrence_config);
    if (rc.type === 'none') {
      const due = parseLocalDate(task.due_date);
      if (!due) continue;
      const start = parseLocalDate(task.start_date) ?? due;
      if (startOfLocalDay(start) <= day && startOfLocalDay(due) >= day) {
        total += getDailyEstimatedMinutes(task, 'custom', range);
      }
    } else if (!(rc.skipped_dates || []).includes(key)
      && listOccurrenceKeys(rc, getRecurrenceAnchor(task), day, day).length > 0) {
      total += Number(task.estimated_minutes || 0);
    }
  }
  return total;
}

/** Earliest day with any task activity, used as the start of "all time". */
export function getEarliestActivity(tasks: Task[]): Date {
  let earliest = startOfLocalDay(new Date());
  for (const t of tasks) {
    for (const value of [t.created_at, t.due_date]) {
      const d = parseLocalDate(value);
      if (d && d < earliest) earliest = startOfLocalDay(d);
    }
  }
  return earliest;
}
