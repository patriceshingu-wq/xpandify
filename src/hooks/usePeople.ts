import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  campus?: {
    id: string;
    name: string;
    code: string | null;
  } | null;
}

export interface PersonFilters {
  search?: string;
  person_type?: string;
  status?: string;
  ministry_id?: string;
}

const PAGE_SIZE = 20;

export function usePeople(filters?: PersonFilters) {
  return useQuery({
    queryKey: ['people', filters],
    queryFn: async () => {
      // NOTE: We intentionally do NOT use a PostgREST embedded join for supervisor here.
      // The database does not currently expose a self-referencing FK relationship
      // that PostgREST can use (requests were returning 400 with schema cache errors).
      // Instead, we fetch people normally and resolve supervisor info client-side.
      // Campus relationship is fetched via PostgREST embedded join.
      let query = supabase
        .from('people')
        .select('*, campus:campuses(id, name, code)')
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

      const people = (data || []) as (PersonRow & { campus: { id: string; name: string; code: string | null } | null })[];
      const byId: Record<string, PersonRow> = {};
      for (const p of people) byId[p.id] = p;

      // Transform the data to match our Person interface, resolving supervisor locally.
      return people.map((item) => {
        const supervisorRow = item.supervisor_id ? byId[item.supervisor_id] : undefined;
        return {
          ...(item as any),
          supervisor: supervisorRow
            ? {
                id: supervisorRow.id,
                first_name: supervisorRow.first_name,
                last_name: supervisorRow.last_name,
              }
            : null,
          campus: item.campus || null,
        } as Person;
      });
    },
  });
}

export function usePeopleInfinite(filters?: PersonFilters) {
  return useInfiniteQuery({
    queryKey: ['people', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('people')
        .select('*, campus:campuses(id, name, code)', { count: 'exact' })
        .order('last_name', { ascending: true })
        .range(from, to);

      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.person_type && filters.person_type !== 'all') {
        query = query.eq('person_type', filters.person_type as PersonRow['person_type']);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as PersonRow['status']);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const people = (data || []) as (PersonRow & { campus: { id: string; name: string; code: string | null } | null })[];
      const byId: Record<string, PersonRow> = {};
      for (const p of people) byId[p.id] = p;

      const items = people.map((item) => {
        const supervisorRow = item.supervisor_id ? byId[item.supervisor_id] : undefined;
        return {
          ...(item as any),
          supervisor: supervisorRow
            ? {
                id: supervisorRow.id,
                first_name: supervisorRow.first_name,
                last_name: supervisorRow.last_name,
              }
            : null,
          campus: item.campus || null,
        } as Person;
      });

      return {
        items,
        nextPage: items.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count ?? 0,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('people')
        .select('*, campus:campuses(id, name, code)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      let supervisor: Person['supervisor'] = null;
      if (data.supervisor_id) {
        const { data: supervisorRow, error: supervisorError } = await supabase
          .from('people')
          .select('id, first_name, last_name')
          .eq('id', data.supervisor_id)
          .maybeSingle();

        if (supervisorError) throw supervisorError;
        if (supervisorRow) {
          supervisor = {
            id: supervisorRow.id,
            first_name: supervisorRow.first_name,
            last_name: supervisorRow.last_name,
          };
        }
      }

      return {
        ...(data as any),
        supervisor,
        campus: data.campus || null,
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
