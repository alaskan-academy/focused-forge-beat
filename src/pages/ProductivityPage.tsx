import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { subDays, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateFilterBar from '@/components/DateFilterBar';
import { DateFilter, AreaFilter } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_COLORS = ['hsl(215, 20%, 55%)', 'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)'];
const PRIORITY_COLORS = ['hsl(0, 72%, 51%)', 'hsl(45, 93%, 47%)', 'hsl(142, 71%, 45%)'];

export default function ProductivityPage() {
  const { data: tasks } = useTasks();
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (areaFilter !== 'all' && t.area !== areaFilter) return false;
      return true;
    });
  }, [tasks, areaFilter]);

  // Time chart: last 7 days
  const timeChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayTasks = filteredTasks.filter((t) => {
        if (!t.due_date) return false;
        return isWithinInterval(new Date(t.due_date), { start: startOfDay(day), end: endOfDay(day) });
      });
      days.push({
        day: format(day, 'EEE', { locale: ptBR }),
        estimado: dayTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0),
        real: dayTasks.reduce((s, t) => s + (t.total_tracked_minutes || 0), 0),
      });
    }
    return days;
  }, [filteredTasks]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 };
    filteredTasks.forEach((t) => {
      if (t.status && t.status in counts) counts[t.status as keyof typeof counts]++;
    });
    return [
      { name: 'A Fazer', value: counts.todo },
      { name: 'Em Andamento', value: counts.in_progress },
      { name: 'Concluída', value: counts.done },
    ];
  }, [filteredTasks]);

  // Priority distribution
  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    filteredTasks.forEach((t) => {
      if (t.priority && t.priority in counts) counts[t.priority as keyof typeof counts]++;
    });
    return [
      { name: 'Alta', value: counts.high },
      { name: 'Média', value: counts.medium },
      { name: 'Baixa', value: counts.low },
    ];
  }, [filteredTasks]);

  // Completed per day
  const completedData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const count = filteredTasks.filter((t) => {
        if (!t.completed_at) return false;
        return isWithinInterval(new Date(t.completed_at), { start: startOfDay(day), end: endOfDay(day) });
      }).length;
      days.push({ day: format(day, 'EEE', { locale: ptBR }), concluídas: count });
    }
    return days;
  }, [filteredTasks]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Produtividade</h1>
        <div className="flex items-center gap-3">
          <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v as AreaFilter)}>
            <SelectTrigger className="w-32 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="work">Trabalho</SelectItem>
              <SelectItem value="personal">Pessoal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Est vs Real */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Tempo Estimado vs Real (7 dias)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
              <XAxis dataKey="day" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 30%, 16%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }} />
              <Bar dataKey="estimado" fill="hsl(238, 84%, 67%)" radius={[4, 4, 0, 0]} name="Estimado" />
              <Bar dataKey="real" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} name="Real" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completed per day */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Concluídas por Dia (7 dias)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={completedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 16%)" />
              <XAxis dataKey="day" stroke="hsl(215, 20%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 30%, 16%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }} />
              <Bar dataKey="concluídas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Distribuição por Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 30%, 16%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Distribuição por Prioridade</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                {priorityData.map((_, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ background: 'hsl(222, 47%, 9%)', border: '1px solid hsl(222, 30%, 16%)', borderRadius: 8, color: 'hsl(210, 40%, 96%)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
