import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, CalendarClock, ChevronDown, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RecurrenceEditor from '@/components/RecurrenceEditor';
import MoveOccurrenceDialog from '@/components/MoveOccurrenceDialog';
import { useCreateTask, useUpdateTask, useDeleteTask, restoreTask, updateTaskRecurrence, NewTaskInput } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAddManualTime, manualTimeDayLabel } from '@/hooks/useManualTime';
import {
  RecurrenceConfig, DEFAULT_RECURRENCE, parseRecurrence, toLocalDateKey,
  addCompletedDate, removeCompletedDate, addSkippedDate, removeSkippedDate,
  endRecurrence, resumeRecurrence, moveOccurrence, undoMove,
} from '@/lib/recurrence';
import { addLocalDays } from '@/lib/dateUtils';
import { formatDayLabel, resolveOccurrenceKey } from '@/lib/occurrences';
import { formatDurationInput, formatMinutes, parseDuration } from '@/lib/formatters';
import { Task } from '@/lib/types';
import { UNDO_TOAST_DURATION } from '@/lib/utils';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  /** Day being viewed: which occurrence of a recurring task the modal acts on, and where time adjustments land. */
  contextDate?: Date | null;
  /** Prefill for new tasks. */
  defaults?: { name?: string; due_date?: string | null };
  onCreated?: () => void;
}

interface FormState {
  name: string;
  area: string;
  projectId: string;
  status: string;
  priority: string;
  startDate: string;
  dueDate: string;
  estimated: string;
  recurrence: RecurrenceConfig;
  notes: string;
  completedAt: string;
  workBlock: string;
}

