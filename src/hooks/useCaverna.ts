import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { externalSupabase } from '@/integrations/supabase/externalClient';
import { useAuth } from '@/contexts/AuthContext';
import type { ItemId, Papel, Pessoa } from '@/lib/caverna/plano';

// Tipos só das tabelas do Modo Caverna. Fica aqui para não mexer nos tipos gerados do app.
export type CavernaPerfil = {
  user_id: string;
  pessoa: Pessoa;
  dia_atual: number;
  papel: Papel;
  cargas: Record<string, string>;
  updated_at: string;
};

export type CavernaDia = {
  id: string;
  user_id: string;
  dia: number;
  itens: Partial<Record<ItemId, boolean>>;
  agua_ml: number;
  pontos: number;
  updated_at: string;
};

export type CavernaMedida = {
  id: string;
  user_id: string;
  dia: number;
  peso_kg: number | null;
  cintura_cm: number | null;
  flexoes: number | null;
  bike_min: number | null;
  updated_at: string;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

type CavernaDatabase = {
  __InternalSupabase: { PostgrestVersion: '14.5' };
  public: {
    Tables: {
      caverna_perfil: Table<CavernaPerfil>;
      caverna_dias: Table<CavernaDia>;
      caverna_medidas: Table<CavernaMedida>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// Mesmo cliente (e mesma sessão) do app, só com os tipos das tabelas novas.
const db = externalSupabase as unknown as SupabaseClient<CavernaDatabase>;

export function useCavernaPerfil() {
  const { user } = useAuth();
  return useQuery<CavernaPerfil | null>({
    queryKey: ['caverna-perfil', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from('caverna_perfil').select('*').maybeSingle();
      if (error) throw error;
      return (data as CavernaPerfil | null) ?? null;
    },
  });
}

export function useSalvarPerfil() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['caverna-perfil', user?.id];
  return useMutation({
    mutationFn: async (changes: Partial<Omit<CavernaPerfil, 'user_id' | 'updated_at'>>) => {
      if (!user) throw new Error('Not authenticated');
      const atual = qc.getQueryData<CavernaPerfil | null>(key);
      const row = { ...(atual ?? {}), ...changes, user_id: user.id, updated_at: new Date().toISOString() };
      const { error } = await db.from('caverna_perfil').upsert(row as CavernaPerfil, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onMutate: async (changes) => {
      await qc.cancelQueries({ queryKey: key });
      const anterior = qc.getQueryData<CavernaPerfil | null>(key);
      if (anterior) qc.setQueryData(key, { ...anterior, ...changes });
      return { anterior };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.anterior !== undefined) qc.setQueryData(key, ctx.anterior);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useCavernaDias() {
  const { user } = useAuth();
  return useQuery<CavernaDia[]>({
    queryKey: ['caverna-dias', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from('caverna_dias').select('*').order('dia', { ascending: true });
      if (error) throw error;
      return (data as CavernaDia[]) ?? [];
    },
  });
}

export function useSalvarDia() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['caverna-dias', user?.id];
  return useMutation({
    mutationFn: async (dia: Pick<CavernaDia, 'dia' | 'itens' | 'agua_ml' | 'pontos'>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('caverna_dias')
        .upsert({ ...dia, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id,dia' });
      if (error) throw error;
    },
    onMutate: async (novo) => {
      await qc.cancelQueries({ queryKey: key });
      const anterior = qc.getQueryData<CavernaDia[]>(key) ?? [];
      const existe = anterior.some((d) => d.dia === novo.dia);
      const proximo = existe
        ? anterior.map((d) => (d.dia === novo.dia ? { ...d, ...novo } : d))
        : [...anterior, { id: `tmp-${novo.dia}`, user_id: user?.id ?? '', updated_at: '', ...novo }].sort((a, b) => a.dia - b.dia);
      qc.setQueryData(key, proximo);
      return { anterior };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.anterior);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useCavernaMedidas() {
  const { user } = useAuth();
  return useQuery<CavernaMedida[]>({
    queryKey: ['caverna-medidas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from('caverna_medidas').select('*').order('dia', { ascending: true });
      if (error) throw error;
      return (data as CavernaMedida[]) ?? [];
    },
  });
}

export function useSalvarMedida() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Pick<CavernaMedida, 'dia' | 'peso_kg' | 'cintura_cm' | 'flexoes' | 'bike_min'>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('caverna_medidas')
        .upsert({ ...m, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id,dia' });
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['caverna-medidas', user?.id] }),
  });
}
