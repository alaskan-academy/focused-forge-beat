import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks_with_time'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks_with_time')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      name: string;
      area: string;
      project_id?: string | null;
      status?: string;
      priority?: string;
      due_date?: string | null;
      estimated_minutes?: number;
      recurrence?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.from('tasks').insert(task).select().single();
      if (error) throw error;

      // Create recurring tasks
      if (task.recurrence && task.recurrence !== 'none' && task.due_date) {
        const recurring: typeof task[] = [];
        let currentDate = new Date(task.due_date);
        for (let i = 0; i < 30; i++) {
          if (task.recurrence === 'daily') currentDate = addDays(currentDate, 1);
          else if (task.recurrence === 'weekly') currentDate = addWeeks(currentDate, 1);
          else if (task.recurrence === 'monthly') currentDate = addMonths(currentDate, 1);
          
          const diff = currentDate.getTime() - new Date().getTime();
          if (diff > 30 * 24 * 60 * 60 * 1000) break;

          recurring.push({
            ...task,
            due_date: format(currentDate, 'yyyy-MM-dd'),
          });
        }
        if (recurring.length > 0) {
          await supabase.from('tasks').insert(recurring);
        }
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks_with_time'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks_with_time'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks_with_time'] }),
  });
}
