import { useMemo, useState } from 'react';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { DateFilter } from '@/lib/types';
import { formatMinutes } from '@/lib/formatters';
import DateFilterBar from '@/components/DateFilterBar';
import TaskModal from '@/components/TaskModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import CompletionDateDialog from '@/components/CompletionDateDialog';
import { CheckCircle2, Clock, ListTodo, Loader2, TrendingUp, AlertTriangle, AlertOctagon, Sun, Sunset, AlertCircle } from 'lucide-react';
import { isBefore, startOfToday } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { isToday, isYesterday, isTomorrow, isThisWeek } from 'date-fns';
import { doesRecurrenceMatchDate } from '@/lib/recurrenceExpander';
import { addCompletedDate, parseRecurrence, removeCompletedDate, toLocalDateKey } from '@/lib/recurrence';
import { parseLocalDate, completedAtMatchesFilter, recurringCompletedOnFilterDate } from '@/lib/dateUtils';
import { getEffectiveStatus } from '@/lib/effectiveStatus';
import EditableActualMinutes from '@/components/EditableActualMinutes';
import TimerButton from '@/components/TimerButton';

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

const BLOCK_CONFIG = {
  morning: { label: 'Manhã (9h–12h)', hours: 3, icon: Sun },
  afternoon: { label: 'Tarde (14h–18h)', hours: 4, icon: Sunset },
} as const;

type BlockKey = keyof typeof BLOCK_CONFIG;

