import { useState, useMemo } from 'react';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { parseRecurrence } from '@/lib/recurrence';
import { doesRecurrenceMatchDate } from '@/lib/recurrenceExpander';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskModal from '@/components/TaskModal';
import StatusBadge from '@/components/StatusBadge';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseLocalDate, startOfLocalDay } from '@/lib/dateUtils';

export default function CalendarPage() {
  const { data: tasks } = useTasks();
  const updateTask = useUpdateTask();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editTask, setEditTask] = useState<any>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const getTasksForDate = (date: Date) => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      const dueDate = parseLocalDate(t.due_date);
      if (dueDate) {
        const startDate = parseLocalDate((t as any).start_date);
        if (startDate) {
          const day = startOfLocalDay(date);
          const taskStart = startOfLocalDay(startDate);
          const taskEnd = startOfLocalDay(dueDate);
          if (day >= taskStart && day <= taskEnd) return true;
        } else if (isSameDay(dueDate, date)) {
          return true;
        }
      }
      const recConfig = parseRecurrence((t as any).recurrence_config);
      if (recConfig.type !== 'none') {
        const createdAt = t.due_date || t.created_at;
        return doesRecurrenceMatchDate(recConfig, createdAt, date);
      }
      return false;
    });
  };

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
        <Button onClick={() => { setEditTask(null); setModalKey(k => k + 1); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
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
              const dayTasks = getTasksForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[80px] p-1.5 border border-border/50 rounded-md cursor-pointer transition-all",
                    !isCurrentMonth && "opacity-30",
                    isSelected && "ring-2 ring-primary border-primary",
                    today && !isSelected && "border-primary/50",
                    "hover:bg-secondary/50"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1",
                    today ? "text-primary font-bold" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {dayTasks.slice(0, 5).map((t) => {
                      const recConfig = parseRecurrence((t as any).recurrence_config);
                      const isRecurring = recConfig.type !== 'none';
                      return (
                        <div
                          key={t.id}
                          title={t.name}
                          className={cn(
                            "h-2 w-2 rounded-full flex-shrink-0",
                            t.status === 'done'
                              ? "bg-status-done"
                              : t.status === 'in_progress'
                                ? "bg-status-in-progress"
                                : isRecurring
                                  ? "bg-primary"
                                  : "bg-muted-foreground/60"
                          )}
                        />
                      );
                    })}
                    {dayTasks.length > 5 && (
                      <span className="text-[9px] text-muted-foreground leading-none self-center">+{dayTasks.length - 5}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
            </h2>
            {selectedDate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditTask(null);
                  setModalKey(k => k + 1);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar
              </Button>
            )}
          </div>

          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma tarefa neste dia
            </p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => { setEditTask(t); setModalKey(k => k + 1); setModalOpen(true); }}
                  className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      t.status === 'done' && "line-through text-muted-foreground"
                    )}>
                      {t.name}
                    </span>
                    <StatusBadge status={t.status || 'todo'} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {t.area === 'personal' && <span className="text-personal">Pessoal</span>}
                    {t.project_name && <span className="text-work">{t.project_name}</span>}
                    {parseRecurrence((t as any).recurrence_config).type !== 'none' && (
                      <span className="text-primary">🔄 Recorrente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskModal
        key={modalKey}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTask(null); }}
        task={editTask}
      />
    </div>
  );
}
