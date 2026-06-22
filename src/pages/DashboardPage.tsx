import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { DateFilter } from '@/lib/types';
import { useReminders, useUpdateReminder, useArchiveReminder, useDeleteReminder, Reminder } from '@/hooks/useReminders';
import { REMINDER_COLORS, REMINDER_COLOR_KEYS, ReminderColor } from '@/lib/reminderColors';
import { formatMinutes } from '@/lib/formatters';
import DateFilterBar from '@/components/DateFilterBar';
import TaskModal from '@/components/TaskModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import CompletionDateDialog from '@/components/CompletionDateDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Clock, ListTodo, Loader2, TrendingUp, AlertTriangle, AlertOctagon, Sun, Sunset, AlertCircle, StickyNote, Archive, Trash2, Check, X } from 'lucide-react';
import { getMissedDateKey, isOverdueTask } from '@/lib/overdueUtils';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { doesRecurrenceMatchDate } from '@/lib/recurrenceExpander';
import { addCompletedDate, parseRecurrence, removeCompletedDate, toLocalDateKey } from '@/lib/recurrence';
import { parseLocalDate, completedAtMatchesFilter, recurringCompletedOnFilterDate, taskDateRangeMatchesFilter, getTaskDisplayMinutes, getDailyEstimatedMinutes } from '@/lib/dateUtils';
import { getEffectiveStatus } from '@/lib/effectiveStatus';
import EditableActualMinutes from '@/components/EditableActualMinutes';
import TimerButton from '@/components/TimerButton';
import PriorityBadge from '@/components/PriorityBadge';

function ColorPicker({ value, onChange }: { value: ReminderColor; onChange: (c: ReminderColor) => void }) {
  return (
    <div className="flex items-center gap-2">
      {REMINDER_COLOR_KEYS.map((c) => (
        <button
          key={c}
          type="button"
          title={REMINDER_COLORS[c].label}
          onClick={() => onChange(c)}
          className={cn(
            'h-5 w-5 rounded-full transition-all shrink-0',
            REMINDER_COLORS[c].dot,
            value === c ? 'ring-2 ring-offset-2 ring-offset-background ring-white/50 scale-110' : 'opacity-50 hover:opacity-100'
          )}
        />
      ))}
    </div>
  );
}

