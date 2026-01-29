import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ActivityCategory {
  id: string;
  name_en: string;
  name_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export function useActivityCategories() {
  return useQuery({
    queryKey: ['activity-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_categories')
        .select('*')
        .order('name_en', { ascending: true });

      if (error) throw error;
      return data as ActivityCategory[];
    },
  });
}

export function useCreateActivityCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (category: Omit<ActivityCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('activity_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
      toast({ title: t('common.success'), description: 'Category created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateActivityCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<ActivityCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('activity_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
      toast({ title: t('common.success'), description: 'Category updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteActivityCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activity_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-categories'] });
      toast({ title: t('common.success'), description: 'Category deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