function BlockAlert({ blockKey, totalMinutes, periodDays }: { blockKey: BlockKey; totalMinutes: number; periodDays: number }) {
  const config = BLOCK_CONFIG[blockKey];
  const avgHours = totalMinutes / 60 / periodDays;
  const maxHours = config.hours;

  if (avgHours <= maxHours * 0.8) return null; // no alert below 80%

  const level = avgHours >= maxHours ? 'critical' : 'warning';
  const Icon = level === 'critical' ? AlertOctagon : AlertTriangle;

  return (
    <Alert
      variant={level === 'critical' ? 'destructive' : 'default'}
      className={level === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400' : ''}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>
        {level === 'critical' ? `${config.label} — Bloco Lotado!` : `${config.label} — Quase Cheio`}
      </AlertTitle>
      <AlertDescription>
        <strong>{avgHours.toFixed(1)}h estimadas{periodDays > 1 ? '/dia (média)' : ''}</strong> de {maxHours}h disponíveis.{' '}
        {level === 'critical'
          ? 'Redistribua tarefas para outro bloco ou dia.'
          : 'O bloco está ficando cheio. Priorize o mais importante.'}
      </AlertDescription>
    </Alert>
  );
}

export default function DashboardPage() {
  const { data: tasks } = useTasks();
  const updateTask = useUpdateTask();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [editTask, setEditTask] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [completionDialog, setCompletionDialog] = useState<{ id: string; name: string; initialDate?: Date } | null>(null);

  const getCompletionInitialDate = () => {
    const now = new Date();
    if (dateFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    if (dateFilter === 'custom' && customRange) {
      return customRange.to > now ? now : customRange.to;
    }
    return now;
  };

  const filtered = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (dateFilter === 'custom') {
        if (!customRange) return true;
        const dueDate = parseLocalDate(t.due_date);
        let dateMatches = false;
        if (dueDate) {
          const from = new Date(customRange.from.getFullYear(), customRange.from.getMonth(), customRange.from.getDate());
          const to = new Date(customRange.to.getFullYear(), customRange.to.getMonth(), customRange.to.getDate());
          const d = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          dateMatches = d >= from && d <= to;
        }
        if (!dateMatches) {
          dateMatches = completedAtMatchesFilter(t.completed_at, dateFilter, customRange);
        }
        if (!dateMatches) {
          dateMatches = recurringCompletedOnFilterDate((t as any).recurrence_config, dateFilter, customRange);
        }
        return dateMatches;
      }

      const recConfig = parseRecurrence((t as any).recurrence_config);
      const isRecurring = recConfig.type !== 'none';
      let dateMatches = false;

      const dueDate = parseLocalDate(t.due_date);
      if (dueDate) {
        const d = dueDate;
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

      // Also include tasks completed on the viewed date (e.g. overdue tasks completed today)
      if (!dateMatches) {
        dateMatches = completedAtMatchesFilter(t.completed_at, dateFilter, customRange);
      }
      // Include recurring tasks that have a completed_dates entry for the filter date
      if (!dateMatches) {
        dateMatches = recurringCompletedOnFilterDate((t as any).recurrence_config, dateFilter, customRange);
      }
      return dateMatches;
    });
  }, [tasks, dateFilter, customRange]);

  const periodDays = useMemo(() => {
    if (dateFilter === 'week') return 7;
    if (dateFilter === 'custom' && customRange) {
      const diffTime = customRange.to.getTime() - customRange.from.getTime();
      return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }
    return 1;
  }, [dateFilter, customRange]);

  const effectiveFiltered = useMemo(() => {
    return filtered
      .map((t) => ({
        ...t,
        _effectiveStatus: getEffectiveStatus(t as any, dateFilter, customRange),
      }))
      .filter((t) => t._effectiveStatus !== 'skipped');
  }, [filtered, dateFilter, customRange]);

  const stats = useMemo(() => {
    const total = effectiveFiltered.length;
    const done = effectiveFiltered.filter((t) => t._effectiveStatus === 'done').length;
    const inProgress = effectiveFiltered.filter((t) => t._effectiveStatus === 'in_progress').length;
    const pending = effectiveFiltered.filter((t) => t._effectiveStatus === 'todo').length;
    const estTotal = effectiveFiltered.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
    const realTotal = effectiveFiltered.reduce((s, t) => s + (t.total_tracked_minutes || 0), 0);
    return { total, done, inProgress, pending, estTotal, realTotal };
  }, [effectiveFiltered]);

  const blockTasks = useMemo(() => {
    const getBlock = (t: any) => {
      const rc = t.recurrence_config;
      const wb = rc?.work_block || t.work_block;
      return wb || 'none';
    };
    const morning = effectiveFiltered.filter((t) => getBlock(t) === 'morning');
    const afternoon = effectiveFiltered.filter((t) => getBlock(t) === 'afternoon');
    const none = effectiveFiltered.filter((t) => getBlock(t) === 'none');
    return { morning, afternoon, none };
  }, [effectiveFiltered]);

  const blockMinutes = useMemo(() => {
    const calc = (tasks: typeof effectiveFiltered) =>
      tasks.filter((t) => t._effectiveStatus !== 'done').reduce((s, t) => s + (t.estimated_minutes || 0), 0);
    return {
      morning: calc(blockTasks.morning),
      afternoon: calc(blockTasks.afternoon),
    };
  }, [blockTasks]);

  const openTask = (t: any) => {
    setEditTask(t);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleStatusChange = async (task: any, status: string, completedAt?: string, occurrenceDateKey?: string) => {
    const recConfig = parseRecurrence(task.recurrence_config);

    // For recurring tasks, skip CompletionDateDialog — use the occurrence date directly
    if (recConfig.type !== 'none') {
      try {
        const dateKey = occurrenceDateKey || toLocalDateKey(completedAt ? new Date(completedAt) : getCompletionInitialDate());
        await updateTask.mutateAsync({
          id: task.id,
          status: 'todo',
          completed_at: null,
          recurrence_config: status === 'done'
            ? addCompletedDate(task.recurrence_config, dateKey)
            : removeCompletedDate(task.recurrence_config, dateKey),
        });
        toast.success(status === 'done' ? 'Ocorrência concluída!' : 'Conclusão removida!');
      } catch {
        toast.error('Erro ao atualizar status');
      }
      return;
    }

    // Non-recurring: show CompletionDateDialog
    if (status === 'done' && !completedAt) {
      setCompletionDialog({ id: task.id, name: task.name, initialDate: getCompletionInitialDate() });
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        status,
        completed_at: status === 'done' ? (completedAt || new Date().toISOString()) : null,
      });
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const renderTaskList = (taskList: typeof effectiveFiltered) => (
    <div className="space-y-2">
      {taskList.map((t) => {
        const es = t._effectiveStatus;
        return (
        <div
          key={t.id}
          className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 rounded-lg px-3 py-2 transition-colors"
          onClick={() => openTask(t)}
        >
          <span className="text-sm text-foreground truncate flex-1">{t.name}</span>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {t.estimated_minutes ? (
              <span className="text-xs text-muted-foreground">{formatMinutes(t.estimated_minutes)}</span>
            ) : null}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              es === 'done' ? 'bg-status-done/15 text-status-done' :
              es === 'in_progress' ? 'bg-status-in-progress/15 text-status-in-progress' :
              'bg-status-todo/15 text-status-todo'
            }`}>
              {es === 'done' ? 'Concluída' : es === 'in_progress' ? 'Em Andamento' : 'A Fazer'}
            </span>
          </div>
        </div>
        );
      })}
      {taskList.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3">Nenhuma tarefa neste bloco</p>
      )}
    </div>
  );

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <DateFilterBar value={dateFilter} onChange={setDateFilter} customRange={customRange} onCustomRangeChange={setCustomRange} />
      </div>

      {/* Per-block alerts */}
      <div className="space-y-2">
        <BlockAlert blockKey="morning" totalMinutes={blockMinutes.morning} periodDays={periodDays} />
        <BlockAlert blockKey="afternoon" totalMinutes={blockMinutes.afternoon} periodDays={periodDays} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListTodo} label="Total" value={stats.total} color="bg-primary/15 text-primary" />
        <StatCard icon={CheckCircle2} label="Concluídas" value={stats.done} color="bg-status-done/15 text-status-done" />
        <StatCard icon={Loader2} label="Em Andamento" value={stats.inProgress} color="bg-status-in-progress/15 text-status-in-progress" />
        <StatCard icon={Clock} label="Pendentes" value={stats.pending} color="bg-status-todo/15 text-status-todo" />
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso do Período</span>
            <span className="text-sm font-bold text-foreground">{Math.round((stats.done / stats.total) * 100)}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-status-done rounded-full transition-all"
              style={{ width: `${(stats.done / stats.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{stats.done} de {stats.total} tarefas concluídas</p>
        </div>
      )}

      {/* Overdue tasks */}
      {(() => {
        const overdueTasks = (tasks || []).filter((t) => {
          const dueDate = parseLocalDate(t.due_date);
          const effStatus = dueDate ? getEffectiveStatus(t as any, 'custom', { from: dueDate, to: dueDate }) : null;
          if (effStatus === 'done' || effStatus === 'skipped') return false;
          if (t.status === 'done') return false;
          return dueDate && isBefore(dueDate, startOfToday());
        });
        if (overdueTasks.length === 0) return null;
        return (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h2 className="font-semibold text-destructive">Tarefas Atrasadas ({overdueTasks.length})</h2>
            </div>
            <div className="space-y-2">
              {overdueTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-destructive/10 rounded-lg px-3 py-2 transition-colors"
                  onClick={() => openTask(t)}
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const recConfig = parseRecurrence((t as any).recurrence_config);
                        if (recConfig.type !== 'none') {
                          // Recurring: directly mark the due_date occurrence as done
                          const dateKey = t.due_date || toLocalDateKey(new Date());
                          handleStatusChange(t, 'done', undefined, dateKey);
                        } else {
                          setCompletionDialog({ id: t.id!, name: t.name, initialDate: parseLocalDate(t.due_date) || getCompletionInitialDate() });
                        }
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 rounded-full border-2 border-destructive"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground truncate">{t.name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {t.due_date && (
                        <span className="text-destructive font-medium">
                          Prazo: {new Date(t.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatMinutes(t.estimated_minutes)} est.
                      </span>
                      <EditableActualMinutes taskId={t.id!} value={t.total_tracked_minutes || 0} />
                      <span className="text-muted-foreground">real</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.status === 'in_progress' ? 'bg-status-in-progress/15 text-status-in-progress' :
                      'bg-status-todo/15 text-status-todo'
                    }`}>
                      {t.status === 'in_progress' ? 'Em Andamento' : 'A Fazer'}
                    </span>
                    <TimerButton taskId={t.id!} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 gap-4">
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
      </div>

      {/* Tasks by block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(['morning', 'afternoon'] as const).map((block) => {
          const config = BLOCK_CONFIG[block];
          const BlockIcon = config.icon;
          const taskList = blockTasks[block];
          const totalEst = blockTasks[block].filter(t => t.status !== 'done').reduce((s, t) => s + (t.estimated_minutes || 0), 0);
          const capacity = config.hours * 60;

          return (
            <div key={block} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BlockIcon className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">{config.label}</h2>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatMinutes(totalEst)} / {formatMinutes(capacity)}
                </div>
              </div>
              {capacity > 0 && (
                <div className="mb-3">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        totalEst > capacity ? 'bg-destructive' : totalEst > capacity * 0.8 ? 'bg-yellow-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, (totalEst / capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {renderTaskList(taskList)}
            </div>
          );
        })}
      </div>

      {/* Tasks without block */}
      {blockTasks.none.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Sem Bloco Definido</h2>
          </div>
          {renderTaskList(blockTasks.none)}
        </div>
      )}

      <TaskModal
        key={modalKey}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        task={editTask}
      />

      <CompletionDateDialog
        open={!!completionDialog}
        taskName={completionDialog?.name || ''}
        initialDate={completionDialog?.initialDate}
        onConfirm={async (completedAt) => {
          if (completionDialog) {
            const task = (tasks || []).find((t) => t.id === completionDialog.id);
            if (task) await handleStatusChange(task, 'done', completedAt);
          }
          setCompletionDialog(null);
        }}
        onCancel={() => setCompletionDialog(null)}
      />
    </div>
  );
}
