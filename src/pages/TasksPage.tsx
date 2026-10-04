import { useMemo, useState, useEffect } from 'react';
import { Plus, AlertCircle, ArrowUpDown } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useUserPreferences, useUpdateUserPreferences } from '@/hooks/useUserPreferences';
import { useTaskActions } from '@/hooks/useTaskActions';
import { useTaskModal } from '@/hooks/useTaskModal';
import { parseRecurrence, toLocalDateKey, fromLocalDateKey } from '@/lib/recurrence';
import { getMissedDateKey, isOverdueTask } from '@/lib/overdueUtils';
import { DayRange, getFilterSingleDay } from '@/lib/dateUtils';
import { getTasksForPeriod } from '@/lib/taskFilter';
import { DateFilter, AreaFilter, StatusFilter, PriorityFilter, Task } from '@/lib/types';
import TaskRow from '@/components/TaskRow';
import DateFilterBar from '@/components/DateFilterBar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PRIORITY_ORDER: Record<string, number> = { high: 1, medium: 2, low: 3 };

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Mais recentes', field: 'created_at', dir: 'desc' },
  { value: 'priority_asc', label: 'Prioridade', field: 'priority', dir: 'asc' },
  { value: 'due_date_asc', label: 'Prazo', field: 'due_date', dir: 'asc' },
  { value: 'name_asc', label: 'Nome A→Z', field: 'name', dir: 'asc' },
] as const;

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: projects } = useProjects();
  const { toggleDone, toggleInProgress, dialogs } = useTaskActions();
  const { openTask, openNew, modal } = useTaskModal();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customRange, setCustomRange] = useState<DayRange | null>(null);
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'recurring' | 'single'>('all');
  const [sortKey, setSortKey] = useState<string>('created_desc');
  const { data: prefs } = useUserPreferences();
  const updatePrefs = useUpdateUserPreferences();

  // Load sort preference from user settings
  useEffect(() => {
    if (prefs?.tasks_sort_key) setSortKey(prefs.tasks_sort_key);
  }, [prefs?.tasks_sort_key]);

  const handleSortChange = (value: string) => {
    setSortKey(value);
    updatePrefs.mutate({ ...prefs, tasks_sort_key: value });
  };

  const viewedDay = getFilterSingleDay(dateFilter, customRange);

  const filtered = useMemo(() => {
    return getTasksForPeriod(tasks || [], dateFilter, customRange).filter(({ task: t, status }) => {
      const isRecurring = parseRecurrence(t.recurrence_config).type !== 'none';
      if (areaFilter !== 'all' && t.area !== areaFilter) return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
      if (recurrenceFilter === 'recurring' && !isRecurring) return false;
      if (recurrenceFilter === 'single' && isRecurring) return false;
      return true;
    });
  }, [tasks, dateFilter, customRange, areaFilter, statusFilter, priorityFilter, projectFilter, recurrenceFilter]);

  const sorted = useMemo(() => {
    const opt = SORT_OPTIONS.find((o) => o.value === sortKey) ?? SORT_OPTIONS[0];
    const mul = opt.dir === 'asc' ? 1 : -1;
    return [...filtered].sort(({ task: a }, { task: b }) => {
      if (opt.field === 'priority') {
        return ((PRIORITY_ORDER[a.priority ?? 'medium'] ?? 2) - (PRIORITY_ORDER[b.priority ?? 'medium'] ?? 2)) * mul;
      }
      if (opt.field === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return (a.due_date < b.due_date ? -1 : 1) * mul;
      }
      if (opt.field === 'name') {
        return a.name.localeCompare(b.name, 'pt-BR') * mul;
      }
      return (a.created_at < b.created_at ? -1 : 1) * mul;
    });
  }, [filtered, sortKey]);

  const overdue = useMemo(
    () => (tasks || []).filter((t) => isOverdueTask(t)).map((task) => ({ task, missedKey: getMissedDateKey(task) })),
    [tasks],
  );

  const newTaskDefaults = viewedDay && toLocalDateKey(viewedDay) !== toLocalDateKey(new Date())
    ? { due_date: toLocalDateKey(viewedDay) }
    : undefined;

  const selectClass = 'w-auto min-w-[8rem] bg-secondary border-border shrink-0';

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
        <Button onClick={() => openNew(newTaskDefaults)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:gap-3">
        <div className="shrink-0">
          <DateFilterBar value={dateFilter} onChange={setDateFilter} customRange={customRange} onCustomRangeChange={setCustomRange} />
        </div>
        <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v as AreaFilter)}>
          <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Áreas</SelectItem>
            <SelectItem value="work">Trabalho</SelectItem>
            <SelectItem value="personal">Pessoal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="done">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
          <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        {projects && projects.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={recurrenceFilter} onValueChange={(v) => setRecurrenceFilter(v as 'all' | 'recurring' | 'single')}>
          <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Tarefas</SelectItem>
            <SelectItem value="recurring">Recorrentes</SelectItem>
            <SelectItem value="single">Únicas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={handleSortChange}>
          <SelectTrigger className={`${selectClass} gap-1`} aria-label="Ordenar">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                onOpen={(t) => openTask(t, missedKey ? fromLocalDateKey(missedKey) : null)}
                onToggleDone={(t, done, key) => toggleDone(t, done, { occurrenceKey: key })}
              />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Carregando...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma tarefa encontrada</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(({ task, status, occurrenceKey }) => (
            <TaskRow
              key={task.id}
              task={task}
              status={status}
              occurrenceKey={occurrenceKey}
              dateFilter={dateFilter}
              customRange={customRange}
              onOpen={(t: Task) => openTask(t, viewedDay)}
              onToggleDone={(t, done, key) => toggleDone(t, done, { occurrenceKey: key, viewedDay })}
              onToggleInProgress={toggleInProgress}
            />
          ))}
        </div>
      )}

      {modal}
      {dialogs}
    </div>
  );
}
