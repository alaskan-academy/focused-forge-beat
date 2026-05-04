import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useUpdateTask } from '@/hooks/useTasks';
import { formatMinutes } from '@/lib/formatters';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

interface EditableActualMinutesProps {
  taskId: string;
  value: number;
}

export default function EditableActualMinutes({ taskId, value }: EditableActualMinutesProps) {
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
    const mins = parseInt(input, 10);
    if (isNaN(mins) || mins === value) return;
    try {
      await updateTask.mutateAsync({ id: taskId, actual_minutes: Math.max(0, mins) });
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
