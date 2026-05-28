export const REMINDER_COLORS = {
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/25',
    text: 'text-yellow-200',
    dot: 'bg-yellow-400',
    label: 'Amarelo',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    text: 'text-blue-200',
    dot: 'bg-blue-400',
    label: 'Azul',
  },
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    text: 'text-emerald-200',
    dot: 'bg-emerald-400',
    label: 'Verde',
  },
  pink: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/25',
    text: 'text-rose-200',
    dot: 'bg-rose-400',
    label: 'Rosa',
  },
  purple: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    text: 'text-violet-200',
    dot: 'bg-violet-400',
    label: 'Roxo',
  },
} as const;

export type ReminderColor = keyof typeof REMINDER_COLORS;

export const REMINDER_COLOR_KEYS = Object.keys(REMINDER_COLORS) as ReminderColor[];
