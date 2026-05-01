import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { DateFilter } from '@/lib/types';
import { formatMinutes } from '@/lib/formatters';
import DateFilterBar from '@/components/DateFilterBar';
import { CheckCircle2, Clock, ListTodo, Loader2, TrendingUp } from 'lucide-react';
import { isToday, isYesterday, isTomorrow, isThisWeek } from 'date-fns';

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
      if (!t.due_date) return dateFilter === 'today';
      const d = new Date(t.due_date);
      if (dateFilter === 'today') return isToday(d);
      if (dateFilter === 'yesterday') return isYesterday(d);
      if (dateFilter === 'tomorrow') return isTomorrow(d);
      if (dateFilter === 'week') return isThisWeek(d);
      return true;
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <DateFilterBar value={dateFilter} onChange={setDateFilter} />
      </div>

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
