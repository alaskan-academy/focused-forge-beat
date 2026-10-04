import { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '@/hooks/useTasks';
import { useTaskModal } from '@/hooks/useTaskModal';
import { parseRecurrence, toLocalDateKey } from '@/lib/recurrence';
import { getEffectiveStatus } from '@/lib/effectiveStatus';
import { taskMatchesDateFilter } from '@/lib/taskFilter';
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarPage() {
  const { data: tasks } = useTasks();
  const { openTask, openNew, modal } = useTaskModal();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  }, [currentMonth]);

  /** Tasks per day, with their status on that day (skipped occurrences left out). */
  const tasksByDay = useMemo(() => {
    const map = new Map<string, { task: Task; status: string }[]>();
    for (const day of calendarDays) {
      const range = { from: day, to: day };
      map.set(
        toLocalDateKey(day),
        (tasks || [])
          .filter((t) => taskMatchesDateFilter(t, 'custom', range))
          .map((task) => ({ task, status: getEffectiveStatus(task, 'custom', range) }))
          .filter((t) => t.status !== 'skipped'),
      );
    }
    return map;
  }, [tasks, calendarDays]);

  const selectedKey = toLocalDateKey(selectedDate);
  const selectedTasks = tasksByDay.get(selectedKey)
    ?? (tasks || [])
      .filter((t) => taskMatchesDateFilter(t, 'custom', { from: selectedDate, to: selectedDate }))
      .map((task) => ({ task, status: getEffectiveStatus(task, 'custom', { from: selectedDate, to: selectedDate }) }))
      .filter((t) => t.status !== 'skipped');

  const addForSelectedDay = () => openNew({ due_date: selectedKey });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
        <Button onClick={() => openNew()} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dayTasks = tasksByDay.get(toLocalDateKey(day)) || [];
              const isSelected = isSameDay(day, selectedDate);
              const today = isToday(day);
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'min-h-[64px] sm:min-h-[80px] p-1.5 border border-border/50 rounded-md text-left transition-all hover:bg-secondary/50',
                    !isSameMonth(day, currentMonth) && 'opacity-30',
                    isSelected && 'ring-2 ring-primary border-primary',
                    today && !isSelected && 'border-primary/50',
                  )}
                  aria-label={`${format(day, "dd 'de' MMMM", { locale: ptBR })}: ${dayTasks.length} tarefa(s)`}
                >
                  <div className={cn('text-xs font-medium mb-1', today ? 'text-primary font-bold' : 'text-foreground')}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayTasks.slice(0, 5).map(({ task, status }) => (
                      <div
                        key={task.id}
                        title={task.name}
                        className={cn(
                          'h-2 w-2 rounded-full flex-shrink-0',
                          status === 'done'
                            ? 'bg-status-done'
                            : status === 'in_progress'
                              ? 'bg-status-in-progress'
                              : parseRecurrence(task.recurrence_config).type !== 'none'
                                ? 'bg-primary'
                                : 'bg-muted-foreground/60',
                        )}
                      />
                    ))}
                    {dayTasks.length > 5 && (
                      <span className="text-[10px] text-muted-foreground leading-none self-center">+{dayTasks.length - 5}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground capitalize">
              {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h2>
            <Button size="sm" variant="outline" onClick={addForSelectedDay}>
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </div>

          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa neste dia</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(({ task, status }) => (
                <button
                  type="button"
                  key={task.id}
                  onClick={() => openTask(task, selectedDate)}
                  className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn('text-sm font-medium truncate', status === 'done' && 'line-through text-muted-foreground')}>
                      {task.name}
                    </span>
                    <StatusBadge status={status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.area === 'personal' && <span className="text-personal">Pessoal</span>}
                    {task.project_name && <span className="text-work">{task.project_name}</span>}
                    {parseRecurrence(task.recurrence_config).type !== 'none' && (
                      <span className="inline-flex items-center gap-1 text-primary"><Repeat className="h-3 w-3" /> Recorrente</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal}
    </div>
  );
}
