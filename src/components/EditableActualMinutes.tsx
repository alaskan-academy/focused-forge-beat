import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useUpdateTask } from '@/hooks/useTasks';
import { formatMinutes } from '@/lib/formatters';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

interface EditableActualMinutesProps {
  taskId: string;
  value: number;
  /** Pass the task's recurrence_config so manual edits are saved as per-date overrides
   *  (time_by_date_manual[today]) without affecting timer_sessions history. */
  recurrenceConfig?: unknown;
}

export default function EditableActualMinutes({ taskId, value, recurrenceConfig }: EditableActualMinutesProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value || 0));
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTask = useUpdateTask();

  useEffect(() => {
    if (editing) {
      setInput(String(value || 0));
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, value]);

  const save = async () => {
    setEditing(false);
    const mins = Math.max(0, parseInt(input, 10));
    if (isNaN(mins) || mins === value) return;
    try {
      const updates: Parameters<typeof updateTask.mutateAsync>[0] = {
        id: taskId,
        actual_minutes: mins,
      };

      if (recurrenceConfig) {
        const rc = recurrenceConfig as any;
        if (rc?.type && rc.type !== 'none') {
          // Recurring tasks: persist the manual value as a per-date override so it shows
          // correctly alongside (or instead of) timer_sessions for today.
          // Uses local date key (sv-SE = YYYY-MM-DD) to match useTasks grouping.
          const today = new Date().toLocaleDateString('sv-SE');
          const manualOverrides = { ...(rc.time_by_date_manual || {}), [today]: mins };
          (updates as any).recurrence_config = { ...rc, time_by_date_manual: manualOverrides };
        }
      }

      await updateTask.mutateAsync(updates);
    } catch {
      toast.error('Erro ao salvar tempo real');
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        min={0}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        onClick={(e) => e.stopPropagation()}
        className="w-16 h-6 text-xs px-1 py-0"
      />
    );
  }

  return (
    <span
      className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title="Clique para editar tempo real (min)"
    >
      <Clock className="h-3 w-3" />
      {formatMinutes(value)}
    </span>
  );
}
