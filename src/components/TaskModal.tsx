import { FormEvent, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import RecurrenceEditor from '@/components/RecurrenceEditor';
import { addCompletedDate, addSkippedDate, RecurrenceConfig, DEFAULT_RECURRENCE, parseRecurrence, toLocalDateKey } from '@/lib/recurrence';
import CompletionDateDialog from '@/components/CompletionDateDialog';
import { ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    completed_at?: string | null;
  } | null;
}

export default function TaskModal({ open, onClose, task }: TaskModalProps) {
  const isEdit = !!task;
  const [name, setName] = useState(task?.name || '');
  const [area, setArea] = useState(task?.area || 'personal');
  const [projectId, setProjectId] = useState(task?.project_id || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [startDate, setStartDate] = useState((task as any)?.start_date || '');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [estimated, setEstimated] = useState(String(task?.estimated_minutes || ''));
  const [actualMinutes, setActualMinutes] = useState(String(task?.total_tracked_minutes ?? task?.actual_minutes ?? ''));
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>(
    task?.recurrence_config ? parseRecurrence(task.recurrence_config) : DEFAULT_RECURRENCE
  );
  const [notes, setNotes] = useState(task?.notes || '');
  const [completedAt, setCompletedAt] = useState<string>(task?.completed_at || '');
  const [workBlock, setWorkBlock] = useState(() => {
    if (task?.work_block) return task.work_block;
    const rc = task?.recurrence_config as any;
    return rc?.work_block || 'none';
  });

  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const buildPayload = () => ({
    name: name.trim(),
    area,
    project_id: area === 'work' && projectId ? projectId : null,
    status,
    priority,
    start_date: startDate || null,
    due_date: dueDate || null,
    estimated_minutes: Number(estimated) || 0,
    actual_minutes: Number(actualMinutes) || 0,
    recurrence_config: recurrence,
    notes: notes || null,
    work_block: workBlock,
  });

  const saveTask = async (payload: any) => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = buildPayload();

    // Always ask for the completion date when marking as done.
    const wasNotDone = task?.status !== 'done';
    if (status === 'done' && wasNotDone) {
      setPendingPayload(payload);
      setShowCompletionDialog(true);
      return;
    }

    // Normal flow
    const finalPayload = {
      ...payload,
      completed_at: status === 'done' ? (completedAt || task?.completed_at || new Date().toISOString()) : null,
    };
    await saveTask(finalPayload);
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

  const handleSkipOccurrence = async () => {
    if (!task) return;
    try {
      const dateKey = toLocalDateKey(new Date());
      await updateTask.mutateAsync({
        id: task.id,
        recurrence_config: addSkippedDate(task.recurrence_config, dateKey),
      });
      toast.success('Ocorrência pulada!');
      onClose();
    } catch {
      toast.error('Erro ao pular ocorrência');
    }
  };

  const isRecurring = parseRecurrence(task?.recurrence_config).type !== 'none';

  return (
    <>
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-2">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="recurrence">Recorrência</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-0">
              {/* Name */}
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da tarefa" className="bg-secondary border-border" />
              </div>
              {/* Area / Status */}
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
              {/* Project */}
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
              {/* Priority */}
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
              {/* Start / End dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Início</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <Label>Prazo / Fim</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-secondary border-border" />
                </div>
              </div>
              {/* Estimated / Block */}
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
                      <SelectItem value="afternoon">Tarde (14h–18h)</SelectItem>
                      <SelectItem value="none">Sem bloco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Actual minutes (edit only) */}
              {isEdit && (
                <div>
                  <Label>Tempo Real (min)</Label>
                  <Input type="number" min={0} value={actualMinutes} onChange={(e) => setActualMinutes(e.target.value)} className="bg-secondary border-border" />
                  <p className="text-[10px] text-muted-foreground mt-1">Editável manualmente ou atualizado pelo timer</p>
                </div>
              )}
              {/* Completed at (edit + done) */}
              {isEdit && status === 'done' && (
                <div>
                  <Label>Concluída em</Label>
                  <Input
                    type="datetime-local"
                    value={completedAt ? new Date(new Date(completedAt).getTime() - new Date(completedAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCompletedAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="bg-secondary border-border"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="recurrence" className="mt-0">
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
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <div>
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações..." className="bg-secondary border-border" rows={6} />
              </div>
            </TabsContent>
          </Tabs>

          {/* Action buttons always visible */}
          <div className="flex gap-2 pt-2">
            {isEdit && isRecurring && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="destructive">
                    Excluir <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleSkipOccurrence} className="text-destructive focus:text-destructive">
                    Pular esta ocorrência
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    Excluir tarefa permanentemente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isEdit && !isRecurring && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">Excluir</Button>
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

    <CompletionDateDialog
      open={showCompletionDialog}
      taskName={name}
      onConfirm={async (completedAt) => {
        setShowCompletionDialog(false);
        if (pendingPayload) {
          const completedRecurrence = parseRecurrence(pendingPayload.recurrence_config);
          await saveTask(completedRecurrence.type !== 'none'
            ? {
                ...pendingPayload,
                status: 'todo',
                completed_at: null,
                recurrence_config: addCompletedDate(pendingPayload.recurrence_config, toLocalDateKey(new Date(completedAt))),
              }
            : { ...pendingPayload, completed_at: completedAt }
          );
          setPendingPayload(null);
        }
      }}
      onCancel={() => {
        setShowCompletionDialog(false);
        setPendingPayload(null);
      }}
    />
    </>
  );
}
