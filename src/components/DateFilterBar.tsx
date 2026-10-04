import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DateFilter } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DayRange, addLocalDays, getFilterRange, getWeekRange } from '@/lib/dateUtils';
import { toLocalDateKey } from '@/lib/recurrence';
import { formatDayLabel } from '@/lib/occurrences';

interface DateFilterBarProps {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
  customRange?: DayRange | null;
  onCustomRangeChange?: (range: DayRange | null) => void;
}

const filters: { key: Exclude<DateFilter, 'custom'>; label: string; desktopOnly?: boolean }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem', desktopOnly: true },
  { key: 'tomorrow', label: 'Amanhã', desktopOnly: true },
  { key: 'week', label: 'Semana' },
];

/** Names a range with the fixed filters when it matches one (today, yesterday, tomorrow, this week). */
function filterForRange(range: DayRange): DateFilter {
  const today = new Date();
  const fromKey = toLocalDateKey(range.from);
  const toKey = toLocalDateKey(range.to);
  if (fromKey === toKey) {
    if (fromKey === toLocalDateKey(today)) return 'today';
    if (fromKey === toLocalDateKey(addLocalDays(today, -1))) return 'yesterday';
    if (fromKey === toLocalDateKey(addLocalDays(today, 1))) return 'tomorrow';
  }
  const week = getWeekRange(today);
  if (fromKey === toLocalDateKey(week.from) && toKey === toLocalDateKey(week.to)) return 'week';
  return 'custom';
}

export default function DateFilterBar({ value, onChange, customRange, onCustomRangeChange }: DateFilterBarProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      const newRange = { from: range.from, to: range.to || range.from };
      onCustomRangeChange?.(newRange);
      if (range.to) {
        onChange('custom');
        setPopoverOpen(false);
      }
    }
  };

  /** Moves the viewed period back or forward by its own length (a day, or a week). */
  const shift = (direction: -1 | 1) => {
    const range = getFilterRange(value, customRange) ?? getFilterRange('today')!;
    const length = Math.round((range.to.getTime() - range.from.getTime()) / 86400000) + 1;
    const next = { from: addLocalDays(range.from, direction * length), to: addLocalDays(range.to, direction * length) };
    const named = filterForRange(next);
    if (named === 'custom') onCustomRangeChange?.(next);
    onChange(named);
  };

  const customLabel = value === 'custom' && customRange
    ? customRange.from.getTime() === customRange.to.getTime()
      ? formatDayLabel(toLocalDateKey(customRange.from))
      : `${format(customRange.from, 'dd/MM', { locale: ptBR })} – ${format(customRange.to, 'dd/MM', { locale: ptBR })}`
    : 'Período';

  const arrowClass = 'p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0';
  const pillClass = (active: boolean) => cn(
    'px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
    active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
  );

  return (
    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 max-w-full">
      <button type="button" onClick={() => shift(-1)} className={arrowClass} aria-label="Período anterior" title="Período anterior">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className={cn(pillClass(value === f.key), f.desktopOnly && 'hidden sm:inline-flex')}
        >
          {f.label}
        </button>
      ))}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={cn(pillClass(value === 'custom'), 'flex items-center gap-1 capitalize')}>
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
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
      <button type="button" onClick={() => shift(1)} className={arrowClass} aria-label="Próximo período" title="Próximo período">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
