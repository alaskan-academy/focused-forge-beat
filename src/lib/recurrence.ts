export interface RecurrenceConfig {
  type: 'none' | 'daily' | 'weekly' | 'monthly';
  interval: number;
  days_of_week?: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  days_of_month?: number[]; // 1-31
  completed_dates?: string[]; // yyyy-MM-dd, completion per recurring occurrence
  skipped_dates?: string[]; // yyyy-MM-dd, skipped occurrences
  /** Occurrences moved to another day: original date → new date (yyyy-MM-dd). */
  rescheduled?: Record<string, string>;
  /** Last day the recurrence happens (yyyy-MM-dd, inclusive). Set when the recurrence is ended;
   *  past occurrences and their history stay intact. */
  end_date?: string;
  work_block?: string;
  /** Legacy: minutes per occurrence date. No longer written or read — kept so old data survives saves. */
  time_by_date?: Record<string, number>;
  /** Legacy: manual minutes per date. No longer written or read — kept so old data survives saves. */
  time_by_date_manual?: Record<string, number>;
}

export const DEFAULT_RECURRENCE: RecurrenceConfig = { type: 'none', interval: 1 };

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKeyMap(val: unknown): Record<string, string> | undefined {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    if (DATE_KEY.test(k) && typeof v === 'string' && DATE_KEY.test(v)) out[k] = v;
  }
  return out;
}

export function parseRecurrence(val: unknown): RecurrenceConfig {
  if (typeof val === 'string') {
    try {
      return parseRecurrence(JSON.parse(val));
    } catch {
      return DEFAULT_RECURRENCE;
    }
  }
  if (!val || typeof val !== 'object') return DEFAULT_RECURRENCE;
  const obj = val as Record<string, unknown>;
  return {
    type: (['none', 'daily', 'weekly', 'monthly'].includes(obj.type as string) ? obj.type : 'none') as RecurrenceConfig['type'],
    interval: typeof obj.interval === 'number' ? obj.interval : 1,
    days_of_week: Array.isArray(obj.days_of_week) ? obj.days_of_week : [],
    days_of_month: Array.isArray(obj.days_of_month) ? obj.days_of_month : [],
    completed_dates: Array.isArray(obj.completed_dates) ? obj.completed_dates.filter((d): d is string => typeof d === 'string') : [],
    skipped_dates: Array.isArray(obj.skipped_dates) ? obj.skipped_dates.filter((d): d is string => typeof d === 'string') : [],
    rescheduled: parseDateKeyMap(obj.rescheduled),
    end_date: typeof obj.end_date === 'string' && DATE_KEY.test(obj.end_date) ? obj.end_date : undefined,
    work_block: typeof obj.work_block === 'string' ? obj.work_block : undefined,
    // Preserve legacy per-date fields so they survive modal open/save cycles
    time_by_date: obj.time_by_date && typeof obj.time_by_date === 'object' ? obj.time_by_date as Record<string, number> : undefined,
    time_by_date_manual: obj.time_by_date_manual && typeof obj.time_by_date_manual === 'object' ? obj.time_by_date_manual as Record<string, number> : undefined,
  };
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isRecurring(config: unknown): boolean {
  return parseRecurrence(config).type !== 'none';
}

/** Recurring and not ended before today. */
export function isRecurrenceActive(config: unknown, today: Date = new Date()): boolean {
  const parsed = parseRecurrence(config);
  if (parsed.type === 'none') return false;
  return !parsed.end_date || parsed.end_date >= toLocalDateKey(today);
}

export function addSkippedDate(config: unknown, dateKey: string): RecurrenceConfig {
  const parsed = parseRecurrence(config);
  return {
    ...parsed,
    skipped_dates: [...new Set([...(parsed.skipped_dates || []), dateKey])].sort(),
  };
}

export function removeSkippedDate(config: unknown, dateKey: string): RecurrenceConfig {
  const parsed = parseRecurrence(config);
  return {
    ...parsed,
    skipped_dates: (parsed.skipped_dates || []).filter((d) => d !== dateKey),
  };
}

export function addCompletedDate(config: unknown, dateKey: string): RecurrenceConfig {
  const parsed = parseRecurrence(config);
  return {
    ...parsed,
    completed_dates: [...new Set([...(parsed.completed_dates || []), dateKey])].sort(),
  };
}

export function removeCompletedDate(config: unknown, dateKey: string): RecurrenceConfig {
  const parsed = parseRecurrence(config);
  return {
    ...parsed,
    completed_dates: (parsed.completed_dates || []).filter((d) => d !== dateKey),
  };
}

/** Ends the recurrence after `lastDateKey`, keeping completions, skips and the work block. */
export function endRecurrence(config: unknown, lastDateKey: string): RecurrenceConfig {
  return { ...parseRecurrence(config), end_date: lastDateKey };
}

export function resumeRecurrence(config: unknown): RecurrenceConfig {
  const { end_date: _ended, ...rest } = parseRecurrence(config);
  return rest;
}

/**
 * Moves one occurrence to another day. `fromKey` is the date the occurrence currently shows on,
 * which may already be the target of an earlier move — in that case the original date is re-pointed.
 * Moving an occurrence back to its original date removes the move.
 */
export function moveOccurrence(config: unknown, fromKey: string, toKey: string): RecurrenceConfig {
  const parsed = parseRecurrence(config);
  const moves = { ...(parsed.rescheduled || {}) };
  const origin = Object.keys(moves).find((k) => moves[k] === fromKey) ?? fromKey;
  if (origin === toKey) delete moves[origin];
  else moves[origin] = toKey;
  return { ...parsed, rescheduled: moves };
}

export function undoMove(config: unknown, originKey: string): RecurrenceConfig {
  const parsed = parseRecurrence(config);
  const moves = { ...(parsed.rescheduled || {}) };
  delete moves[originKey];
  return { ...parsed, rescheduled: moves };
}

/** If the occurrence shown on `dateKey` was moved there, returns its original date. */
export function getRescheduledFrom(config: unknown, dateKey: string): string | null {
  const moves = parseRecurrence(config).rescheduled || {};
  return Object.keys(moves).find((k) => moves[k] === dateKey) ?? null;
}

export function recurrenceLabel(config: RecurrenceConfig): string {
  if (config.type === 'none') return 'Sem recorrência';

  const interval = config.interval || 1;

  if (config.type === 'daily') {
    return interval === 1 ? 'Diariamente' : `A cada ${interval} dias`;
  }

  if (config.type === 'weekly') {
    const days = (config.days_of_week || []).map((d) => WEEKDAY_LABELS[d]).join(', ');
    const base = interval === 1 ? 'Semanalmente' : `A cada ${interval} semanas`;
    return days ? `${base} (${days})` : base;
  }

  if (config.type === 'monthly') {
    const days = (config.days_of_month || []).join(', ');
    const base = interval === 1 ? 'Mensalmente' : `A cada ${interval} meses`;
    return days ? `${base} (dias ${days})` : base;
  }

  return 'Sem recorrência';
}
