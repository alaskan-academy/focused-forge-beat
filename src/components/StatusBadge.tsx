import { cn } from '@/lib/utils';
import { statusLabel } from '@/lib/formatters';

interface StatusBadgeProps {
  status: string;
  onChange?: (status: string) => void;
}

export default function StatusBadge({ status, onChange }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    todo: 'bg-status-todo/15 text-status-todo',
    in_progress: 'bg-status-in-progress/15 text-status-in-progress',
    done: 'bg-status-done/15 text-status-done',
  };

  if (onChange) {
    const nextStatus: Record<string, string> = {
      todo: 'in_progress',
      in_progress: 'done',
      done: 'todo',
    };
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onChange(nextStatus[status] || 'todo'); }}
        className={cn('px-2 py-0.5 text-xs font-medium rounded-full transition-all hover:opacity-80', styles[status])}
      >
        {statusLabel(status)}
      </button>
    );
  }

  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', styles[status])}>
      {statusLabel(status)}
    </span>
  );
}
