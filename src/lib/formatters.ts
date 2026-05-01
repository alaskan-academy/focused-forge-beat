import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return '0min';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
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
  return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR });
}
