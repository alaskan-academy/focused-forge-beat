import { useState, useRef, useEffect } from 'react';
import { Trash2, Inbox, Plus, ChevronDown, ChevronUp, ListPlus } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInboxItems, useCreateInboxItem, useToggleInboxItem, useDeleteInboxItem, InboxItem } from '@/hooks/useInboxItems';
import { useTaskModal } from '@/hooks/useTaskModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

const iconButton = 'p-1.5 rounded text-muted-foreground transition-opacity md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100';

export default function InboxPage() {
  const { data: items, isLoading } = useInboxItems();
  const createItem = useCreateInboxItem();
  const toggleItem = useToggleInboxItem();
  const deleteItem = useDeleteInboxItem();
  const { openNew, modal } = useTaskModal();
  const [input, setInput] = useState('');
  const [showDone, setShowDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const pending = (items || []).filter((i) => !i.is_done);
  const done = (items || []).filter((i) => i.is_done);

  const handleAdd = async () => {
    const content = input.trim();
    if (!content) return;
    setInput('');
    try {
      await createItem.mutateAsync(content);
    } catch {
      setInput(content);
      toast.error('Erro ao adicionar item');
    }
  };

  const handleToggle = async (id: string, is_done: boolean) => {
    try {
      await toggleItem.mutateAsync({ id, is_done });
    } catch {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDelete = async (item: InboxItem) => {
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success('Item excluído', {
        description: item.content,
        action: {
          label: 'Desfazer',
          onClick: () => createItem.mutateAsync(item.content)
            .then((created) => (item.is_done && created ? toggleItem.mutateAsync({ id: created.id, is_done: true }) : undefined))
            .catch(() => toast.error('Erro ao desfazer')),
        },
      });
    } catch {
      toast.error('Erro ao excluir item');
    }
  };

  /** Opens a new task prefilled with the item; the item is checked off once the task is created. */
  const convertToTask = (item: InboxItem) => {
    openNew({ name: item.content }, () => {
      toggleItem.mutate({ id: item.id, is_done: true });
    });
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Inbox className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        {pending.length > 0 && (
          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
            {pending.length}
          </span>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Capturar ideia ou lembrança... (Enter para adicionar)"
          aria-label="Novo item do inbox"
          enterKeyHint="send"
          className="flex-1 min-w-0 bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <Button
          type="submit"
          disabled={!input.trim() || createItem.isPending}
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Adicionar"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : (
        <>
          {pending.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Inbox vazio — tudo capturado!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {pending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/20 group transition-all"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleToggle(item.id, true)}
                    className="mt-0.5 h-5 w-5 rounded-full border-2 shrink-0"
                    aria-label={`Concluir ${item.content}`}
                  />
                  <span className="flex-1 min-w-0 text-sm text-foreground leading-relaxed break-words">{item.content}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block mr-1">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    <button
                      onClick={() => convertToTask(item)}
                      className={`${iconButton} hover:text-primary`}
                      title="Transformar em tarefa"
                      aria-label={`Transformar “${item.content}” em tarefa`}
                    >
                      <ListPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className={`${iconButton} hover:text-destructive`}
                      title="Excluir"
                      aria-label={`Excluir “${item.content}”`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div className="space-y-1">
              <button
                onClick={() => setShowDone((s) => !s)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                aria-expanded={showDone}
              >
                {showDone ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Concluídos ({done.length})
              </button>
              {showDone && (
                <div className="space-y-1">
                  {done.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 group transition-all"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleToggle(item.id, false)}
                        className="mt-0.5 h-5 w-5 rounded-full shrink-0 data-[state=checked]:bg-status-done data-[state=checked]:border-status-done"
                        aria-label={`Reabrir ${item.content}`}
                      />
                      <span className="flex-1 min-w-0 text-sm text-muted-foreground line-through leading-relaxed break-words">{item.content}</span>
                      <button
                        onClick={() => handleDelete(item)}
                        className={`${iconButton} hover:text-destructive shrink-0`}
                        title="Excluir"
                        aria-label={`Excluir “${item.content}”`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modal}
    </div>
  );
}
