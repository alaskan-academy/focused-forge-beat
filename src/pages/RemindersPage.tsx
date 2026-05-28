import { useState } from 'react';
import {
  useReminders, useArchivedReminders,
  useCreateReminder, useUpdateReminder,
  useDeleteReminder, useArchiveReminder, useUnarchiveReminder,
  Reminder,
} from '@/hooks/useReminders';
import { REMINDER_COLORS, REMINDER_COLOR_KEYS, ReminderColor } from '@/lib/reminderColors';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Plus, Trash2, Archive, ArchiveRestore, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatCreatedAt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    + ', '
    + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function ColorPicker({ value, onChange }: { value: ReminderColor; onChange: (c: ReminderColor) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {REMINDER_COLOR_KEYS.map((c) => (
        <button
          key={c}
          type="button"
          title={REMINDER_COLORS[c].label}
          onClick={() => onChange(c)}
          className={cn(
            'h-5 w-5 rounded-full transition-all shrink-0',
            REMINDER_COLORS[c].dot,
            value === c ? 'ring-2 ring-offset-2 ring-offset-card ring-white/50 scale-110' : 'opacity-60 hover:opacity-100'
          )}
        />
      ))}
    </div>
  );
}

function ReminderCard({ reminder, archived = false }: { reminder: Reminder; archived?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(reminder.content);
  const [color, setColor] = useState<ReminderColor>(reminder.color);
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const archiveReminder = useArchiveReminder();
  const unarchiveReminder = useUnarchiveReminder();
  const colors = REMINDER_COLORS[color];
  const cardColors = REMINDER_COLORS[reminder.color] ?? REMINDER_COLORS.yellow;

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      await updateReminder.mutateAsync({ id: reminder.id, content: content.trim(), color });
      setEditing(false);
      toast.success('Lembrete atualizado');
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReminder.mutateAsync(reminder.id);
      toast.success('Lembrete removido');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveReminder.mutateAsync(reminder.id);
      toast.success('Lembrete arquivado');
    } catch {
      toast.error('Erro ao arquivar');
    }
  };

  const handleUnarchive = async () => {
    try {
      await unarchiveReminder.mutateAsync(reminder.id);
      toast.success('Lembrete restaurado');
    } catch {
      toast.error('Erro ao restaurar');
    }
  };

  const handleCancel = () => {
    setContent(reminder.content);
    setColor(reminder.color);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn('rounded-xl border p-4 space-y-3', colors.bg, colors.border)}>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-transparent border-0 p-0 resize-none focus-visible:ring-0 text-sm min-h-[80px]"
          autoFocus
        />
        <div className="flex items-center justify-between">
          <ColorPicker value={color} onChange={setColor} />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!content.trim() || updateReminder.isPending} className="h-7 px-3 gap-1">
              <Check className="h-3.5 w-3.5" /> Salvar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-4 group transition-all hover:brightness-110 relative',
        cardColors.bg, cardColors.border,
        archived ? 'opacity-60' : 'cursor-pointer',
      )}
      onClick={() => { if (!archived) setEditing(true); }}
    >
      <p className={cn('text-sm leading-relaxed whitespace-pre-wrap break-words pr-16', cardColors.text)}>
        {reminder.content}
      </p>

      {/* Creation date — subtle, bottom */}
      <p className="text-[10px] text-muted-foreground/50 mt-2">
        {formatCreatedAt(reminder.created_at)}
      </p>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {archived ? (
          <button
            onClick={(e) => { e.stopPropagation(); handleUnarchive(); }}
            className="p-1.5 rounded hover:bg-black/20"
            title="Restaurar"
            disabled={unarchiveReminder.isPending}
          >
            <ArchiveRestore className={cn('h-3.5 w-3.5', cardColors.text)} />
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); handleArchive(); }}
            className="p-1.5 rounded hover:bg-black/20"
            title="Arquivar"
            disabled={archiveReminder.isPending}
          >
            <Archive className={cn('h-3.5 w-3.5', cardColors.text)} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
          className="p-1.5 rounded hover:bg-black/20"
          title="Excluir permanentemente"
          disabled={deleteReminder.isPending}
        >
          <Trash2 className={cn('h-3.5 w-3.5', cardColors.text)} />
        </button>
      </div>

      {!archived && (
        <div className={cn('mt-1 h-1 w-6 rounded-full opacity-40', REMINDER_COLORS[reminder.color]?.dot)} />
      )}
    </div>
  );
}

function NewReminderCard({ onDone }: { onDone: () => void }) {
  const [content, setContent] = useState('');
  const [color, setColor] = useState<ReminderColor>('yellow');
  const createReminder = useCreateReminder();
  const colors = REMINDER_COLORS[color];

  const handleCreate = async () => {
    if (!content.trim()) return;
    try {
      await createReminder.mutateAsync({ content: content.trim(), color });
      toast.success('Lembrete criado!');
      onDone();
    } catch {
      toast.error('Erro ao criar lembrete');
    }
  };

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', colors.bg, colors.border)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escreva seu lembrete..."
        className="bg-transparent border-0 p-0 resize-none focus-visible:ring-0 text-sm min-h-[80px] placeholder:text-muted-foreground/50"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleCreate(); }}
      />
      <div className="flex items-center justify-between">
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDone} className="h-7 px-2">
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!content.trim() || createReminder.isPending}
            className="h-7 px-3 gap-1"
          >
            <Check className="h-3.5 w-3.5" /> Criar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const { data: reminders, isLoading } = useReminders();
  const { data: archived } = useArchivedReminders();
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StickyNote className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Lembretes</h1>
          {(reminders?.length ?? 0) > 0 && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
              {reminders!.length}
            </span>
          )}
        </div>
        <Button onClick={() => setCreating(true)} disabled={creating} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Lembrete
        </Button>
      </div>

      <p className="text-sm text-muted-foreground -mt-2">
        Clique para editar · Passe o mouse para arquivar ou excluir
      </p>

      {/* Active reminders */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creating && <NewReminderCard onDone={() => setCreating(false)} />}
          {(reminders || []).map((r) => (
            <ReminderCard key={r.id} reminder={r} />
          ))}
          {!creating && (reminders || []).length === 0 && (
            <div className="col-span-full text-center py-16 space-y-3">
              <StickyNote className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Nenhum lembrete ainda</p>
              <Button variant="outline" size="sm" onClick={() => setCreating(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Criar primeiro lembrete
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Archived section */}
      {(archived?.length ?? 0) > 0 && (
        <div className="border-t border-border/50 pt-4">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive className="h-4 w-4" />
            <span>Arquivados ({archived!.length})</span>
            {showArchived ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {archived!.map((r) => (
                <ReminderCard key={r.id} reminder={r} archived />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
