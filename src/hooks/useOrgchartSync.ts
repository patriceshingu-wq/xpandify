import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// Counts of unlinked rows used by the UnlinkedBanner.
export function useUnlinkedCounts() {
  return useQuery({
    queryKey: ['orgchart-sync', 'unlinked-counts'],
    queryFn: async () => {
      const [ministries, people] = await Promise.all([
        supabase
          .from('ministries')
          .select('id', { count: 'exact', head: true })
          .is('orgchart_id', null)
          .is('deleted_at', null),
        supabase
          .from('people')
          .select('id', { count: 'exact', head: true })
          .is('orgchart_id', null)
          .is('deleted_at', null),
      ]);

      if (ministries.error) throw ministries.error;
      if (people.error) throw people.error;

      return {
        ministries: ministries.count ?? 0,
        people: people.count ?? 0,
      };
    },
  });
}

export interface UnlinkedMinistry {
  id: string;
  name_en: string;
  name_fr: string | null;
}

export function useUnlinkedMinistries() {
  return useQuery({
    queryKey: ['orgchart-sync', 'unlinked-ministries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, name_en, name_fr')
        .is('orgchart_id', null)
        .is('deleted_at', null)
        .order('name_en', { ascending: true });

      if (error) throw error;
      return (data ?? []) as UnlinkedMinistry[];
    },
  });
}

export interface UnlinkedPerson {
  id: string;
  first_name: string;
  last_name: string;
}

const PEOPLE_PAGE_SIZE = 25;

export function useUnlinkedPeople(page: number, search: string) {
  return useQuery({
    queryKey: ['orgchart-sync', 'unlinked-people', page, search],
    queryFn: async () => {
      const from = page * PEOPLE_PAGE_SIZE;
      const to = from + PEOPLE_PAGE_SIZE - 1;

      let query = supabase
        .from('people')
        .select('id, first_name, last_name', { count: 'exact' })
        .is('orgchart_id', null)
        .is('deleted_at', null)
        .order('last_name', { ascending: true })
        .range(from, to);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        items: (data ?? []) as UnlinkedPerson[],
        totalCount: count ?? 0,
        pageSize: PEOPLE_PAGE_SIZE,
      };
    },
  });
}

// Batch write orgchart_id values. Each entry: { id, orgchart_id }.
export function useApplyMinistryBackfill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (assignments: { id: string; orgchart_id: string }[]) => {
      // Sequential to surface unique-constraint violations row-by-row.
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const a of assignments) {
        const { error } = await supabase
          .from('ministries')
          .update({ orgchart_id: a.orgchart_id })
          .eq('id', a.id);
        if (error) {
          results.push({ id: a.id, ok: false, error: error.message });
        } else {
          results.push({ id: a.id, ok: true });
        }
      }
      const failures = results.filter((r) => !r.ok);
      if (failures.length > 0) {
        throw new Error(
          `${failures.length} of ${results.length} ministries could not be linked. First error: ${failures[0].error}`,
        );
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['orgchart-sync'] });
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      toast({
        title: t('common.success'),
        description: `${results.length} ministries linked.`,
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

export function useApplyPeopleBackfill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (assignments: { id: string; orgchart_id: string }[]) => {
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const a of assignments) {
        const { error } = await supabase
          .from('people')
          .update({ orgchart_id: a.orgchart_id })
          .eq('id', a.id);
        if (error) {
          results.push({ id: a.id, ok: false, error: error.message });
        } else {
          results.push({ id: a.id, ok: true });
        }
      }
      const failures = results.filter((r) => !r.ok);
      if (failures.length > 0) {
        throw new Error(
          `${failures.length} of ${results.length} people could not be linked. First error: ${failures[0].error}`,
        );
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['orgchart-sync'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast({
        title: t('common.success'),
        description: `${results.length} people linked.`,
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
