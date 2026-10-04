import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  completedAtMatchesFilter,
  getDailyEstimatedMinutes,
  getFilterRange,
  getFilterSingleDay,
  getTaskDisplayMinutes,
  recurringCompletedOnFilterDate,
  taskDateRangeMatchesFilter,
} from './dateUtils';
import { getEffectiveStatus } from './effectiveStatus';
import { taskMatchesDateFilter } from './taskFilter';
import { toLocalDateKey, fromLocalDateKey } from './recurrence';
import { formatMinutes, parseDuration } from './formatters';

const d = (key: string) => fromLocalDateKey(key);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 15, 30)); // Wed 2026-10-07 15:30 local
});
afterEach(() => vi.useRealTimers());

describe('getFilterRange', () => {
  it('maps the fixed filters to days', () => {
    expect(toLocalDateKey(getFilterRange('today')!.from)).toBe('2026-10-07');
    expect(toLocalDateKey(getFilterRange('yesterday')!.from)).toBe('2026-10-06');
    expect(toLocalDateKey(getFilterRange('tomorrow')!.to)).toBe('2026-10-08');
    const week = getFilterRange('week')!;
    expect(toLocalDateKey(week.from)).toBe('2026-10-04'); // Sunday
    expect(toLocalDateKey(week.to)).toBe('2026-10-10'); // Saturday
    expect(getFilterRange('custom', null)).toBeNull();
  });

  it('getFilterSingleDay only for one-day periods', () => {
    expect(toLocalDateKey(getFilterSingleDay('yesterday')!)).toBe('2026-10-06');
    expect(getFilterSingleDay('week')).toBeNull();
    expect(toLocalDateKey(getFilterSingleDay('custom', { from: d('2026-10-20'), to: d('2026-10-20') })!)).toBe('2026-10-20');
  });
});

describe('date matching', () => {
  it('task date range overlaps the period', () => {
    const multi = { start_date: '2026-10-05', due_date: '2026-10-09' };
    expect(taskDateRangeMatchesFilter(multi, 'today')).toBe(true);
    expect(taskDateRangeMatchesFilter({ due_date: '2026-10-08' }, 'today')).toBe(false);
    expect(taskDateRangeMatchesFilter({ due_date: '2026-10-10' }, 'week')).toBe(true);
    expect(taskDateRangeMatchesFilter({ due_date: '2026-10-11' }, 'week')).toBe(false);
  });

  it('completed_at within the day, in local time', () => {
    expect(completedAtMatchesFilter(new Date(2026, 9, 7, 23, 59).toISOString(), 'today')).toBe(true);
    expect(completedAtMatchesFilter(new Date(2026, 9, 8, 0, 0).toISOString(), 'today')).toBe(false);
  });

  it('recurring completions inside the period', () => {
    const rc = { type: 'daily', interval: 1, completed_dates: ['2026-10-05'] };
    expect(recurringCompletedOnFilterDate(rc, 'week')).toBe(true);
    expect(recurringCompletedOnFilterDate(rc, 'today')).toBe(false);
  });
});

describe('taskMatchesDateFilter', () => {
  const weekly = { type: 'weekly', interval: 1, days_of_week: [5] }; // Fridays

  it('shows recurring occurrences in a custom range (day navigation)', () => {
    const task = { due_date: '2026-09-04', recurrence_config: weekly };
    expect(taskMatchesDateFilter(task, 'custom', { from: d('2026-10-09'), to: d('2026-10-09') })).toBe(true);
    expect(taskMatchesDateFilter(task, 'custom', { from: d('2026-10-08'), to: d('2026-10-08') })).toBe(false);
  });

  it('undated non-recurring tasks only show on today', () => {
    const task = { due_date: null, recurrence_config: { type: 'none' } };
    expect(taskMatchesDateFilter(task, 'today')).toBe(true);
    expect(taskMatchesDateFilter(task, 'tomorrow')).toBe(false);
  });

  it('a custom filter without range shows everything', () => {
    expect(taskMatchesDateFilter({ due_date: '2020-01-01' }, 'custom', null)).toBe(true);
  });
});

describe('getEffectiveStatus', () => {
  const daily = (completed: string[], skipped: string[] = []) => ({
    status: 'todo',
    due_date: '2026-10-01',
    recurrence_config: { type: 'daily', interval: 1, completed_dates: completed, skipped_dates: skipped },
  });

  it('single day: done, skipped or todo', () => {
    expect(getEffectiveStatus(daily(['2026-10-07']), 'today')).toBe('done');
    expect(getEffectiveStatus(daily([], ['2026-10-07']), 'today')).toBe('skipped');
    expect(getEffectiveStatus(daily(['2026-10-06']), 'today')).toBe('todo');
  });

  it('week: one completed day is partial, not done', () => {
    expect(getEffectiveStatus(daily(['2026-10-05']), 'week')).toBe('in_progress');
    const all = ['04', '05', '06', '07', '08', '09', '10'].map((x) => `2026-10-${x}`);
    expect(getEffectiveStatus(daily(all), 'week')).toBe('done');
  });

  it('non-recurring keeps its own status', () => {
    expect(getEffectiveStatus({ status: 'in_progress', recurrence_config: { type: 'none' } }, 'week')).toBe('in_progress');
  });
});

describe('time per period', () => {
  const sessions = { '2026-10-06': 30, '2026-10-07': 45 };

  it('multi-day tasks show the viewed day only', () => {
    const task = { start_date: '2026-10-05', due_date: '2026-10-09', total_tracked_minutes: 75, session_minutes_by_date: sessions };
    expect(getTaskDisplayMinutes(task, 'today')).toBe(45);
    expect(getTaskDisplayMinutes(task, 'week')).toBe(75);
  });

  it('single-day tasks show the all-time total', () => {
    expect(getTaskDisplayMinutes({ due_date: '2026-10-07', total_tracked_minutes: 75, session_minutes_by_date: sessions }, 'today')).toBe(75);
  });

  it('estimate is split across the task days', () => {
    const task = { estimated_minutes: 300, start_date: '2026-10-05', due_date: '2026-10-09' };
    expect(getDailyEstimatedMinutes(task, 'today')).toBe(60);
    expect(getDailyEstimatedMinutes(task, 'week')).toBe(300);
    expect(getDailyEstimatedMinutes({ estimated_minutes: 50, due_date: '2026-10-07' }, 'today')).toBe(50);
  });
});

describe('formatters', () => {
  it('formatMinutes rounds before splitting hours', () => {
    expect(formatMinutes(0)).toBe('0min');
    expect(formatMinutes(59.6)).toBe('1h');
    expect(formatMinutes(119.7)).toBe('2h');
    expect(formatMinutes(90)).toBe('1h 30min');
    expect(formatMinutes(-30)).toBe('-30min');
    expect(formatMinutes(553.97)).toBe('9h 14min');
  });

  it('parseDuration reads common formats', () => {
    expect(parseDuration('90')).toBe(90);
    expect(parseDuration('1h30')).toBe(90);
    expect(parseDuration('1h 30min')).toBe(90);
    expect(parseDuration('1,5h')).toBe(90);
    expect(parseDuration('2h')).toBe(120);
    expect(parseDuration('45min')).toBe(45);
    expect(parseDuration('-15')).toBe(-15);
    expect(parseDuration('+30m')).toBe(30);
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('h')).toBeNull();
  });
});
