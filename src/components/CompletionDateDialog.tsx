import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompletionDateDialogProps {
  open: boolean;
  taskName: string;
  initialDate?: Date;
  onConfirm: (completedAt: string) => void;
  onCancel: () => void;
}

export default function CompletionDateDialog({ open, taskName, initialDate, onConfirm, onCancel }: CompletionDateDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());

  useEffect(() => {
    if (open) setSelectedDate(initialDate || new Date());
  }, [open, initialDate]);

  const handleConfirm = () => {
    // Set time to end of day for past dates, now for today
    const now = new Date();
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    let completedAt: Date;
    if (isToday) {
      completedAt = now;
    } else {
      // Set to 23:59 of the selected day
      completedAt = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 0);
    }

    onConfirm(completedAt.toISOString());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quando você concluiu esta tarefa?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2 truncate">
          {taskName}
        </p>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            locale={ptBR}
            disabled={(date) => date > new Date()}
            className="pointer-events-auto"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Selecionado: <strong>{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</strong>
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
