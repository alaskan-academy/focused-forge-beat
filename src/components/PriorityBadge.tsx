import { cn } from '@/lib/utils';
import { priorityLabel } from '@/lib/formatters';

export default function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: 'bg-priority-high/15 text-priority-high',
    medium: 'bg-priority-medium/15 text-priority-medium',
    low: 'bg-priority-low/15 text-priority-low',
  };
  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', styles[priority])}>
      {priorityLabel(priority)}
    </span>
  );
}