export default function TaskModal({ open, onClose, task, contextDate, defaults, onCreated }: TaskModalProps) {
  const isEdit = !!task;
  const todayKey = toLocalDateKey(new Date());
  const savedRecurrence = parseRecurrence(task?.recurrence_config);
  const taskIsRecurring = savedRecurrence.type !== 'none';

  // The occurrence this modal acts on (recurring tasks only)
  const occurrenceKey = useMemo(
    () => (task && taskIsRecurring ? resolveOccurrenceKey(task, contextDate) : null),
    [task, taskIsRecurring, contextDate],
  );
  const occurrenceDone = !!occurrenceKey && (savedRecurrence.completed_dates || []).includes(occurrenceKey);
  const occurrenceSkipped = !!occurrenceKey && (savedRecurrence.skipped_dates || []).includes(occurrenceKey);

  // Snapshot of the form as opened — used to warn before discarding edits
  const [initial, setInitial] = useState<FormState>(() => ({
    name: task?.name ?? defaults?.name ?? '',
    area: task?.area || 'personal',
    projectId: task?.project_id || '',
    status: taskIsRecurring ? (occurrenceDone ? 'done' : 'todo') : (task?.status || 'todo'),
    priority: task?.priority || 'medium',
    startDate: task?.start_date || '',
    dueDate: task?.due_date ?? defaults?.due_date ?? '',
    estimated: formatDurationInput(task?.estimated_minutes),
    recurrence: task ? savedRecurrence : DEFAULT_RECURRENCE,
    notes: task?.notes || '',
    completedAt: task?.completed_at || '',
    workBlock: savedRecurrence.work_block || 'none',
  }));
  const [form, setForm] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const [addMinutes, setAddMinutes] = useState('');
  const [tab, setTab] = useState('basic');
  const [showErrors, setShowErrors] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: projects } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addTime = useAddManualTime();

  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || addMinutes.trim() !== '';
  const formIsRecurring = form.recurrence.type !== 'none';

  // Where manual time adjustments land: the viewed day (if not in the future), else today
  const contextKey = contextDate ? toLocalDateKey(contextDate) : null;
  const adjustDayKey = contextKey && contextKey < todayKey ? contextKey : todayKey;

  // Validation
  const estimatedMinutes = form.estimated.trim() ? parseDuration(form.estimated) : 0;
  const adjustMinutes = addMinutes.trim() ? parseDuration(addMinutes) : 0;
  const errors = {
    name: !form.name.trim() ? 'Dê um nome à tarefa.' : null,
    dates: !formIsRecurring && form.startDate && form.dueDate && form.startDate > form.dueDate
      ? 'O início não pode ser depois do prazo.'
      : null,
    estimated: estimatedMinutes === null || estimatedMinutes < 0 ? 'Use minutos ou horas, ex: 90 ou 1h30.' : null,
    adjust: adjustMinutes === null ? 'Ex: 30, 1h ou -15.' : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const requestClose = () => {
    if (dirty) setConfirmClose(true);
    else onClose();
  };

  /** Runs a quick recurrence action on the saved task and mirrors it in the open form. */
  const applyRecurrenceAction = async (
    change: (rc: RecurrenceConfig) => RecurrenceConfig,
    message: string,
    undo?: (rc: RecurrenceConfig) => RecurrenceConfig,
  ) => {
    if (!task) return;
    setBusy(true);
    try {
      await updateTaskRecurrence(task.id, change);
      setForm((f) => ({ ...f, recurrence: change(f.recurrence) }));
      setInitial((i) => ({ ...i, recurrence: change(i.recurrence) }));
      const taskId = task.id;
      toast.success(message, {
        description: task.name,
        duration: undo ? UNDO_TOAST_DURATION : undefined,
        action: undo ? {
          label: 'Desfazer',
          onClick: () => updateTaskRecurrence(taskId, undo).catch(() => toast.error('Erro ao desfazer')),
        } : undefined,
      });
      return true;
    } catch {
      toast.error('Erro ao atualizar a recorrência');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (fromKey: string, toKey: string) => {
    const ok = await applyRecurrenceAction(
      (rc) => moveOccurrence(rc, fromKey, toKey),
      `Ocorrência movida: ${formatDayLabel(fromKey)} → ${formatDayLabel(toKey)}`,
      (rc) => moveOccurrence(rc, toKey, fromKey),
    );
    if (ok) {
      setMoveOpen(false);
      if (!dirty) onClose();
    }
  };

  const handleSkip = async () => {
    if (!occurrenceKey) return;
    const key = occurrenceKey;
    const ok = await applyRecurrenceAction(
      (rc) => addSkippedDate(rc, key),
      `Ocorrência de ${formatDayLabel(key)} pulada`,
      (rc) => removeSkippedDate(rc, key),
    );
    if (ok && !dirty) onClose();
  };

  const handleEnd = async () => {
    // Ends yesterday: today's occurrence disappears too; past history stays
    const lastKey = toLocalDateKey(addLocalDays(new Date(), -1));
    const ok = await applyRecurrenceAction(
      (rc) => endRecurrence(rc, lastKey),
      'Recorrência encerrada — o histórico foi mantido',
      resumeRecurrence,
    );
    if (ok && !dirty) onClose();
  };

  const handleResume = () => applyRecurrenceAction(resumeRecurrence, 'Recorrência retomada');

  const handleUndoMove = (originKey: string) =>
    applyRecurrenceAction((rc) => undoMove(rc, originKey), `${formatDayLabel(originKey)} voltou para o dia original`);

  const handleDelete = async () => {
    if (!task) return;
    const taskId = task.id;
    try {
      await deleteTask.mutateAsync(taskId);
      onClose();
      toast.success('Tarefa movida para a Lixeira', {
        description: task.name,
        duration: UNDO_TOAST_DURATION,
        action: {
          label: 'Desfazer',
          onClick: () => restoreTask(taskId)
            .then(() => toast.success('Tarefa restaurada'))
            .catch(() => toast.error('Erro ao restaurar')),
        },
      });
    } catch {
      toast.error('Erro ao excluir tarefa');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (hasErrors) {
      setShowErrors(true);
      if (errors.name || errors.dates || errors.estimated || errors.adjust) setTab('basic');
      return;
    }

    const base: NewTaskInput = {
      name: form.name.trim(),
      area: form.area,
      project_id: form.area === 'work' && form.projectId ? form.projectId : null,
      priority: form.priority,
      start_date: form.startDate || null,
      due_date: form.dueDate || null,
      estimated_minutes: estimatedMinutes || 0,
      notes: form.notes || null,
      work_block: form.workBlock,
    };

    let payload: NewTaskInput;
    if (formIsRecurring) {
      // Recurring: completion is stored per occurrence, the task itself stays "todo"
      let rc = form.recurrence;
      const key = occurrenceKey ?? contextKey ?? todayKey;
      const wasDone = (rc.completed_dates || []).includes(key);
      if (form.status === 'done' && !wasDone) rc = addCompletedDate(rc, key);
      if (form.status !== 'done' && wasDone) rc = removeCompletedDate(rc, key);
      payload = { ...base, status: 'todo', completed_at: null, recurrence_config: rc };
    } else {
      payload = {
        ...base,
        status: form.status,
        completed_at: form.status === 'done' ? (form.completedAt || new Date().toISOString()) : null,
        recurrence_config: form.recurrence,
      };
    }

    setBusy(true);
    try {
      if (isEdit) {
        await updateTask.mutateAsync({ id: task.id, ...payload });
        if (adjustMinutes) {
          await addTime.mutateAsync({ taskId: task.id, minutes: adjustMinutes, dateKey: adjustDayKey });
        }
        toast.success('Tarefa atualizada!');
      } else {
        await createTask.mutateAsync(payload);
        toast.success('Tarefa criada!');
        onCreated?.();
      }
      onClose();
    } catch {
      toast.error('Erro ao salvar tarefa');
    } finally {
      setBusy(false);
    }
  };

  const endDate = form.recurrence.end_date;
  const moves = Object.entries(form.recurrence.rescheduled || {})
    .filter(([from, to]) => (from > to ? from : to) >= toLocalDateKey(addLocalDays(new Date(), -7)))
    .sort(([a], [b]) => a.localeCompare(b));

  const trackedLabel = taskIsRecurring
    ? `Registrado em ${manualTimeDayLabel(adjustDayKey)}: `
    : 'Total registrado: ';
  const trackedValue = taskIsRecurring
    ? task?.session_minutes_by_date?.[adjustDayKey] ?? 0
    : task?.total_tracked_minutes ?? task?.actual_minutes ?? 0;

  const errorText = (msg: string | null) =>
    showErrors && msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) requestClose(); }}>
        <DialogContent
          className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto"
          // Editing: don't jump focus into a field (avoids the phone keyboard popping up on open)
          onOpenAutoFocus={(e) => { if (isEdit) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-2">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="recurrence">Recorrência</TabsTrigger>
                <TabsTrigger value="notes">Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-0">
                <div>
                  <Label htmlFor="task-name">Nome</Label>
                  <Input
                    id="task-name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Nome da tarefa"
                    className="bg-secondary border-border"
                    autoFocus={!isEdit}
                  />
                  {errorText(errors.name)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Área</Label>
                    <Select value={form.area} onValueChange={(v) => set('area', v)}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Pessoal</SelectItem>
                        <SelectItem value="work">Trabalho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      Status
                      {formIsRecurring && (occurrenceKey ?? contextKey) && (
                        <span className="text-muted-foreground font-normal"> · {formatDayLabel(occurrenceKey ?? contextKey!)}</span>
                      )}
                    </Label>
                    <Select
                      value={formIsRecurring && form.status === 'in_progress' ? 'todo' : form.status}
                      onValueChange={(v) => setForm((f) => ({
                        ...f,
                        status: v,
                        completedAt: v === 'done' ? (f.completedAt || new Date().toISOString()) : '',
                      }))}
                    >
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        {!formIsRecurring && <SelectItem value="in_progress">Em Andamento</SelectItem>}
                        <SelectItem value="done">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.area === 'work' && (
                  <div>
                    <Label>Projeto</Label>
                    <Select value={form.projectId} onValueChange={(v) => set('projectId', v)}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Selecionar projeto" /></SelectTrigger>
                      <SelectContent>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formIsRecurring ? (
                  <div>
                    <Label htmlFor="task-due">Primeira ocorrência</Label>
                    <Input id="task-due" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className="bg-secondary border-border" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Os dias seguintes vêm da aba Recorrência. Para trocar um dia só, use Ocorrência → Mover.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="task-start">Início</Label>
                        <Input id="task-start" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className="bg-secondary border-border" />
                      </div>
                      <div>
                        <Label htmlFor="task-due">Prazo / Fim</Label>
                        <Input id="task-due" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className="bg-secondary border-border" />
                      </div>
                    </div>
                    {errorText(errors.dates)}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="task-estimate">Tempo estimado</Label>
                    <Input
                      id="task-estimate"
                      value={form.estimated}
                      onChange={(e) => set('estimated', e.target.value)}
                      placeholder="ex: 90 ou 1h30"
                      className="bg-secondary border-border"
                    />
                    {errors.estimated
                      ? errorText(errors.estimated)
                      : estimatedMinutes ? <p className="text-xs text-muted-foreground mt-1">= {formatMinutes(estimatedMinutes)}</p> : null}
                  </div>
                  <div>
                    <Label>Bloco de Trabalho</Label>
                    <Select value={form.workBlock} onValueChange={(v) => set('workBlock', v)}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Manhã (9h–12h)</SelectItem>
                        <SelectItem value="afternoon">Tarde (14h–18h)</SelectItem>
                        <SelectItem value="none">Sem bloco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isEdit && (
                  <div>
                    <Label htmlFor="task-adjust">Ajustar tempo — {manualTimeDayLabel(adjustDayKey)}</Label>
                    <Input
                      id="task-adjust"
                      placeholder="+30, 1h ou -15"
                      value={addMinutes}
                      onChange={(e) => setAddMinutes(e.target.value)}
                      className="bg-secondary border-border"
                    />
                    {errorText(errors.adjust) ?? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {trackedLabel}<strong>{formatMinutes(trackedValue)}</strong>
                        {adjustMinutes ? <> → <strong>{formatMinutes(trackedValue + adjustMinutes)}</strong></> : null}
                      </p>
                    )}
                  </div>
                )}

                {form.status === 'done' && !formIsRecurring && (
                  <div>
                    <Label htmlFor="task-completed">Concluída em</Label>
                    <Input
                      id="task-completed"
                      type="datetime-local"
                      value={form.completedAt ? new Date(new Date(form.completedAt).getTime() - new Date(form.completedAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => set('completedAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="bg-secondary border-border"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recurrence" className="mt-0">
                <div className="border border-border rounded-lg p-4 bg-secondary/30 space-y-4">
                  <RecurrenceEditor value={form.recurrence} onChange={(rc) => set('recurrence', rc)} />

                  {isEdit && taskIsRecurring && (
                    <div className="border-t border-border pt-4 space-y-4">
                      {endDate ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-muted-foreground">
                            {endDate < todayKey ? 'Encerrada' : 'Termina'} em <strong className="text-foreground">{formatDayLabel(endDate)}</strong>
                          </p>
                          <Button type="button" size="sm" variant="outline" onClick={handleResume} disabled={busy}>
                            Retomar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">Parar de repetir a partir de hoje, mantendo o histórico.</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                            onClick={() => setConfirmEnd(true)}
                            disabled={busy}
                          >
                            Encerrar recorrência
                          </Button>
                        </div>
                      )}

                      {moves.length > 0 && (
                        <div className="space-y-2">
                          <Label>Dias remarcados</Label>
                          {moves.map(([from, to]) => (
                            <div key={from} className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex items-center gap-1.5">
                                {formatDayLabel(from)} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /> {formatDayLabel(to)}
                              </span>
                              <Button type="button" size="sm" variant="ghost" className="h-7 gap-1" onClick={() => handleUndoMove(from)} disabled={busy}>
                                <Undo2 className="h-3.5 w-3.5" /> Desfazer
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <div>
                  <Label htmlFor="task-notes">Notas</Label>
                  <Textarea id="task-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anotações..." className="bg-secondary border-border" rows={6} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-2">
              {isEdit && taskIsRecurring && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="gap-1.5 px-3" disabled={busy}>
                      <CalendarClock className="h-4 w-4" />
                      Ocorrência
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      {occurrenceKey ? `Ocorrência de ${formatDayLabel(occurrenceKey)}` : 'Nenhuma ocorrência pendente'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setMoveOpen(true)}>
                      Mover para outro dia…
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={!occurrenceKey || occurrenceDone || occurrenceSkipped} onSelect={handleSkip}>
                      Pular esta ocorrência
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                  aria-label="Excluir tarefa"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Excluir</span>
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={busy}>
                {isEdit ? 'Salvar' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>O que você mudou nesta tarefa ainda não foi salvo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{task?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {taskIsRecurring
                ? 'A tarefa e todas as próximas ocorrências saem das listas. Para tirar só um dia, use Ocorrência → Pular ou Mover. Ela fica na Lixeira e pode ser restaurada.'
                : 'A tarefa vai para a Lixeira e pode ser restaurada depois.'}
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

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar a recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              “{task?.name}” deixa de aparecer a partir de hoje. As conclusões passadas ficam guardadas e você pode retomar quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnd} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {task && taskIsRecurring && (
        <MoveOccurrenceDialog
          open={moveOpen}
          onOpenChange={setMoveOpen}
          task={task}
          initialFromKey={occurrenceKey}
          onMove={handleMove}
          saving={busy}
        />
      )}
    </>
  );
}
