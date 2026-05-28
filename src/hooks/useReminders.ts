import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/contexts/AuthContext';
import { ReminderColor } from '@/lib/reminderColors';

export interface Reminder {
  id: string;
  user_id: string;
  content: string;
  color: ReminderColor;
  position: number;
  archived: boolean;
  created_at: string;
}

export function useReminders() {
  const { user } = useAuth();
  return useQuery<Reminder[]>({
    queryKey: ['reminders', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('archived', false)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Reminder[];
    },
  });
}

export function useCreateReminder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reminder: { content: string; color: ReminderColor }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase
        .from('reminders')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();
      const position = ((existing as any)?.position ?? -1) + 1;
      const { data, error } = await supabase
        .from('reminders')
        .insert({ ...reminder, user_id: user.id, position })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; content?: string; color?: ReminderColor }) => {
      const { error } = await supabase.from('reminders').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });
}

export function useArchiveReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').update({ archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  });
}
