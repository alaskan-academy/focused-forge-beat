import { useState, useMemo } from 'react';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { parseRecurrence, recurrenceLabel, RecurrenceConfig } from '@/lib/recurrence';
import { Plus, Repeat, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskModal from '@/components/TaskModal';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RecurrencesPage() {
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editTask, setEditTask] = useState<any>(null);
  const [showStopped, setShowStopped] = useState(false);

  const recurringTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      const config = parseRecurrence((t as any).recurrence_config);
      if (showStopped) return true; // show all
      return config.type !== 'none';
    });
  }, [tasks, showStopped]);

  const activeCount = useMemo(() => {
    if (!tasks) return 0;
    return tasks.filter((t) => parseRecurrence((t as any).recurrence_config).type !== 'none').length;
  }, [tasks]);

  const handleStopRecurrence = async (taskId: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, recurrence_config: { type: 'none', interval: 1 } as RecurrenceConfig });
      toast.success('Recorrência interrompida!');
    } catch {
      toast.error('Erro ao interromper recorrência');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recorrências</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeCount} recorrência(s) ativa(s)</p>
        </div>
        <Button onClick={() => { setEditTask(null); setModalKey(k => k + 1); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Tarefa Recorrente
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={!showStopped ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowStopped(false)}
        >
          Ativas
        </Button>
        <Button
          variant={showStopped ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowStopped(true)}
        >
          Todas
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Carregando...</div>
      ) : recurringTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma recorrência encontrada
        </div>
      ) : (
        <div className="space-y-2">
          {recurringTasks.map((t) => {
            const config = parseRecurrence((t as any).recurrence_config);
            const isActive = config.type !== 'none';
            return (
              <div
                key={t.id}
                onClick={() => { setEditTask(t); setModalKey(k => k + 1); setModalOpen(true); }}
                className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/30 cursor-pointer transition-all group"
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Repeat className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("font-medium truncate", !isActive && "text-muted-foreground line-through")}>
                      {t.name}
                    </span>
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
                    <span className={cn(
                      "px-2 py-0.5 rounded-full",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {isActive ? recurrenceLabel(config) : 'Interrompida'}
                    </span>
                    {t.due_date && <span>Início: {t.due_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status || 'todo'} />
                  <PriorityBadge priority={t.priority || 'medium'} />
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleStopRecurrence(t.id!); }}
                      title="Interromper recorrência"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
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
        task={editTask}
      />
    </div>
  );
}
