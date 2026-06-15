import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
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
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (editing) {
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing]);

  const save = async () => {
    setEditing(false);
    const mins = parseInt(input, 10);
    // Input is minutes to add (positive) or remove (negative) — zero or empty means no change.
    if (!input.trim() || isNaN(mins) || mins === 0) return;
    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('timer_sessions').insert({
        task_id: taskId,
        started_at: now,
        ended_at: now,
        duration_minutes: mins,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['tasks_with_time'] });
    } catch {
      toast.error('Erro ao salvar tempo real');
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        placeholder="min"
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
      title="Clique para adicionar tempo (min)"
    >
      <Clock className="h-3 w-3" />
      {formatMinutes(value)}
    </span>
  );
}
