import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { DateFilter } from '@/lib/types';
import { formatMinutes } from '@/lib/formatters';
import DateFilterBar from '@/components/DateFilterBar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Clock, ListTodo, Loader2, TrendingUp, AlertTriangle, AlertOctagon } from 'lucide-react';
import { isToday, isYesterday, isTomorrow, isThisWeek } from 'date-fns';
import { doesRecurrenceMatchDate } from '@/lib/recurrenceExpander';
import { parseRecurrence } from '@/lib/recurrence';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: tasks } = useTasks();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  const filtered = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (dateFilter === 'custom') return true;

      const recConfig = parseRecurrence((t as any).recurrence_config);
      const isRecurring = recConfig.type !== 'none';

      let dateMatches = false;

      if (t.due_date) {
        const [year, month, day] = t.due_date.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        if (dateFilter === 'today') dateMatches = isToday(d);
        else if (dateFilter === 'yesterday') dateMatches = isYesterday(d);
        else if (dateFilter === 'tomorrow') dateMatches = isTomorrow(d);
        else if (dateFilter === 'week') dateMatches = isThisWeek(d);
      } else if (!t.due_date && !isRecurring) {
        dateMatches = dateFilter === 'today';
      }

      if (!dateMatches && isRecurring) {
        const createdAt = t.due_date || t.created_at;
        if (dateFilter === 'today') {
          dateMatches = doesRecurrenceMatchDate(recConfig, createdAt, new Date());
        } else if (dateFilter === 'yesterday') {
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          dateMatches = doesRecurrenceMatchDate(recConfig, createdAt, yesterday);
        } else if (dateFilter === 'tomorrow') {
          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
          dateMatches = doesRecurrenceMatchDate(recConfig, createdAt, tomorrow);
        } else if (dateFilter === 'week') {
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            if (doesRecurrenceMatchDate(recConfig, createdAt, day)) {
              dateMatches = true;
              break;
            }
          }
        }
      }

      return dateMatches;
    });
  }, [tasks, dateFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter((t) => t.status === 'done').length;
    const inProgress = filtered.filter((t) => t.status === 'in_progress').length;
    const pending = filtered.filter((t) => t.status === 'todo').length;
    const estTotal = filtered.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
    const realTotal = filtered.reduce((s, t) => s + (t.total_tracked_minutes || 0), 0);
    return { total, done, inProgress, pending, estTotal, realTotal };
  }, [filtered]);

  const todayEstimatedMinutes = useMemo(() => {
    if (!tasks) return 0;
    const today = new Date();
    return tasks.filter((t) => {
      if (t.status === 'done') return false;
      const recConfig = parseRecurrence((t as any).recurrence_config);
      const isRecurring = recConfig.type !== 'none';
      if (t.due_date) {
        const [year, month, day] = t.due_date.split('-').map(Number);
        if (isToday(new Date(year, month - 1, day))) return true;
      }
      if (isRecurring) {
        const createdAt = t.due_date || t.created_at;
        return doesRecurrenceMatchDate(recConfig, createdAt, today);
      }
      if (!t.due_date && !isRecurring) return true;
      return false;
    }).reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
  }, [tasks]);

  const todayEstimatedHours = todayEstimatedMinutes / 60;
  const overloadLevel = todayEstimatedHours >= 8 ? 'critical' : todayEstimatedHours >= 6 ? 'warning' : null;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <DateFilterBar value={dateFilter} onChange={setDateFilter} />
      </div>

      {overloadLevel && (
        <Alert variant={overloadLevel === 'critical' ? 'destructive' : 'default'} className={
          overloadLevel === 'warning'
            ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400'
            : ''
        }>
          {overloadLevel === 'critical' ? <AlertOctagon className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertTitle>
            {overloadLevel === 'critical' ? 'Sobrecarga Crítica!' : 'Atenção: Sobrecarga'}
          </AlertTitle>
          <AlertDescription>
            Você tem <strong>{todayEstimatedHours.toFixed(1)}h estimadas</strong> para hoje.{' '}
            {overloadLevel === 'critical'
              ? 'Considere redistribuir ou adiar algumas tarefas para manter a produtividade.'
              : 'O dia está ficando cheio. Priorize o que é mais importante.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListTodo} label="Total" value={stats.total} color="bg-primary/15 text-primary" />
        <StatCard icon={CheckCircle2} label="Concluídas" value={stats.done} color="bg-status-done/15 text-status-done" />
        <StatCard icon={Loader2} label="Em Andamento" value={stats.inProgress} color="bg-status-in-progress/15 text-status-in-progress" />
        <StatCard icon={Clock} label="Pendentes" value={stats.pending} color="bg-status-todo/15 text-status-todo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Tempo do Período</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Estimado</p>
              <p className="text-xl font-bold text-foreground">{formatMinutes(stats.estTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Real</p>
              <p className="text-xl font-bold text-foreground">{formatMinutes(stats.realTotal)}</p>
            </div>
          </div>
          {stats.estTotal > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{Math.min(100, Math.round((stats.realTotal / stats.estTotal) * 100))}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (stats.realTotal / stats.estTotal) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Tarefas Recentes</h2>
          <div className="space-y-3">
            {filtered.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <span className="text-sm text-foreground truncate">{t.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  t.status === 'done' ? 'bg-status-done/15 text-status-done' :
                  t.status === 'in_progress' ? 'bg-status-in-progress/15 text-status-in-progress' :
                  'bg-status-todo/15 text-status-todo'
                }`}>
                  {t.status === 'done' ? 'Concluída' : t.status === 'in_progress' ? 'Em Andamento' : 'A Fazer'}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa no período</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
