import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useDailyWorkTime } from '@/hooks/useTimerSessions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  subDays, format, isWithinInterval, startOfDay, endOfDay,
} from 'date-fns';
import { isOverdueTask } from '@/lib/overdueUtils';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseLocalDate } from '@/lib/dateUtils';
import { CheckCircle2, Clock, AlertTriangle, ListTodo, TrendingUp, Activity } from 'lucide-react';
import { formatMinutes } from '@/lib/formatters';

const STATUS_COLORS = ['hsl(215,20%,55%)', 'hsl(38,92%,50%)', 'hsl(142,71%,45%)'];
const PRIORITY_COLORS = ['hsl(0,72%,51%)', 'hsl(45,93%,47%)', 'hsl(142,71%,45%)'];

const TOOLTIP_STYLE = {
  background: 'hsl(222,47%,9%)',
  border: '1px solid hsl(222,30%,16%)',
  borderRadius: 8,
  color: 'hsl(210,40%,96%)',
  fontSize: 12,
};

function timeFormatter(v: number) {
  if (!v) return '0m';
  return v >= 60 ? `${Math.round(v / 60)}h${v % 60 ? ` ${v % 60}m` : ''}` : `${v}m`;
}

function EmptyChart({ message = 'Sem dados no período' }: { message?: string }) {
  return (
    <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

type PeriodFilter = '7d' | '30d' | 'all';

export default function ProductivityPage() {
  const { data: tasks } = useTasks();
  const { data: dailyWork7 } = useDailyWorkTime(7);
  const { data: dailyWork30 } = useDailyWorkTime(30);
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [areaFilter, setAreaFilter] = useState<'all' | 'work' | 'personal'>('all');

  const days = period === '7d' ? 7 : period === '30d' ? 30 : null;
  const dailyWork = period === '30d' ? dailyWork30 : dailyWork7;

  // Tasks filtered by area + period (by due_date or completed_at)
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (areaFilter !== 'all' && t.area !== areaFilter) return false;
      if (period === 'all') return true;
      const n = days!;
      const since = startOfDay(subDays(new Date(), n - 1));
      const dueDate = parseLocalDate(t.due_date);
      const completedDate = t.completed_at ? new Date(t.completed_at) : null;
      if (dueDate && dueDate >= since) return true;
      if (completedDate && completedDate >= since) return true;
      if (!dueDate && !completedDate) return true; // tasks without dates always count
      return false;
    });
  }, [tasks, areaFilter, period, days]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.status === 'done').length;
    const inProgress = filteredTasks.filter((t) => t.status === 'in_progress').length;
    const todo = filteredTasks.filter((t) => t.status === 'todo').length;
    const overdue = filteredTasks.filter((t) => isOverdueTask(t)).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const totalEstimated = filteredTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
    const totalTracked = Object.values(dailyWork || {}).reduce((s, v) => s + v, 0);
    return { total, done, inProgress, todo, overdue, pct, totalEstimated, totalTracked };
  }, [filteredTasks, dailyWork]);

  // Daily work time chart — last 7 or 30 days
  const timeChartData = useMemo(() => {
    const n = days ?? 30;
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayTasks = filteredTasks.filter((t) => {
        const dueDate = parseLocalDate(t.due_date);
        if (!dueDate) return false;
        return isWithinInterval(dueDate, { start: startOfDay(day), end: endOfDay(day) });
      });
      result.push({
        day: format(day, n <= 7 ? 'EEE' : 'dd/MM', { locale: ptBR }),
        estimado: dayTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0),
        real: dailyWork?.[dateKey] ?? 0,
      });
    }
    return result;
  }, [filteredTasks, dailyWork, days]);

  const hasTimeData = timeChartData.some((d) => d.estimado > 0 || d.real > 0);

  // Completed per day (uses ALL tasks, not filtered — shows real completion history)
  const completedData = useMemo(() => {
    if (!tasks) return [];
    const n = days ?? 30;
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const count = tasks.filter((t) => {
        if (!t.completed_at) return false;
        if (areaFilter !== 'all' && t.area !== areaFilter) return false;
        return isWithinInterval(new Date(t.completed_at), { start: startOfDay(day), end: endOfDay(day) });
      }).length;
      result.push({
        day: format(day, n <= 7 ? 'EEE' : 'dd/MM', { locale: ptBR }),
        concluidas: count,
      });
    }
    return result;
  }, [tasks, areaFilter, days]);

  const hasCompletedData = completedData.some((d) => d.concluidas > 0);

  // Status distribution (filter out zero values to avoid Pie crash)
  const statusData = useMemo(() => {
    const raw = [
      { name: 'A Fazer', value: stats.todo },
      { name: 'Em Andamento', value: stats.inProgress },
      { name: 'Concluída', value: stats.done },
    ];
    return raw.filter((d) => d.value > 0);
  }, [stats]);

  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    filteredTasks.forEach((t) => {
      if (t.priority && t.priority in counts) counts[t.priority as keyof typeof counts]++;
    });
    const raw = [
      { name: 'Alta', value: counts.high },
      { name: 'Média', value: counts.medium },
      { name: 'Baixa', value: counts.low },
    ];
    return raw.filter((d) => d.value > 0);
  }, [filteredTasks]);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">Produtividade</h1>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-28 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v as 'all' | 'work' | 'personal')}>
            <SelectTrigger className="w-32 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="work">Trabalho</SelectItem>
              <SelectItem value="personal">Pessoal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/15 text-primary shrink-0"><ListTodo className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-bold text-foreground">{stats.total}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-status-done/15 text-status-done shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Concluídas</p><p className="text-lg font-bold text-foreground">{stats.done}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/15 text-destructive shrink-0"><AlertTriangle className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Atrasadas</p><p className="text-lg font-bold text-foreground">{stats.overdue}</p></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-status-in-progress/15 text-status-in-progress shrink-0"><Activity className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Em Andamento</p><p className="text-lg font-bold text-foreground">{stats.inProgress}</p></div>
        </div>
      </div>

      {/* Progress bar + time totals */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Progresso</h2>
          <span className="text-sm font-bold text-primary">{stats.pct}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-status-done rounded-full transition-all" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-muted-foreground">Estimado:</span>
            <span className="font-medium text-foreground">{formatMinutes(stats.totalEstimated)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-status-done shrink-0" />
            <span className="text-muted-foreground">Trabalhado:</span>
            <span className="font-medium text-foreground">{formatMinutes(stats.totalTracked)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tempo trabalhado por dia */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">Tempo Trabalhado por Dia</h2>
          <p className="text-xs text-muted-foreground mb-4">Estimado (por prazo) vs. real (por sessão de timer)</p>
          {!hasTimeData ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,16%)" />
                <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={11} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={11} tickFormatter={timeFormatter} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number, name: string) => [timeFormatter(v), name === 'estimado' ? 'Estimado' : 'Real']}
                />
                <Bar dataKey="estimado" fill="hsl(238,84%,67%)" radius={[4,4,0,0]} name="Estimado" />
                <Bar dataKey="real" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} name="Real" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Concluídas por dia */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">Concluídas por Dia</h2>
          <p className="text-xs text-muted-foreground mb-4">Data real de conclusão de cada tarefa</p>
          {!hasCompletedData ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,16%)" />
                <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={11} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v, 'Concluídas']} />
                <Bar dataKey="concluidas" fill="hsl(142,71%,45%)" radius={[4,4,0,0]} name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Distribuição por Status</h2>
          {statusData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Distribuição por Prioridade</h2>
          {priorityData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[i % PRIORITY_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
