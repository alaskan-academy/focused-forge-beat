import { useCallback, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertTriangle, Target } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useDailyWorkTime } from '@/hooks/useTimerSessions';
import { isOverdueTask } from '@/lib/overdueUtils';
import { WEEKDAY_LABELS, toLocalDateKey } from '@/lib/recurrence';
import { addLocalDays, eachDayOfRange, startOfLocalDay } from '@/lib/dateUtils';
import { getCompletions, getEarliestActivity, getPlannedItems, getPlannedMinutesForDay } from '@/lib/productivity';
import { formatMinutes } from '@/lib/formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Colors are tied to the category name, so hiding an empty category never shifts them
const OUTCOME_COLORS: Record<string, string> = {
  Concluídas: 'hsl(142,71%,45%)',
  'Não feitas': 'hsl(0,72%,51%)',
  Puladas: 'hsl(215,20%,55%)',
};
const PRIORITY_COLORS: Record<string, string> = {
  Alta: 'hsl(0,72%,51%)',
  Média: 'hsl(45,93%,47%)',
  Baixa: 'hsl(142,71%,45%)',
};

const TOOLTIP_STYLE = {
  background: 'hsl(222,47%,9%)',
  border: '1px solid hsl(222,30%,16%)',
  borderRadius: 8,
  color: 'hsl(210,40%,96%)',
  fontSize: 12,
};

// Day-by-day charts never show more than this many days, even for "Tudo"
const MAX_CHART_DAYS = 30;

/** "ter" for a week of bars, "06/10" for longer periods. */
function dayAxisLabel(day: Date, short: boolean) {
  return short ? WEEKDAY_LABELS[day.getDay()].toLowerCase() : format(day, 'dd/MM');
}

/** Compact axis ticks: "45min", "2h", "7.5h". */
function axisHours(minutes: number) {
  return minutes >= 60 ? `${+(minutes / 60).toFixed(1)}h` : `${minutes}min`;
}

