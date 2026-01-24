import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];

export interface Goal extends GoalRow {
  owner_person?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  owner_ministry?: {
    id: string;
    name_en: string;
    name_fr?: string | null;
  } | null;
}

export interface GoalFilters {
  year?: number;
  goal_level?: string;
  status?: string;
  category?: string;
  owner_person_id?: string;
  owner_ministry_id?: string;
}

export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: ['goals', filters],
    queryFn: async () => {
      let query = supabase
        .from('goals')
        .select(`
          *,
          owner_person:people!goals_owner_person_id_fkey(id, first_name, last_name),
          owner_ministry:ministries!goals_owner_ministry_id_fkey(id, name_en, name_fr)
        `)
        .order('created_at', { ascending: false });

      if (filters?.year) {
        query = query.eq('year', filters.year);
      }

      if (filters?.goal_level && filters.goal_level !== 'all') {
        query = query.eq('goal_level', filters.goal_level as GoalRow['goal_level']);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as GoalRow['status']);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category as GoalRow['category']);
      }

      if (filters?.owner_person_id) {
        query = query.eq('owner_person_id', filters.owner_person_id);
      }

      if (filters?.owner_ministry_id) {
        query = query.eq('owner_ministry_id', filters.owner_ministry_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        owner_person: Array.isArray(item.owner_person) ? item.owner_person[0] || null : item.owner_person,
        owner_ministry: Array.isArray(item.owner_ministry) ? item.owner_ministry[0] || null : item.owner_ministry
      })) as Goal[];
    },
  });
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          owner_person:people!goals_owner_person_id_fkey(id, first_name, last_name),
          owner_ministry:ministries!goals_owner_ministry_id_fkey(id, name_en, name_fr)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        owner_person: Array.isArray(data.owner_person) ? data.owner_person[0] || null : data.owner_person,
        owner_ministry: Array.isArray(data.owner_ministry) ? data.owner_ministry[0] || null : data.owner_ministry
      } as Goal;
    },
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (goal: GoalInsert) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: t('common.success'),
        description: 'Goal created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...goal }: GoalUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(goal)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', variables.id] });
      toast({
        title: t('common.success'),
        description: 'Goal updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast({
        title: t('common.success'),
        description: 'Goal deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
