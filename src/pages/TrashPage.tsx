import { useMemo } from 'react';
import { useDeletedTasks, useRestoreTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { parseRecurrence } from '@/lib/recurrence';
import { Trash2, RotateCcw, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TrashPage() {
  const { data: tasks, isLoading } = useDeletedTasks();
  const { data: projects } = useProjects();
  const restoreTask = useRestoreTask();

  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    (projects || []).forEach((p: any) => { map[p.id] = p.name; });
    return map;
  }, [projects]);

  const handleRestore = async (id: string, name: string) => {
    try {
      await restoreTask.mutateAsync(id);
      toast.success(`"${name}" restaurada!`);
    } catch {
      toast.error('Erro ao restaurar tarefa');
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lixeira</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tasks?.length ?? 0} tarefa(s) excluída(s) — restaure para voltar às listas
        </p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-12">Carregando...</div>
      ) : !tasks || tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma tarefa excluída
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t: any) => {
            const isRecurring = parseRecurrence(t.recurrence_config).type !== 'none';
            const deletedAt = new Date(t.deleted_at);
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
              >
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  {isRecurring ? <Repeat className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{t.name}</span>
                    {t.area === 'work' && t.project_id && projectNames[t.project_id] && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-work/15 text-work shrink-0">
                        {projectNames[t.project_id]}
                      </span>
                    )}
                    {t.area === 'personal' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-personal/15 text-personal shrink-0">
                        Pessoal
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Excluída em {deletedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' às '}
                    {deletedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                  disabled={restoreTask.isPending}
                  onClick={() => handleRestore(t.id, t.name)}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Restaurar</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
