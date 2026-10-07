import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCompletions, getPlannedItems, getPlannedMinutesForDay } from './productivity';
import { fromLocalDateKey } from './recurrence';
import { Task } from './types';

const d = (key: string) => fromLocalDateKey(key);

function task(partial: Partial<Task>): Task {
  return {
    id: Math.random().toString(36).slice(2),
    name: 't',
    area: 'work',
    project_id: null,
    status: 'todo',
    priority: 'medium',
    start_date: null,
    due_date: null,
    estimated_minutes: 0,
    actual_minutes: 0,
    recurrence_config: { type: 'none', interval: 1 },
    notes: null,
    created_at: '2026-09-01T12:00:00Z',
    completed_at: null,
    total_tracked_minutes: 0,
    session_minutes_by_date: {},
    ...partial,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 15, 0)); // Wed 2026-10-07
});
afterEach(() => vi.useRealTimers());

const week = { from: d('2026-10-04'), to: d('2026-10-10') };

describe('productivity', () => {
  const daily = task({
    due_date: '2026-10-01',
    estimated_minutes: 60,
    recurrence_config: { type: 'daily', interval: 1, completed_dates: ['2026-10-04', '2026-10-05'], skipped_dates: ['2026-10-06'] },
  });
  const oneOffDone = task({ due_date: '2026-10-05', status: 'done', completed_at: new Date(2026, 9, 5, 10).toISOString() });
  const oneOffLate = task({ due_date: '2026-10-06' });

  it('counts recurring occurrences as planned work', () => {
    const items = getPlannedItems([daily, oneOffDone, oneOffLate], week);
    const outcomes = items.reduce<Record<string, number>>((acc, i) => ({ ...acc, [i.outcome]: (acc[i.outcome] || 0) + 1 }), {});
    // daily: 04 done, 05 done, 06 skipped, 07–10 upcoming; one-offs: done + missed
    expect(outcomes).toEqual({ done: 3, skipped: 1, upcoming: 4, missed: 1 });
  });

  it('counts recurring completions alongside one-off ones', () => {
    expect(getCompletions([daily, oneOffDone, oneOffLate], week)).toHaveLength(3);
  });

  it('late completions count on the day they were done', () => {
    const weekly = task({
      due_date: '2026-09-07',
      recurrence_config: { type: 'weekly', interval: 1, days_of_week: [1], completed_dates: ['2026-09-28', '2026-10-05'], completed_on: { '2026-09-28': '2026-10-05' } },
    });
    const completions = getCompletions([weekly], { from: d('2026-09-28'), to: d('2026-10-04') });
    expect(completions).toHaveLength(0); // 28/09 was done on 05/10, outside this range
    const next = getCompletions([weekly], { from: d('2026-10-05'), to: d('2026-10-05') });
    expect(next.map((c) => c.dateKey)).toEqual(['2026-10-05', '2026-10-05']);
  });

  it('plans estimated minutes per day, skipping skipped occurrences', () => {
    expect(getPlannedMinutesForDay([daily], d('2026-10-05'))).toBe(60);
    expect(getPlannedMinutesForDay([daily], d('2026-10-06'))).toBe(0);
    const multi = task({ start_date: '2026-10-05', due_date: '2026-10-09', estimated_minutes: 300 });
    expect(getPlannedMinutesForDay([multi], d('2026-10-07'))).toBe(60);
    expect(getPlannedMinutesForDay([multi], d('2026-10-10'))).toBe(0);
  });
});
