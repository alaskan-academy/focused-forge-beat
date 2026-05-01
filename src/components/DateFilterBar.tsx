import { useState } from 'react';
import { DateFilter } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DateFilterBarProps {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
}

const filters: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'tomorrow', label: 'Amanhã' },
  { key: 'week', label: 'Esta Semana' },
  { key: 'custom', label: 'Personalizado' },
];

export default function DateFilterBar({ value, onChange }: DateFilterBarProps) {
  return (
    <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
            value === f.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
