export interface RecurrenceConfig {
  type: 'none' | 'daily' | 'weekly' | 'monthly';
  interval: number;
  days_of_week?: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  days_of_month?: number[]; // 1-31
  completed_dates?: string[]; // yyyy-MM-dd, completion per recurring occurrence
  skipped_dates?: string[]; // yyyy-MM-dd, skipped occurrences
  work_block?: string;
}

export const DEFAULT_RECURRENCE: RecurrenceConfig = { type: 'none', interval: 1 };

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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
    work_block: typeof obj.work_block === 'string' ? obj.work_block : undefined,
  };
}

export function addSkippedDate(config: unknown, dateKey: string): RecurrenceConfig {
  const parsed = parseRecurrence(config);
  return {
    ...parsed,
    skipped_dates: [...new Set([...(parsed.skipped_dates || []), dateKey])].sort(),
  };
}

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
