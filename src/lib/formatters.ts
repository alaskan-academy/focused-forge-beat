import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatMinutes(minutes: number | null | undefined): string {
  const total = Math.round(Number(minutes) || 0);
  if (!total) return '0min';
  const sign = total < 0 ? '-' : '';
  const h = Math.floor(Math.abs(total) / 60);
  const m = Math.abs(total) % 60;
  if (h > 0 && m > 0) return `${sign}${h}h ${m}min`;
  if (h > 0) return `${sign}${h}h`;
  return `${sign}${m}min`;
}

/** Minutes as typed in a duration field: 90 → "1h30", 60 → "1h", 45 → "45". */
export function formatDurationInput(minutes: number | null | undefined): string {
  const total = Math.round(Number(minutes) || 0);
  if (total <= 0) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return String(m);
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/**
 * Parses a typed duration into minutes: "90", "1h", "1h30", "1h 30min", "1,5h", "45min", "-15".
 * A leading + or - is kept, so it also reads time adjustments. Returns null when unreadable.
 */
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase().replace(',', '.').replace(/\s+/g, '');
  if (!text) return null;
  const match = text.match(/^([+-]?)(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)(?:min|m)?)?$/);
  if (!match || (match[2] === undefined && match[3] === undefined)) return null;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = match[2] !== undefined ? Number(match[2]) : 0;
  const mins = match[3] !== undefined ? Number(match[3]) : 0;
  return sign * Math.round(hours * 60 + mins);
}

export function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function priorityLabel(p: string) {
  return { high: 'Alta', medium: 'Média', low: 'Baixa' }[p] || p;
}

export function statusLabel(s: string) {
  return { todo: 'A Fazer', in_progress: 'Em Andamento', done: 'Concluída' }[s] || s;
}

export function areaLabel(a: string) {
  return { work: 'Trabalho', personal: 'Pessoal' }[a] || a;
}

export function formatDate(d: string | null) {
  if (!d) return '—';
  const [year, month, day] = d.split('-').map(Number);
  return format(new Date(year, month - 1, day), 'dd/MM/yyyy', { locale: ptBR });
}
