import { useState, useRef, useEffect } from 'react';
import { useInboxItems, useCreateInboxItem, useToggleInboxItem, useDeleteInboxItem } from '@/hooks/useInboxItems';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2, Inbox, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InboxPage() {
  const { data: items, isLoading } = useInboxItems();
  const createItem = useCreateInboxItem();
  const toggleItem = useToggleInboxItem();
  const deleteItem = useDeleteInboxItem();
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
      toast.error('Erro ao adicionar item');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleToggle = async (id: string, is_done: boolean) => {
    try {
      await toggleItem.mutateAsync({ id, is_done });
    } catch {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
    } catch {
      toast.error('Erro ao excluir item');
    }
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

      {/* Quick capture input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capturar ideia ou lembrança... (Enter para adicionar)"
          className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        />
        <Button
          onClick={handleAdd}
          disabled={!input.trim() || createItem.isPending}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : (
        <>
          {/* Pending items */}
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
                  />
                  <span className="flex-1 text-sm text-foreground leading-relaxed">{item.content}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive text-muted-foreground rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Done items (collapsible) */}
          {done.length > 0 && (
            <div className="space-y-1">
              <button
                onClick={() => setShowDone((s) => !s)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
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
                      />
                      <span className="flex-1 text-sm text-muted-foreground line-through leading-relaxed">{item.content}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive text-muted-foreground rounded shrink-0"
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
    </div>
  );
}
