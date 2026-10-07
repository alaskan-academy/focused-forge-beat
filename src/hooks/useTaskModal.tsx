import { useState } from 'react';
import TaskModal from '@/components/TaskModal';
import { Task } from '@/lib/types';

interface ModalState {
  task: Task | null;
  contextDate: Date | null;
  viewedDate: Date | null;
  defaults?: { name?: string; due_date?: string | null };
  onCreated?: () => void;
}

/** Opens the task modal for editing or creating. Render `modal` once in the page. */
export function useTaskModal() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  const [state, setState] = useState<ModalState>({ task: null, contextDate: null, viewedDate: null });

  const show = (next: ModalState) => {
    setState(next);
    setKey((k) => k + 1); // fresh form state each time
    setOpen(true);
  };

  /**
   * `contextDate`: the occurrence to act on (viewed day, or the missed day of an overdue row).
   * `viewedDate`: the day on screen, where completions and time count; defaults to `contextDate`.
   */
  const openTask = (task: Task, contextDate: Date | null = null, viewedDate: Date | null = contextDate) =>
    show({ task, contextDate, viewedDate });
  const openNew = (defaults?: ModalState['defaults'], onCreated?: () => void) =>
    show({ task: null, contextDate: null, viewedDate: null, defaults, onCreated });

  const modal = (
    <TaskModal
      key={key}
      open={open}
      onClose={() => setOpen(false)}
      task={state.task}
      contextDate={state.contextDate}
      viewedDate={state.viewedDate}
      defaults={state.defaults}
      onCreated={state.onCreated}
    />
  );

  return { openTask, openNew, modal };
}