function EmptyChart({ message = 'Sem dados no período' }: { message?: string }) {
  return (
    <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }: {
  icon: typeof Clock; label: string; value: string | number; hint?: string; tone: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${tone}`}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </div>
  );
}

type PeriodFilter = '7d' | '30d' | 'all';

export default function ProductivityPage() {
  const { data: allTasks } = useTasks();
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [areaFilter, setAreaFilter] = useState<'all' | 'work' | 'personal'>('all');
  const { data: workByDay } = useDailyWorkTime(period === '7d' ? 7 : period === '30d' ? 30 : null);

  const tasks = useMemo(
    () => (allTasks || []).filter((t) => areaFilter === 'all' || t.area === areaFilter),
    [allTasks, areaFilter],
  );
  const taskIds = useMemo(() => new Set(tasks.map((t) => t.id)), [tasks]);

  const range = useMemo(() => {
    const today = startOfLocalDay(new Date());
    if (period === 'all') return { from: getEarliestActivity(allTasks || []), to: today };
    return { from: addLocalDays(today, period === '7d' ? -6 : -29), to: today };
  }, [period, allTasks]);

  /** Minutes tracked on a day for the tasks in the area filter. */
  const workedOn = useCallback((dateKey: string) => {
    const day = workByDay?.[dateKey] || {};
    return Object.entries(day).reduce((s, [taskId, m]) => (areaFilter === 'all' || taskIds.has(taskId) ? s + m : s), 0);
  }, [workByDay, areaFilter, taskIds]);

  const stats = useMemo(() => {
    const planned = getPlannedItems(tasks, range);
    const past = planned.filter((p) => p.outcome !== 'upcoming');
    const done = past.filter((p) => p.outcome === 'done').length;
    const missed = past.filter((p) => p.outcome === 'missed').length;
    const skipped = past.filter((p) => p.outcome === 'skipped').length;
    const considered = done + missed;
    const worked = eachDayOfRange(range).reduce((s, d) => s + workedOn(toLocalDateKey(d)), 0);
    return {
      completions: getCompletions(tasks, range).length,
      rate: considered ? Math.round((done / considered) * 100) : null,
      done, missed, skipped,
      overdueNow: tasks.filter((t) => isOverdueTask(t)).length,
      worked,
      planned,
    };
  }, [tasks, range, workedOn]);

  const chartDays = useMemo(() => {
    const days = eachDayOfRange(range);
    return days.slice(-MAX_CHART_DAYS);
  }, [range]);
  const shortLabels = chartDays.length <= 7;

  const timeChartData = useMemo(() => chartDays.map((day) => ({
    day: dayAxisLabel(day, shortLabels),
    estimado: Math.round(getPlannedMinutesForDay(tasks, day)),
    real: Math.round(workedOn(toLocalDateKey(day))),
  })), [chartDays, tasks, workedOn, shortLabels]);
  const hasTimeData = timeChartData.some((d) => d.estimado > 0 || d.real > 0);

  const completedData = useMemo(() => {
    const chartRange = { from: chartDays[0], to: chartDays[chartDays.length - 1] };
    const perDay: Record<string, number> = {};
    getCompletions(tasks, chartRange).forEach((c) => { perDay[c.dateKey] = (perDay[c.dateKey] || 0) + 1; });
    return chartDays.map((day) => ({
      day: dayAxisLabel(day, shortLabels),
      concluidas: perDay[toLocalDateKey(day)] || 0,
    }));
  }, [chartDays, tasks, shortLabels]);
  const hasCompletedData = completedData.some((d) => d.concluidas > 0);

  const outcomeData = [
    { name: 'Concluídas', value: stats.done },
    { name: 'Não feitas', value: stats.missed },
    { name: 'Puladas', value: stats.skipped },
  ].filter((d) => d.value > 0);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = { Alta: 0, Média: 0, Baixa: 0 };
    const label: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' };
    stats.planned.forEach((p) => { counts[label[p.task.priority] ?? 'Média']++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  }, [stats.planned]);

  const periodHint = period === 'all'
    ? `desde ${format(range.from, 'dd/MM/yyyy')}`
    : period === '7d' ? 'últimos 7 dias' : 'últimos 30 dias';

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CheckCircle2} label="Concluídas" value={stats.completions} hint={periodHint} tone="bg-status-done/15 text-status-done" />
        <StatCard
          icon={Target}
          label="Taxa de conclusão"
          value={stats.rate === null ? '—' : `${stats.rate}%`}
          hint={`${stats.done} de ${stats.done + stats.missed} planejadas até hoje`}
          tone="bg-primary/15 text-primary"
        />
        <StatCard icon={Clock} label="Trabalhado" value={formatMinutes(stats.worked)} hint={periodHint} tone="bg-status-in-progress/15 text-status-in-progress" />
        <StatCard icon={AlertTriangle} label="Atrasadas agora" value={stats.overdueNow} tone="bg-destructive/15 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">Tempo por dia</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Estimado do que estava planejado no dia vs. tempo registrado
            {chartDays.length < eachDayOfRange(range).length && ` (últimos ${MAX_CHART_DAYS} dias)`}
          </p>
          {!hasTimeData ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,16%)" />
                <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={11} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={11} tickFormatter={axisHours} width={40} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number, name: string) => [formatMinutes(v), name === 'estimado' ? 'Estimado' : 'Real']}
                />
                <Bar dataKey="estimado" fill="hsl(238,84%,67%)" radius={[4, 4, 0, 0]} name="estimado" />
                <Bar dataKey="real" fill="hsl(160,84%,39%)" radius={[4, 4, 0, 0]} name="real" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">Concluídas por dia</h2>
          <p className="text-xs text-muted-foreground mb-4">Tarefas e ocorrências de recorrentes marcadas como feitas</p>
          {!hasCompletedData ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={completedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,16%)" />
                <XAxis dataKey="day" stroke="hsl(215,20%,55%)" fontSize={11} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v, 'Concluídas']} />
                <Bar dataKey="concluidas" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">O que foi planejado</h2>
          <p className="text-xs text-muted-foreground mb-4">Tarefas com prazo e ocorrências até hoje, no período</p>
          {outcomeData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {outcomeData.map((d) => <Cell key={d.name} fill={OUTCOME_COLORS[d.name]} />)}
                </Pie>
                <Legend />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">Planejado por prioridade</h2>
          <p className="text-xs text-muted-foreground mb-4">Inclui o que ainda vem pela frente no período</p>
          {priorityData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {priorityData.map((d) => <Cell key={d.name} fill={PRIORITY_COLORS[d.name]} />)}
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
