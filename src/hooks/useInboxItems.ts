import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';

export interface InboxItem {
  id: string;
  content: string;
  is_done: boolean;
  created_at: string;
}

export function useInboxItems() {
  return useQuery({
    queryKey: ['inbox_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbox_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as InboxItem[];
    },
  });
}

export function useCreateInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      const { data, error } = await supabase
        .from('inbox_items')
        .insert({ content, ...(userId ? { user_id: userId } : {}) })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox_items'] }),
  });
}

export function useToggleInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_done }: { id: string; is_done: boolean }) => {
      const { error } = await supabase
        .from('inbox_items')
        .update({ is_done })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox_items'] }),
  });
}

export function useDeleteInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inbox_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox_items'] }),
  });
}
