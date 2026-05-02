import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { formatMinutes } from '@/lib/formatters';
import RecurrenceEditor from '@/components/RecurrenceEditor';
import { RecurrenceConfig, DEFAULT_RECURRENCE, parseRecurrence, recurrenceLabel } from '@/lib/recurrence';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: {
    id: string;
    name: string;
    area: string;
    project_id: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    estimated_minutes: number | null;
    actual_minutes: number | null;
    total_tracked_minutes?: number | null;
    recurrence_config?: unknown;
    notes: string | null;
    work_block?: string;
  } | null;
}

export default function TaskModal({ open, onClose, task }: TaskModalProps) {
  const isEdit = !!task;
  const [name, setName] = useState(task?.name || '');
  const [area, setArea] = useState(task?.area || 'personal');
  const [projectId, setProjectId] = useState(task?.project_id || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [estimated, setEstimated] = useState(String(task?.estimated_minutes || ''));
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>(
    task?.recurrence_config ? parseRecurrence(task.recurrence_config) : DEFAULT_RECURRENCE
  );
  const [notes, setNotes] = useState(task?.notes || '');
  const [workBlock, setWorkBlock] = useState(task?.work_block || 'morning');

  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      area,
      project_id: area === 'work' && projectId ? projectId : null,
      status,
      priority,
      due_date: dueDate || null,
      estimated_minutes: Number(estimated) || 0,
      recurrence_config: recurrence,
      notes: notes || null,
      work_block: workBlock,
      ...(status === 'done' ? { completed_at: new Date().toISOString() } : { completed_at: null }),
    };

    try {
      if (isEdit) {
        await updateTask.mutateAsync({ id: task.id, ...payload });
        toast.success('Tarefa atualizada!');
      } else {
        await createTask.mutateAsync(payload);
        toast.success('Tarefa criada!');
      }
      onClose();
    } catch {
      toast.error('Erro ao salvar tarefa');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Tarefa excluída!');
      onClose();
    } catch {
      toast.error('Erro ao excluir tarefa');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da tarefa" className="bg-secondary border-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Área</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="work">Trabalho</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {area === 'work' && (
            <div>
              <Label>Projeto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecionar projeto" /></SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tempo Estimado (min)</Label>
              <Input type="number" value={estimated} onChange={(e) => setEstimated(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div>
              <Label>Bloco de Trabalho</Label>
              <Select value={workBlock} onValueChange={setWorkBlock}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Manhã (9h–12h)</SelectItem>
                  <SelectItem value="afternoon">Tarde (14h–17h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEdit && (
            <div>
              <Label>Tempo Real</Label>
              <div className="h-10 px-3 flex items-center rounded-md bg-secondary/50 border border-border text-sm text-foreground">
                {formatMinutes(task?.total_tracked_minutes ?? task?.actual_minutes ?? 0)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Atualizado automaticamente pelo timer</p>
            </div>
          )}

          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Recorrência</Label>
              {isEdit && recurrence.type !== 'none' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={async () => {
                    try {
                      await updateTask.mutateAsync({ id: task.id, recurrence_config: { type: 'none' } as RecurrenceConfig });
                      setRecurrence(DEFAULT_RECURRENCE);
                      toast.success('Recorrência interrompida!');
                    } catch {
                      toast.error('Erro ao interromper recorrência');
                    }
                  }}
                >
                  Interromper Recorrência
                </Button>
              )}
            </div>
            <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações..." className="bg-secondary border-border" rows={3} />
          </div>

          <div className="flex gap-2 pt-2">
            {isEdit && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A tarefa será permanentemente excluída.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="submit" className="flex-1">
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
