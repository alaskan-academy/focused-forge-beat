import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { DateFilter } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';

interface DateFilterBarProps {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
  customRange?: { from: Date; to: Date } | null;
  onCustomRangeChange?: (range: { from: Date; to: Date } | null) => void;
}

const filters: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'tomorrow', label: 'Amanhã' },
  { key: 'week', label: 'Esta Semana' },
  { key: 'custom', label: 'Personalizado' },
];

export default function DateFilterBar({ value, onChange, customRange, onCustomRangeChange }: DateFilterBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleFilterClick = (key: DateFilter) => {
    if (key === 'custom') {
      setPopoverOpen(true);
    } else {
      onChange(key);
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      const newRange = { from: range.from, to: range.to || range.from };
      onCustomRangeChange?.(newRange);
      if (range.to) {
        onChange('custom');
      }
    }
  };

  const customLabel = value === 'custom' && customRange
    ? customRange.from.getTime() === customRange.to.getTime()
      ? format(customRange.from, 'dd/MM', { locale: ptBR })
      : `${format(customRange.from, 'dd/MM', { locale: ptBR })} - ${format(customRange.to, 'dd/MM', { locale: ptBR })}`
    : 'Personalizado';

  return (
    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
      {filters.map((f) => (
        f.key === 'custom' ? (
          <Popover key={f.key} open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => handleFilterClick('custom')}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                  value === 'custom'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                {customLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={customRange ? { from: customRange.from, to: customRange.to } : undefined}
                onSelect={handleRangeSelect}
                numberOfMonths={1}
                locale={ptBR}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <button
            key={f.key}
            onClick={() => handleFilterClick(f.key)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              value === f.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        )
      ))}
    </div>
  );
}
