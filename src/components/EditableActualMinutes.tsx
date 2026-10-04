import { useState, useRef, useEffect } from 'react';
import { Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { formatMinutes, parseDuration } from '@/lib/formatters';
import { toLocalDateKey } from '@/lib/recurrence';
import { useAddManualTime, manualTimeDayLabel } from '@/hooks/useManualTime';

interface EditableActualMinutesProps {
  taskId: string;
  value: number;
  /** Day the adjustment is recorded on (yyyy-MM-dd). Defaults to today; future days fall back to today. */
  dateKey?: string;
}

/** Shows tracked time; click to add (or remove, with a minus sign) minutes on the viewed day. */
export default function EditableActualMinutes({ taskId, value, dateKey }: EditableActualMinutesProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const addTime = useAddManualTime();

  const todayKey = toLocalDateKey(new Date());
  const targetKey = dateKey && dateKey < todayKey ? dateKey : todayKey;

  useEffect(() => {
    if (editing) {
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing]);

  const minutes = parseDuration(input);

  const save = () => {
    if (minutes === null || minutes === 0) { setEditing(false); return; }
    setEditing(false);
    addTime.mutate(
      { taskId, minutes, dateKey: targetKey },
      {
        onSuccess: () => toast.success(`${minutes > 0 ? '+' : ''}${formatMinutes(minutes)} em ${manualTimeDayLabel(targetKey)}`),
        onError: () => toast.error('Erro ao registrar o tempo'),
      },
    );
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          ref={inputRef}
          inputMode="text"
          enterKeyHint="done"
          placeholder="+30 / -15"
          aria-label={`Adicionar tempo em ${manualTimeDayLabel(targetKey)} (use - para remover)`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); save(); }
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-20 h-6 text-xs px-1.5 py-0"
        />
        <button
          type="button"
          // Keep focus in the input so blur doesn't cancel before the click lands
          onMouseDown={(e) => e.preventDefault()}
          onClick={save}
          disabled={minutes === null || minutes === 0}
          className="p-1 rounded bg-primary/15 text-primary disabled:opacity-40"
          aria-label="Confirmar tempo"
        >
          <Check className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded hover:text-foreground transition-colors"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      title={`Adicionar ou remover tempo em ${manualTimeDayLabel(targetKey)}`}
    >
      <Clock className="h-3 w-3" />
      {formatMinutes(value)}
    </button>
  );
}
