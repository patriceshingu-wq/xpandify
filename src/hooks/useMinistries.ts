import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Ministry {
  id: string;
  name_en: string;
  name_fr?: string;
  description_en?: string;
  description_fr?: string;
  leader_id?: string;
  parent_ministry_id?: string;
  created_at: string;
  updated_at: string;
  leader?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export function useMinistries() {
  return useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select(`
          *,
          leader:people!fk_ministries_leader(id, first_name, last_name)
        `)
        .order('name_en', { ascending: true });

      if (error) throw error;
      return data as Ministry[];
    },
  });
}

export function useMinistry(id: string | undefined) {
  return useQuery({
    queryKey: ['ministry', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('ministries')
        .select(`
          *,
          leader:people!fk_ministries_leader(id, first_name, last_name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Ministry | null;
    },
    enabled: !!id,
  });
}

export function useCreateMinistry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (ministry: Omit<Ministry, 'id' | 'created_at' | 'updated_at' | 'leader'>) => {
      const { data, error } = await supabase
        .from('ministries')
        .insert(ministry)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      toast({
        title: t('common.success'),
        description: 'Ministry created successfully',
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

export function useUpdateMinistry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...ministry }: Partial<Ministry> & { id: string }) => {
      const { data, error } = await supabase
        .from('ministries')
        .update(ministry)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['ministry', variables.id] });
      toast({
        title: t('common.success'),
        description: 'Ministry updated successfully',
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

export function useDeleteMinistry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      toast({
        title: t('common.success'),
        description: 'Ministry deleted successfully',
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
