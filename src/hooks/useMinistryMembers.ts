import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface MinistryMember {
  id: string;
  person_id: string;
  ministry_id: string;
  created_at: string;
  person: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    email: string | null;
    person_type: string | null;
  };
}

export function useMinistryMembers(ministryId: string | undefined) {
  return useQuery({
    queryKey: ['ministry-members', ministryId],
    queryFn: async () => {
      if (!ministryId) return [];

      const { data, error } = await supabase
        .from('people_ministries')
        .select(`
          id,
          person_id,
          ministry_id,
          created_at,
          person:people!person_id(id, first_name, last_name, preferred_name, email, person_type)
        `)
        .eq('ministry_id', ministryId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as MinistryMember[];
    },
    enabled: !!ministryId,
  });
}

export function useAddMinistryMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ personId, ministryId }: { personId: string; ministryId: string }) => {
      const { data, error } = await supabase
        .from('people_ministries')
        .insert({ person_id: personId, ministry_id: ministryId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ministry-members', variables.ministryId] });
      toast({
        title: t('common.success'),
        description: 'Member added to ministry',
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

export function useRemoveMinistryMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ministryId }: { id: string; ministryId: string }) => {
      const { error } = await supabase
        .from('people_ministries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ministry-members', variables.ministryId] });
      toast({
        title: t('common.success'),
        description: 'Member removed from ministry',
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
