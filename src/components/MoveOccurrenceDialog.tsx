import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDayLabel, hasOccurrenceOn, listMovableOccurrences } from '@/lib/occurrences';
import { fromLocalDateKey, parseRecurrence, toLocalDateKey } from '@/lib/recurrence';

interface MoveOccurrenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: { name: string; due_date?: string | null; created_at?: string; recurrence_config?: unknown };
  /** Occurrence preselected in the "from" field. */
  initialFromKey?: string | null;
  onMove: (fromKey: string, toKey: string) => Promise<void> | void;
  saving?: boolean;
}

/** Moves one occurrence of a recurring task to another day, leaving the rest of the schedule as is. */
export default function MoveOccurrenceDialog({ open, onOpenChange, task, initialFromKey, onMove, saving }: MoveOccurrenceDialogProps) {
  const options = useMemo(() => listMovableOccurrences(task), [task]);
  const todayKey = toLocalDateKey(new Date());
  const endDate = parseRecurrence(task.recurrence_config).end_date;

  const [fromKey, setFromKey] = useState<string>('');
  const [toDate, setToDate] = useState<Date | undefined>();

  // Reset the form each time the dialog opens (not on background refetches while it is open)
  useEffect(() => {
    if (!open) return;
    const preferred = initialFromKey && options.includes(initialFromKey) ? initialFromKey : null;
    setFromKey(preferred ?? options.find((k) => k >= todayKey) ?? options[options.length - 1] ?? '');
    setToDate(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toKey = toDate ? toLocalDateKey(toDate) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Mover ocorrência</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{task.name}</span> — só este dia muda; a recorrência continua igual.
          </DialogDescription>
        </DialogHeader>

        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma ocorrência pendente entre a última semana e os próximos 2 meses.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Ocorrência</Label>
              <Select value={fromKey} onValueChange={(v) => { setFromKey(v); setToDate(undefined); }}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options.map((k) => (
                    <SelectItem key={k} value={k}>
                      {formatDayLabel(k)}{k < todayKey ? ' (atrasada)' : k === todayKey ? ' (hoje)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Novo dia</Label>
              <div className="flex justify-center rounded-lg border border-border">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  locale={ptBR}
                  defaultMonth={fromKey ? fromLocalDateKey(fromKey) : undefined}
                  disabled={(date) => {
                    const key = toLocalDateKey(date);
                    if (key === fromKey) return true;
                    if (endDate && key > endDate) return true;
                    return hasOccurrenceOn(task, date);
                  }}
                  className="p-3 pointer-events-auto"
                />
              </div>
              <p className="text-xs text-muted-foreground">Dias que já têm esta tarefa ficam bloqueados.</p>
            </div>

            {fromKey && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="font-medium">{formatDayLabel(fromKey)}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className={toKey ? 'font-medium text-primary' : 'text-muted-foreground'}>
                  {toKey ? formatDayLabel(toKey) : 'escolha o dia'}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            type="button"
            disabled={!fromKey || !toKey || saving}
            onClick={() => fromKey && toKey && onMove(fromKey, toKey)}
          >
            Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
