import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, Archive, Check, Clock, Plus, StickyNote, Sun, Sunset, Trash2, X } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useReminders, useUpdateReminder, useArchiveReminder, useDeleteReminder, Reminder } from '@/hooks/useReminders';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useTaskModal } from '@/hooks/useTaskModal';
import { REMINDER_COLORS, REMINDER_COLOR_KEYS, ReminderColor } from '@/lib/reminderColors';
import { formatMinutes } from '@/lib/formatters';
import { DateFilter, Task } from '@/lib/types';
import { DayRange, getDailyEstimatedMinutes, getFilterRange, getFilterSingleDay, getTaskDisplayMinutes } from '@/lib/dateUtils';
import { getTasksForPeriod, TaskInPeriod } from '@/lib/taskFilter';
import { getMissedDateKey, isOverdueTask } from '@/lib/overdueUtils';
import { parseRecurrence, toLocalDateKey, fromLocalDateKey } from '@/lib/recurrence';
import DateFilterBar from '@/components/DateFilterBar';
import TaskRow from '@/components/TaskRow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function ColorPicker({ value, onChange }: { value: ReminderColor; onChange: (c: ReminderColor) => void }) {
  return (
    <div className="flex items-center gap-2">
      {REMINDER_COLOR_KEYS.map((c) => (
        <button
          key={c}
          type="button"
          title={REMINDER_COLORS[c].label}
          aria-label={REMINDER_COLORS[c].label}
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
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 px-2" aria-label="Fechar">
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

const BLOCK_CONFIG = {
  morning: { label: 'Manhã', hoursLabel: '9h–12h', hours: 3, icon: Sun },
  afternoon: { label: 'Tarde', hoursLabel: '14h–18h', hours: 4, icon: Sunset },
} as const;

type BlockKey = keyof typeof BLOCK_CONFIG;

const PRIORITY_ORDER: Record<string, number> = { high: 1, medium: 2, low: 3 };

/** Open tasks first (by priority), finished ones at the bottom. */
function sortForBlock(a: TaskInPeriod, b: TaskInPeriod) {
  const doneA = a.status === 'done' ? 1 : 0;
  const doneB = b.status === 'done' ? 1 : 0;
  if (doneA !== doneB) return doneA - doneB;
  return (PRIORITY_ORDER[a.task.priority] ?? 2) - (PRIORITY_ORDER[b.task.priority] ?? 2);
}

function getBlock(task: Task): BlockKey | 'none' {
  const wb = parseRecurrence(task.recurrence_config).work_block;
  return wb === 'morning' || wb === 'afternoon' ? wb : 'none';
}

export default function DashboardPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: reminders } = useReminders();
  const { toggleDone, toggleInProgress, dialogs } = useTaskActions();
  const { openTask, openNew, modal } = useTaskModal();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customRange, setCustomRange] = useState<DayRange | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const viewedDay = getFilterSingleDay(dateFilter, customRange);

  const inPeriod = useMemo(
    () => getTasksForPeriod(tasks || [], dateFilter, customRange),
    [tasks, dateFilter, customRange],
  );

  const periodDays = useMemo(() => {
    const range = getFilterRange(dateFilter, customRange);
    if (!range) return 1;
    return Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1);
  }, [dateFilter, customRange]);

  const stats = useMemo(() => {
    const count = (s: string) => inPeriod.filter((t) => t.status === s).length;
    return {
      total: inPeriod.length,
      done: count('done'),
      inProgress: count('in_progress'),
      pending: count('todo'),
      estTotal: inPeriod.reduce((s, t) => s + getDailyEstimatedMinutes(t.task, dateFilter, customRange), 0),
      realTotal: inPeriod.reduce((s, t) => s + getTaskDisplayMinutes(t.task, dateFilter, customRange), 0),
    };
  }, [inPeriod, dateFilter, customRange]);

  const blocks = useMemo(() => {
    const by = (b: BlockKey | 'none') => inPeriod.filter((t) => getBlock(t.task) === b).sort(sortForBlock);
    return { morning: by('morning'), afternoon: by('afternoon'), none: by('none') };
  }, [inPeriod]);

  const blockMinutes = (list: TaskInPeriod[]) =>
    list.filter((t) => t.status !== 'done').reduce((s, t) => s + getDailyEstimatedMinutes(t.task, dateFilter, customRange), 0);

  const overdue = useMemo(
    () => (tasks || []).filter((t) => isOverdueTask(t)).map((task) => ({ task, missedKey: getMissedDateKey(task) })),
    [tasks],
  );

  const openRow = (task: Task) => openTask(task, viewedDay);
  const completeRow = (task: Task, done: boolean, occurrenceKey: string | null) =>
    toggleDone(task, done, { occurrenceKey, viewedDay });

  const renderRows = (list: TaskInPeriod[], emptyText: string) => (
    <div className="space-y-1.5">
      {list.map(({ task, status, occurrenceKey }) => (
        <TaskRow
          key={task.id}
          task={task}
          status={status}
          occurrenceKey={occurrenceKey}
          dateFilter={dateFilter}
          customRange={customRange}
          showContext={false}
          onOpen={openRow}
          onToggleDone={completeRow}
          onToggleInProgress={toggleInProgress}
        />
      ))}
      {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">{emptyText}</p>}
    </div>
  );

  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const newTaskDefaults = viewedDay && toLocalDateKey(viewedDay) !== toLocalDateKey(new Date())
    ? { due_date: toLocalDateKey(viewedDay) }
    : undefined;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
          <Button size="sm" onClick={() => openNew(newTaskDefaults)} className="gap-1.5 sm:hidden">
            <Plus className="h-4 w-4" /> Nova
          </Button>
        </div>
        <div className="flex items-center gap-2 max-w-full">
          <DateFilterBar value={dateFilter} onChange={setDateFilter} customRange={customRange} onCustomRangeChange={setCustomRange} />
          <Button size="sm" onClick={() => openNew(newTaskDefaults)} className="gap-1.5 hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> Nova tarefa
          </Button>
        </div>
      </div>

      {/* Reminders — post-it style, one scrollable row on mobile */}
      {(reminders || []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Lembretes</span>
            </div>
            <Link to="/reminders" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Gerenciar →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-none">
            {(reminders || []).map((r) => {
              const c = REMINDER_COLORS[r.color] ?? REMINDER_COLORS.yellow;
              return (
                <button
                  key={r.id}
                  onClick={() => setEditingReminder(r)}
                  className={cn(
                    'w-[150px] sm:w-[180px] shrink-0 min-h-[88px] p-3 rounded-sm border text-left flex flex-col justify-between transition-transform hover:scale-[1.02] active:scale-[0.98]',
                    c.bg, c.border
                  )}
                  style={{ boxShadow: '2px 3px 8px rgba(0,0,0,0.25)' }}
                >
                  <p className={cn('text-xs leading-relaxed whitespace-pre-wrap break-words line-clamp-5', c.text)}>
                    {r.content}
                  </p>
                  <div className={cn('mt-2 h-0.5 w-5 rounded-full opacity-40', c.dot)} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Period summary */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <p className="text-sm text-foreground">
            <strong className="text-lg">{stats.done}</strong>
            <span className="text-muted-foreground"> de {stats.total} concluídas</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.inProgress > 0 && <><span className="text-status-in-progress font-medium">{stats.inProgress} em andamento</span> · </>}
            {stats.pending} pendente{stats.pending === 1 ? '' : 's'}
          </p>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-status-done rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-6 text-sm">
          <span className="text-muted-foreground">Estimado <strong className="text-foreground">{formatMinutes(stats.estTotal)}</strong></span>
          <span className="text-muted-foreground">Trabalhado <strong className="text-foreground">{formatMinutes(stats.realTotal)}</strong></span>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="bg-card border border-destructive/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold text-foreground">Atrasadas</h2>
            <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded-full font-medium">{overdue.length}</span>
          </div>
          <div className="space-y-1.5">
            {overdue.map(({ task, missedKey }) => (
              <TaskRow
                key={task.id}
                task={task}
                status={task.status}
                occurrenceKey={missedKey}
                dateFilter={dateFilter}
                customRange={customRange}
                overdue
                onOpen={(t) => openTask(t, missedKey ? fromLocalDateKey(missedKey) : null, viewedDay)}
                onToggleDone={(t, done, key) => toggleDone(t, done, { occurrenceKey: key, viewedDay })}
              />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : (
        <>
          {/* Tasks by work block */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(['morning', 'afternoon'] as const).map((block) => {
              const config = BLOCK_CONFIG[block];
              const BlockIcon = config.icon;
              const list = blocks[block];
              const totalEst = blockMinutes(list);
              const capacity = config.hours * 60 * periodDays;
              const ratio = capacity ? totalEst / capacity : 0;
              return (
                <div key={block} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BlockIcon className="h-5 w-5 text-primary" />
                      <h2 className="font-semibold text-foreground">{config.label}</h2>
                      <span className="text-xs text-muted-foreground">{config.hoursLabel}</span>
                    </div>
                    <span className={cn('text-xs', ratio > 1 ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                      {formatMinutes(totalEst)} / {formatMinutes(capacity)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1">
                    <div
                      className={cn('h-full rounded-full transition-all', ratio > 1 ? 'bg-destructive' : ratio > 0.8 ? 'bg-yellow-500' : 'bg-primary')}
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>
                  {ratio > 1 ? (
                    <p className="text-xs text-destructive mb-2">Bloco lotado — passe algo para outro bloco ou dia.</p>
                  ) : ratio > 0.8 ? (
                    <p className="text-xs text-yellow-500 mb-2">Quase cheio — priorize o mais importante.</p>
                  ) : <div className="mb-2" />}
                  {renderRows(list, 'Nenhuma tarefa neste bloco')}
                </div>
              );
            })}
          </div>

          {blocks.none.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Sem bloco definido</h2>
              </div>
              {renderRows(blocks.none, '')}
            </div>
          )}
        </>
      )}

      {modal}
      {dialogs}

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
