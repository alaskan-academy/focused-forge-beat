import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { useUpdateTask } from '@/hooks/useTasks';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
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
  const qc = useQueryClient();

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
      const rc = recurrenceConfig as any;
      const isRecurring = rc?.type && rc.type !== 'none';

      if (isRecurring) {
        // Recurring tasks: timer_sessions is the source of truth.
        // Insert the DELTA as a new session so the daily total becomes `mins`.
        const delta = Math.round((mins - value) * 100) / 100;
        if (delta > 0) {
          const now = new Date().toISOString();
          const { error } = await supabase.from('timer_sessions').insert({
            task_id: taskId,
            started_at: now,
            ended_at: now,
            duration_minutes: delta,
          });
          if (error) throw error;
          // Also mirror into actual_minutes for non-display uses
          await updateTask.mutateAsync({ id: taskId, actual_minutes: mins });
          qc.invalidateQueries({ queryKey: ['tasks_with_time'] });
        }
        // delta <= 0: reducing time not supported (would require deleting sessions)
      } else {
        await updateTask.mutateAsync({ id: taskId, actual_minutes: mins });
      }
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
