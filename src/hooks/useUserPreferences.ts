import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/contexts/AuthContext';

export interface UserPreferences {
  tasks_sort_key?: string; // e.g. 'created_desc' | 'priority_asc' | 'due_date_asc' | 'name_asc'
  [key: string]: unknown;
}

export function useUserPreferences() {
  const { user } = useAuth();
  return useQuery<UserPreferences>({
    queryKey: ['user_preferences', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.preferences ?? {}) as UserPreferences;
    },
  });
}

export function useUpdateUserPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      if (!user) return;
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: user.id, preferences, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onMutate: async (preferences) => {
      // Optimistic update so UI responds instantly
      await qc.cancelQueries({ queryKey: ['user_preferences', user?.id] });
      qc.setQueryData(['user_preferences', user?.id], preferences);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['user_preferences'] }),
  });
}