function ReminderEditDialog({ reminder, open, onClose }: { reminder: Reminder; open: boolean; onClose: () => void }) {
  const [content, setContent] = useState(reminder.content);
  const [color, setColor] = useState<ReminderColor>(reminder.color);
  const updateReminder = useUpdateReminder();
  const archiveReminder = useArchiveReminder();
  const deleteReminder = useDeleteReminder();
  const colors = REMINDER_COLORS[color];

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      await updateReminder.mutateAsync({ id: reminder.id, content: content.trim(), color });
      toast.success('Lembrete atualizado');
      onClose();
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveReminder.mutateAsync(reminder.id);
      toast.success('Lembrete arquivado');
      onClose();
    } catch {
      toast.error('Erro ao arquivar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReminder.mutateAsync(reminder.id);
      toast.success('Lembrete removido');
      onClose();
    } catch {
      toast.error('Erro ao remover');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Editar Lembrete</DialogTitle>
        </DialogHeader>
        <div className={cn('rounded-xl border p-3 space-y-3', colors.bg, colors.border)}>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-transparent border-0 p-0 resize-none focus-visible:ring-0 text-sm min-h-[80px]"
            autoFocus
          />
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <Button
              size="sm" variant="ghost"
              onClick={handleArchive}
              disabled={archiveReminder.isPending}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Archive className="h-3.5 w-3.5" /> Arquivar
            </Button>
            <Button
              size="sm" variant="ghost"
              onClick={handleDelete}
              disabled={deleteReminder.isPending}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!content.trim() || updateReminder.isPending} className="h-8 px-3 gap-1">
              <Check className="h-3.5 w-3.5" /> Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
  const { data: reminders } = useReminders();
  const updateTask = useUpdateTask();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
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
        let dateMatches = taskDateRangeMatchesFilter(t as any, 'custom', customRange);
        if (!dateMatches) dateMatches = completedAtMatchesFilter(t.completed_at, dateFilter, customRange);
        if (!dateMatches) dateMatches = recurringCompletedOnFilterDate((t as any).recurrence_config, dateFilter, customRange);
        return dateMatches;
      }

      const recConfig = parseRecurrence((t as any).recurrence_config);
      const isRecurring = recConfig.type !== 'none';
      let dateMatches = taskDateRangeMatchesFilter(t as any, dateFilter, customRange);

      if (!dateMatches && !t.due_date && !isRecurring) {
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

      if (!dateMatches) dateMatches = completedAtMatchesFilter(t.completed_at, dateFilter, customRange);
      if (!dateMatches) dateMatches = recurringCompletedOnFilterDate((t as any).recurrence_config, dateFilter, customRange);
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
    const estTotal = effectiveFiltered.reduce((s, t) => s + getDailyEstimatedMinutes(t as any, dateFilter, customRange), 0);
    // Use getTaskDisplayMinutes so recurring tasks contribute the correct period's time
    const realTotal = effectiveFiltered.reduce(
      (s, t) => s + getTaskDisplayMinutes(t as any, dateFilter, customRange),
      0,
    );
    return { total, done, inProgress, pending, estTotal, realTotal };
  }, [effectiveFiltered, dateFilter, customRange]);

  const blockTasks = useMemo(() => {
    const PRIORITY_ORDER: Record<string, number> = { high: 1, medium: 2, low: 3 };
    const byPriority = (a: any, b: any) =>
      (PRIORITY_ORDER[a.priority ?? 'medium'] ?? 2) - (PRIORITY_ORDER[b.priority ?? 'medium'] ?? 2);
    const getBlock = (t: any) => {
      const rc = t.recurrence_config;
      const wb = rc?.work_block || t.work_block;
      return wb || 'none';
    };
    const morning = effectiveFiltered.filter((t) => getBlock(t) === 'morning').sort(byPriority);
    const afternoon = effectiveFiltered.filter((t) => getBlock(t) === 'afternoon').sort(byPriority);
    const none = effectiveFiltered.filter((t) => getBlock(t) === 'none');
    return { morning, afternoon, none };
  }, [effectiveFiltered]);

  const blockMinutes = useMemo(() => {
    const calc = (tasks: typeof effectiveFiltered) =>
      tasks.filter((t) => t._effectiveStatus !== 'done').reduce((s, t) => s + getDailyEstimatedMinutes(t as any, dateFilter, customRange), 0);
    return {
      morning: calc(blockTasks.morning),
      afternoon: calc(blockTasks.afternoon),
    };
  }, [blockTasks, dateFilter, customRange]);

  // Memoized — isOverdueTask is expensive (scans 7 days per task).
  // Without this, it ran on every render (every second due to timer polling).
  const overdueTasks = useMemo(
    () => (tasks || []).filter((t) => isOverdueTask(t)),
    [tasks],
  );

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
    <div className="space-y-1">
      {taskList.map((t) => {
        const es = t._effectiveStatus;
        return (
        <div
          key={t.id}
          className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 rounded-lg px-3 py-2 transition-colors"
          onClick={() => openTask(t)}
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm text-foreground truncate block">{t.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <PriorityBadge priority={t.priority || 'medium'} />
              {t.estimated_minutes ? (
                <span className="text-xs text-muted-foreground">{formatMinutes(getDailyEstimatedMinutes(t as any, dateFilter, customRange))} est.</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              es === 'done' ? 'bg-status-done/15 text-status-done' :
              es === 'in_progress' ? 'bg-status-in-progress/15 text-status-in-progress' :
              'bg-status-todo/15 text-status-todo'
            }`}>
              {es === 'done' ? 'Concluída' : es === 'in_progress' ? 'Em Andamento' : 'A Fazer'}
            </span>
            {es !== 'done' && <TimerButton taskId={t.id!} />}
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

      {/* Reminders mural — post-it style */}
      {(reminders || []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Lembretes</span>
            </div>
            <Link to="/reminders" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Gerenciar →
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {(reminders || []).map((r) => {
              const c = REMINDER_COLORS[r.color] ?? REMINDER_COLORS.yellow;
              return (
                <button
                  key={r.id}
                  onClick={() => setEditingReminder(r)}
                  className={cn(
                    'w-[160px] sm:w-[180px] min-h-[100px] p-3 rounded-sm border text-left flex flex-col justify-between transition-transform hover:scale-[1.02] active:scale-[0.98]',
                    c.bg, c.border
                  )}
                  style={{ boxShadow: '2px 3px 8px rgba(0,0,0,0.25)' }}
                >
                  <p className={cn('text-xs leading-relaxed whitespace-pre-wrap break-words', c.text)}>
                    {r.content}
                  </p>
                  <div className={cn('mt-2 h-0.5 w-5 rounded-full opacity-40', c.dot)} />
                </button>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Overdue tasks — uses memoized list to avoid re-computing on every render */}
      {overdueTasks.length > 0 && (
        <div className="bg-card border border-destructive/40 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold text-foreground">Atrasadas</h2>
            <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-medium">{overdueTasks.length}</span>
          </div>
          <div className="space-y-2">
            {overdueTasks.map((t) => {
              const recConfig = parseRecurrence((t as any).recurrence_config);
              const isRecurring = recConfig.type !== 'none';
              const missedDateKey = isRecurring ? getMissedDateKey(t) : null;
              return (
              <div
                key={t.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-destructive/10 rounded-lg px-3 py-2 transition-colors"
                onClick={() => openTask(t)}
              >
                <Checkbox
                  checked={false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      if (isRecurring) {
                        const dateKey = missedDateKey || toLocalDateKey(new Date());
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
                  <span className="text-sm text-foreground truncate block">{t.name}</span>
                  <div className="flex flex-nowrap items-center gap-2 text-xs text-muted-foreground mt-1 overflow-x-auto scrollbar-none">
                    {missedDateKey && (
                      <span className="whitespace-nowrap shrink-0 text-destructive font-medium">
                        Perdida: {new Date(missedDateKey + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                    {!isRecurring && t.due_date && (
                      <span className="whitespace-nowrap shrink-0 text-destructive font-medium">
                        Prazo: {new Date(t.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                    <span className="whitespace-nowrap shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatMinutes(t.estimated_minutes)} est.
                    </span>
                    <span className="shrink-0"><EditableActualMinutes taskId={t.id!} value={t.total_tracked_minutes || 0} recurrenceConfig={(t as any).recurrence_config} /></span>
                    <span className="whitespace-nowrap shrink-0">real</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <PriorityBadge priority={(t as any).priority || 'medium'} />
                  {isRecurring ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary/70">Recorrente</span>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.status === 'in_progress' ? 'bg-status-in-progress/15 text-status-in-progress' :
                      'bg-status-todo/15 text-status-todo'
                    }`}>
                      {t.status === 'in_progress' ? 'Em Andamento' : 'A Fazer'}
                    </span>
                  )}
                  <TimerButton taskId={t.id!} />
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

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
          const totalEst = blockMinutes[block];
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

      {editingReminder && (
        <ReminderEditDialog
          reminder={editingReminder}
          open={!!editingReminder}
          onClose={() => setEditingReminder(null)}
        />
      )}
    </div>
  );
}
