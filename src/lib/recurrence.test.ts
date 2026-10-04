import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addCompletedDate,
  endRecurrence,
  getRescheduledFrom,
  isRecurrenceActive,
  moveOccurrence,
  parseRecurrence,
  resumeRecurrence,
  undoMove,
} from './recurrence';
import { doesRecurrenceMatchDate, listOccurrenceKeys } from './recurrenceExpander';
import { getMissedDateKey, isOverdueTask } from './overdueUtils';
import { addSkippedDate, fromLocalDateKey } from './recurrence';
import { resolveOccurrenceKey } from './occurrences';

const day = (key: string) => fromLocalDateKey(key);

// Weekly on Wednesdays, counted from Wed 2026-09-02
const weeklyWed = {
  type: 'weekly' as const,
  interval: 1,
  days_of_week: [3],
  completed_dates: ['2026-09-02'],
  work_block: 'morning',
};
const ANCHOR = '2026-09-02';

describe('parseRecurrence', () => {
  it('keeps moves, end date and the work block', () => {
    const parsed = parseRecurrence({
      ...weeklyWed,
      rescheduled: { '2026-10-07': '2026-10-09', bad: 'x' },
      end_date: '2026-12-31',
    });
    expect(parsed.rescheduled).toEqual({ '2026-10-07': '2026-10-09' });
    expect(parsed.end_date).toBe('2026-12-31');
    expect(parsed.work_block).toBe('morning');
  });
});

describe('moving an occurrence', () => {
  it('shows the occurrence on the new day and hides it on the original', () => {
    const moved = moveOccurrence(weeklyWed, '2026-10-07', '2026-10-09');
    expect(doesRecurrenceMatchDate(moved, ANCHOR, day('2026-10-07'))).toBe(false);
    expect(doesRecurrenceMatchDate(moved, ANCHOR, day('2026-10-09'))).toBe(true);
    // Other weeks are untouched
    expect(doesRecurrenceMatchDate(moved, ANCHOR, day('2026-10-14'))).toBe(true);
    expect(getRescheduledFrom(moved, '2026-10-09')).toBe('2026-10-07');
  });

  it('moving an already moved occurrence re-points the original date', () => {
    const once = moveOccurrence(weeklyWed, '2026-10-07', '2026-10-09');
    const twice = moveOccurrence(once, '2026-10-09', '2026-10-10');
    expect(twice.rescheduled).toEqual({ '2026-10-07': '2026-10-10' });
    expect(doesRecurrenceMatchDate(twice, ANCHOR, day('2026-10-09'))).toBe(false);
    expect(doesRecurrenceMatchDate(twice, ANCHOR, day('2026-10-10'))).toBe(true);
  });

  it('moving back to the original date removes the move', () => {
    const once = moveOccurrence(weeklyWed, '2026-10-07', '2026-10-09');
    const back = moveOccurrence(once, '2026-10-09', '2026-10-07');
    expect(back.rescheduled).toEqual({});
    expect(doesRecurrenceMatchDate(back, ANCHOR, day('2026-10-07'))).toBe(true);
  });

  it('undoMove restores the original day', () => {
    const moved = moveOccurrence(weeklyWed, '2026-10-07', '2026-10-09');
    const undone = undoMove(moved, '2026-10-07');
    expect(doesRecurrenceMatchDate(undone, ANCHOR, day('2026-10-07'))).toBe(true);
    expect(doesRecurrenceMatchDate(undone, ANCHOR, day('2026-10-09'))).toBe(false);
  });

  it('keeps completions and the work block', () => {
    const moved = moveOccurrence(addCompletedDate(weeklyWed, '2026-09-09'), '2026-10-07', '2026-10-09');
    expect(moved.completed_dates).toEqual(['2026-09-02', '2026-09-09']);
    expect(moved.work_block).toBe('morning');
  });

  it('can move the anchor day itself', () => {
    const moved = moveOccurrence(weeklyWed, '2026-09-02', '2026-09-04');
    expect(doesRecurrenceMatchDate(moved, ANCHOR, day('2026-09-02'))).toBe(false);
    expect(doesRecurrenceMatchDate(moved, ANCHOR, day('2026-09-04'))).toBe(true);
  });
});

