import { RecurrenceConfig, WEEKDAY_LABELS } from '@/lib/recurrence';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface RecurrenceEditorProps {
  value: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
}

const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

export default function RecurrenceEditor({ value, onChange }: RecurrenceEditorProps) {
  const update = (partial: Partial<RecurrenceConfig>) => {
    onChange({ ...value, ...partial });
  };

  const toggleWeekday = (day: number) => {
    const current = value.days_of_week || [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    update({ days_of_week: next });
  };

  const toggleMonthDay = (day: number) => {
    const current = value.days_of_month || [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort();
    update({ days_of_month: next });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={value.type} onValueChange={(t) => update({ type: t as RecurrenceConfig['type'] })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem recorrência</SelectItem>
              <SelectItem value="daily">Diária</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {value.type !== 'none' && (
          <div>
            <Label>A cada</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={value.interval}
                onChange={(e) => update({ interval: Math.max(1, Number(e.target.value)) })}
                className="bg-secondary border-border w-20"
              />
              <span className="text-sm text-muted-foreground">
                {value.type === 'daily' ? 'dia(s)' : value.type === 'weekly' ? 'semana(s)' : 'mês(es)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {value.type === 'weekly' && (
        <div>
          <Label className="mb-2 block">Dias da Semana</Label>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleWeekday(i)}
                className={cn(
                  "w-10 h-10 rounded-lg text-xs font-medium transition-all",
                  (value.days_of_week || []).includes(i)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.type === 'monthly' && (
        <div>
          <Label className="mb-2 block">Dias do Mês</Label>
          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleMonthDay(day)}
                className={cn(
                  "w-9 h-9 rounded-lg text-xs font-medium transition-all",
                  (value.days_of_month || []).includes(day)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-accent"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
