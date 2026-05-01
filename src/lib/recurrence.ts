export interface RecurrenceConfig {
  type: 'none' | 'daily' | 'weekly' | 'monthly';
  interval: number;
  days_of_week?: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  days_of_month?: number[]; // 1-31
}

export const DEFAULT_RECURRENCE: RecurrenceConfig = { type: 'none', interval: 1 };

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function parseRecurrence(val: unknown): RecurrenceConfig {
  if (!val || typeof val !== 'object') return DEFAULT_RECURRENCE;
  const obj = val as Record<string, unknown>;
  return {
    type: (['none', 'daily', 'weekly', 'monthly'].includes(obj.type as string) ? obj.type : 'none') as RecurrenceConfig['type'],
    interval: typeof obj.interval === 'number' ? obj.interval : 1,
    days_of_week: Array.isArray(obj.days_of_week) ? obj.days_of_week : [],
    days_of_month: Array.isArray(obj.days_of_month) ? obj.days_of_month : [],
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