describe('ending a recurrence', () => {
  it('stops future occurrences but keeps history', () => {
    const ended = endRecurrence(weeklyWed, '2026-10-01');
    expect(doesRecurrenceMatchDate(ended, ANCHOR, day('2026-09-30'))).toBe(true);
    expect(doesRecurrenceMatchDate(ended, ANCHOR, day('2026-10-07'))).toBe(false);
    expect(ended.completed_dates).toEqual(['2026-09-02']);
    expect(ended.work_block).toBe('morning');
    expect(ended.type).toBe('weekly');
  });

  it('isRecurrenceActive and resume', () => {
    const ended = endRecurrence(weeklyWed, '2026-10-01');
    expect(isRecurrenceActive(ended, day('2026-10-01'))).toBe(true);
    expect(isRecurrenceActive(ended, day('2026-10-02'))).toBe(false);
    expect(isRecurrenceActive(resumeRecurrence(ended), day('2026-10-02'))).toBe(true);
    expect(isRecurrenceActive({ type: 'none', interval: 1 })).toBe(false);
  });
});

describe('schedule rules', () => {
  it('biweekly counts weeks from the anchor', () => {
    const biweekly = { type: 'weekly' as const, interval: 2, days_of_week: [4] };
    // Anchor Monday 2026-05-11: Thursday 2026-10-01 is an even week, 2026-10-08 is odd
    expect(doesRecurrenceMatchDate(biweekly, '2026-05-11', day('2026-10-01'))).toBe(true);
    expect(doesRecurrenceMatchDate(biweekly, '2026-05-11', day('2026-10-08'))).toBe(false);
  });

  it('monthly on given days', () => {
    const monthly = { type: 'monthly' as const, interval: 1, days_of_month: [3] };
    expect(doesRecurrenceMatchDate(monthly, '2026-05-05', day('2026-10-03'))).toBe(true);
    expect(doesRecurrenceMatchDate(monthly, '2026-05-05', day('2026-10-04'))).toBe(false);
  });

  it('listOccurrenceKeys respects moves', () => {
    const moved = moveOccurrence(weeklyWed, '2026-10-07', '2026-10-09');
    expect(listOccurrenceKeys(moved, ANCHOR, day('2026-10-05'), day('2026-10-16'))).toEqual([
      '2026-10-09',
      '2026-10-14',
    ]);
  });
});

describe('overdue with moves', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 8, 10, 0)); // Thu 2026-10-08
  });
  afterEach(() => vi.useRealTimers());

  it('a missed Wednesday is overdue', () => {
    const task = { due_date: ANCHOR, recurrence_config: weeklyWed, status: 'todo' };
    expect(getMissedDateKey(task)).toBe('2026-10-07');
    expect(isOverdueTask(task)).toBe(true);
  });

  it('moving the missed occurrence to the future clears the overdue', () => {
    const cfg = moveOccurrence(addCompletedDate(weeklyWed, '2026-09-30'), '2026-10-07', '2026-10-09');
    const task = { due_date: ANCHOR, recurrence_config: cfg, status: 'todo' };
    expect(isOverdueTask(task)).toBe(false);
  });

  it('an ended recurrence is not overdue after its end date', () => {
    const cfg = endRecurrence(addCompletedDate(weeklyWed, '2026-09-30'), '2026-10-06');
    expect(isOverdueTask({ due_date: ANCHOR, recurrence_config: cfg, status: 'todo' })).toBe(false);
  });

  it('without a viewed day, actions go to the next occurrence that was not skipped', () => {
    // Thu 2026-10-08: next Wednesdays are 14/10 (skipped) and 21/10
    const cfg = addSkippedDate(addCompletedDate(weeklyWed, '2026-10-07'), '2026-10-14');
    expect(resolveOccurrenceKey({ due_date: ANCHOR, recurrence_config: cfg })).toBe('2026-10-21');
  });

  it('non-recurring with a past due date is overdue until done', () => {
    expect(isOverdueTask({ due_date: '2026-10-07', status: 'todo', recurrence_config: { type: 'none' } })).toBe(true);
    expect(isOverdueTask({ due_date: '2026-10-07', status: 'done', recurrence_config: { type: 'none' } })).toBe(false);
    expect(isOverdueTask({ due_date: '2026-10-08', status: 'todo', recurrence_config: { type: 'none' } })).toBe(false);
  });
});
