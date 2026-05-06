import { useMemo, useState } from 'react';
import { Plus, Clock, Repeat, AlertCircle } from 'lucide-react';
import EditableActualMinutes from '@/components/EditableActualMinutes';
import { isBefore, startOfToday } from 'date-fns';
import { doesRecurrenceMatchDate } from '@/lib/recurrenceExpander';
import { addCompletedDate, parseRecurrence, removeCompletedDate, toLocalDateKey } from '@/lib/recurrence';
import { getEffectiveStatus } from '@/lib/effectiveStatus';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { formatMinutes, formatDate } from '@/lib/formatters';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import TimerButton from '@/components/TimerButton';
import TaskModal from '@/components/TaskModal';
import DateFilterBar from '@/components/DateFilterBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/useProjects';
import { DateFilter, AreaFilter, StatusFilter, PriorityFilter } from '@/lib/types';
import { isToday, isYesterday, isTomorrow, isThisWeek } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { parseLocalDate, completedAtMatchesFilter, recurringCompletedOnFilterDate } from '@/lib/dateUtils';
import CompletionDateDialog from '@/components/CompletionDateDialog';

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: projects } = useProjects();
  const updateTask = useUpdateTask();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'recurring' | 'single'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editTask, setEditTask] = useState<typeof tasks extends (infer T)[] ? T : never | null>(null);
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
      const recConfig = parseRecurrence((t as any).recurrence_config);
      const isRecurring = recConfig.type !== 'none';

      // Date filter
      if (dateFilter === 'custom') {
        if (customRange) {
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
          if (!dateMatches) return false;
        }
      } else {
        let dateMatches = false;

        const dueDate = parseLocalDate(t.due_date);
        if (dueDate) {
          const d = dueDate;
          if (dateFilter === 'today') dateMatches = isToday(d);
          else if (dateFilter === 'yesterday') dateMatches = isYesterday(d);
          else if (dateFilter === 'tomorrow') dateMatches = isTomorrow(d);
          else if (dateFilter === 'week') dateMatches = isThisWeek(d);
        } else if (!t.due_date) {
          // Undated non-recurring tasks show on "today"
          if (dateFilter === 'today' && !isRecurring) dateMatches = true;
        }

        // For recurring tasks, also check if recurrence matches the filter date(s)
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
            // Check each day of the current week
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
        if (!dateMatches) return false;
      }

      if (areaFilter !== 'all' && t.area !== areaFilter) return false;
      const effectiveStatus = getEffectiveStatus(t as any, dateFilter, customRange);
      if (effectiveStatus === 'skipped') return false;
      if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
      if (recurrenceFilter === 'recurring' && !isRecurring) return false;
      if (recurrenceFilter === 'single' && isRecurring) return false;
      return true;
    });
  }, [tasks, dateFilter, customRange, areaFilter, statusFilter, priorityFilter, projectFilter, recurrenceFilter]);

  const handleStatusChange = async (id: string, status: string, completedAt?: string, occurrenceDateKey?: string) => {
    const task = (tasks || []).find((t) => t.id === id);
    const recConfig = parseRecurrence((task as any)?.recurrence_config);

    // For recurring tasks, skip CompletionDateDialog — use the occurrence date directly
    if (task && recConfig.type !== 'none') {
      try {
        const dateKey = occurrenceDateKey || toLocalDateKey(completedAt ? new Date(completedAt) : getCompletionInitialDate());
        await updateTask.mutateAsync({
          id,
          status: 'todo',
          completed_at: null,
          recurrence_config: status === 'done'
            ? addCompletedDate((task as any).recurrence_config, dateKey)
            : removeCompletedDate((task as any).recurrence_config, dateKey),
        });
        toast.success(status === 'done' ? 'Ocorrência concluída!' : 'Conclusão removida!');
      } catch {
        toast.error('Erro ao atualizar status');
      }
      return;
    }

    // Non-recurring: show CompletionDateDialog
    if (status === 'done' && !completedAt) {
      if (task) setCompletionDialog({ id, name: task.name, initialDate: getCompletionInitialDate() });
      return;
    }
    try {
      await updateTask.mutateAsync({
        id,
        status,
        completed_at: status === 'done' ? (completedAt || new Date().toISOString()) : null,
      });
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
        <Button onClick={() => { setEditTask(null); setModalKey(k => k + 1); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DateFilterBar value={dateFilter} onChange={setDateFilter} customRange={customRange} onCustomRangeChange={setCustomRange} />
        <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v as AreaFilter)}>
          <SelectTrigger className="w-32 bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Áreas</SelectItem>
            <SelectItem value="work">Trabalho</SelectItem>
            <SelectItem value="personal">Pessoal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-36 bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="done">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
          <SelectTrigger className="w-36 bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        {projects && projects.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40 bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={recurrenceFilter} onValueChange={(v) => setRecurrenceFilter(v as 'all' | 'recurring' | 'single')}>
          <SelectTrigger className="w-36 bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Tarefas</SelectItem>
            <SelectItem value="recurring">Recorrentes</SelectItem>
            <SelectItem value="single">Únicas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overdue tasks */}
      {(() => {
        const overdueTasks = (tasks || []).filter((t) => {
          const dueDate = parseLocalDate(t.due_date);
          if (dueDate && getEffectiveStatus(t as any, 'custom', { from: dueDate, to: dueDate }) === 'done') return false;
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
                  onClick={() => { setEditTask(t as any); setModalKey(k => k + 1); setModalOpen(true); }}
                  className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20 hover:border-destructive/40 cursor-pointer transition-all"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const recConfig = parseRecurrence((t as any).recurrence_config);
                        if (recConfig.type !== 'none') {
                          const dateKey = t.due_date || toLocalDateKey(new Date());
                          handleStatusChange(t.id!, 'done', undefined, dateKey);
                        } else {
                          setCompletionDialog({ id: t.id!, name: t.name, initialDate: parseLocalDate(t.due_date) || getCompletionInitialDate() });
                        }
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 rounded-full border-2 border-destructive"
                  />
                   <div className="flex-1 min-w-0">
                     <span className="font-medium text-foreground truncate">{t.name}</span>
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
                   <div className="flex items-center gap-2">
                     <PriorityBadge priority={t.priority || 'medium'} />
                     <TimerButton taskId={t.id!} />
                   </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma tarefa encontrada
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const es = getEffectiveStatus(t as any, dateFilter, customRange);
            return (
            <div
              key={t.id}
              onClick={() => { setEditTask(t as any); setModalKey(k => k + 1); setModalOpen(true); }}
              className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/30 cursor-pointer transition-all group"
            >
              <Checkbox
                checked={es === 'done'}
                onCheckedChange={(checked) => {
                  handleStatusChange(t.id!, checked ? 'done' : 'todo');
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-5 w-5 rounded-full border-2 data-[state=checked]:bg-status-done data-[state=checked]:border-status-done"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("font-medium truncate", es === 'done' ? "line-through text-muted-foreground" : "text-foreground")}>{t.name}</span>
                  {t.area === 'work' && t.project_name && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-work/15 text-work">
                      {t.project_name}
                    </span>
                  )}
                  {t.area === 'personal' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-personal/15 text-personal">
                      Pessoal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatMinutes(t.estimated_minutes)} est. /
                  </span>
                  <EditableActualMinutes taskId={t.id!} value={t.total_tracked_minutes || 0} />
                  <span>real</span>
                  {t.due_date && <span>Prazo: {formatDate(t.due_date)}</span>}
                  {t.completed_at && es === 'done' && (
                    <span className="flex items-center gap-1 text-status-done">
                      ✓ {new Date(t.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {new Date(t.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {(t as any).recurrence_config && (t as any).recurrence_config?.type !== 'none' && (
                    <span className="flex items-center gap-1 text-primary/70">
                      <Repeat className="h-3 w-3" /> Recorrente
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={es || 'todo'} onChange={(s) => handleStatusChange(t.id!, s)} />
                <PriorityBadge priority={t.priority || 'medium'} />
                <TimerButton taskId={t.id!} />
              </div>
            </div>
            );
          })}
        </div>
      )}

      <TaskModal
        key={modalKey}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        task={editTask as any}
      />

      <CompletionDateDialog
        open={!!completionDialog}
        taskName={completionDialog?.name || ''}
        initialDate={completionDialog?.initialDate}
        onConfirm={(completedAt) => {
          if (completionDialog) {
            handleStatusChange(completionDialog.id, 'done', completedAt);
          }
          setCompletionDialog(null);
        }}
        onCancel={() => setCompletionDialog(null)}
      />
    </div>
  );
}
