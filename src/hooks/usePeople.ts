import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';

type PersonRow = Database['public']['Tables']['people']['Row'];
type PersonInsert = Database['public']['Tables']['people']['Insert'];
type PersonUpdate = Database['public']['Tables']['people']['Update'];

export interface Person extends Omit<PersonRow, 'supervisor_id'> {
  supervisor_id?: string | null;
  supervisor?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface PersonFilters {
  search?: string;
  person_type?: string;
  status?: string;
  ministry_id?: string;
}

export function usePeople(filters?: PersonFilters) {
  return useQuery({
    queryKey: ['people', filters],
    queryFn: async () => {
      let query = supabase
        .from('people')
        .select(`
          *,
          supervisor:people!people_supervisor_id_fkey(id, first_name, last_name)
        `)
        .order('last_name', { ascending: true });

      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.person_type && filters.person_type !== 'all') {
        query = query.eq('person_type', filters.person_type as PersonRow['person_type']);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as PersonRow['status']);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our Person interface
      return (data || []).map(item => ({
        ...item,
        supervisor: Array.isArray(item.supervisor) ? item.supervisor[0] || null : item.supervisor
      })) as Person[];
    },
  });
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('people')
        .select(`
          *,
          supervisor:people!people_supervisor_id_fkey(id, first_name, last_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        supervisor: Array.isArray(data.supervisor) ? data.supervisor[0] || null : data.supervisor
      } as Person;
    },
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (person: PersonInsert) => {
      const { data, error } = await supabase
        .from('people')
        .insert(person)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast({
        title: t('common.success'),
        description: 'Person created successfully',
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

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...person }: PersonUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('people')
        .update(person)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['person', variables.id] });
      toast({
        title: t('common.success'),
        description: 'Person updated successfully',
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

export function useDeletePerson() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast({
        title: t('common.success'),
        description: 'Person deleted successfully',
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
