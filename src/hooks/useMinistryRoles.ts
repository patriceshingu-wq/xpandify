import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface MinistryRole {
  id: string;
  name_en: string;
  name_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  category: 'pastoral' | 'worship' | 'children' | 'youth' | 'media' | 'admin' | 'other' | null;
  is_staff_role: boolean | null;
  is_volunteer_role: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useMinistryRoles() {
  return useQuery({
    queryKey: ['ministry-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministry_roles')
        .select('*')
        .order('name_en');

      if (error) throw error;
      return data as MinistryRole[];
    },
  });
}

export function useCreateMinistryRole() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (role: Omit<MinistryRole, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ministry_roles')
        .insert(role)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministry-roles'] });
      toast.success(t('common.success'));
    },
    onError: (error) => {
      console.error('[useMinistryRoles] Create error:', error);
      toast.error(t('common.error'));
    },
  });
}

export function useUpdateMinistryRole() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MinistryRole> & { id: string }) => {
      const { data, error } = await supabase
        .from('ministry_roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministry-roles'] });
      toast.success(t('common.success'));
    },
    onError: (error) => {
      console.error('[useMinistryRoles] Update error:', error);
      toast.error(t('common.error'));
    },
  });
}

export function useDeleteMinistryRole() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ministry_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministry-roles'] });
      toast.success(t('common.success'));
    },
    onError: (error) => {
      console.error('[useMinistryRoles] Delete error:', error);
      toast.error(t('common.error'));
    },
  });
}
