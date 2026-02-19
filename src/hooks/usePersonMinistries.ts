import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface PersonMinistryMembership {
  id: string;
  person_id: string;
  ministry_id: string;
  created_at: string;
  ministry: {
    id: string;
    name_en: string;
    name_fr: string | null;
  };
}

export function usePersonMinistries(personId: string | undefined) {
  return useQuery({
    queryKey: ['person-ministries', personId],
    queryFn: async () => {
      if (!personId) return [];

      const { data, error } = await supabase
        .from('people_ministries')
        .select(`
          id,
          person_id,
          ministry_id,
          created_at,
          ministry:ministries!ministry_id(id, name_en, name_fr)
        `)
        .eq('person_id', personId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as PersonMinistryMembership[];
    },
    enabled: !!personId,
  });
}

/**
 * Sync a person's ministry memberships to match the provided list of ministry IDs.
 * Adds new memberships and removes ones not in the list.
 */
export function useSyncPersonMinistries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ personId, ministryIds }: { personId: string; ministryIds: string[] }) => {
      // Get current memberships
      const { data: current, error: fetchError } = await supabase
        .from('people_ministries')
        .select('id, ministry_id')
        .eq('person_id', personId);

      if (fetchError) throw fetchError;

      const currentIds = new Set((current || []).map(m => m.ministry_id));
      const targetIds = new Set(ministryIds);

      // Determine what to add and remove
      const toAdd = ministryIds.filter(id => !currentIds.has(id));
      const toRemove = (current || []).filter(m => !targetIds.has(m.ministry_id));

      // Remove memberships
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('people_ministries')
          .delete()
          .in('id', toRemove.map(m => m.id));

        if (deleteError) throw deleteError;
      }

      // Add memberships
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('people_ministries')
          .insert(toAdd.map(ministry_id => ({ person_id: personId, ministry_id })));

        if (insertError) throw insertError;
      }

      return { added: toAdd.length, removed: toRemove.length };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-ministries', variables.personId] });
      // Also invalidate ministry-members queries for affected ministries
      queryClient.invalidateQueries({ queryKey: ['ministry-members'] });

      if (result.added > 0 || result.removed > 0) {
        toast({
          title: t('common.success'),
          description: t('people.ministriesUpdated'),
        });
      }
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
