import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Quarter {
  id: string;
  year: number;
  quarter_number: number;
  theme_en: string;
  theme_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export function useQuarters() {
  return useQuery({
    queryKey: ['quarters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quarters')
        .select('*')
        .order('year', { ascending: false })
        .order('quarter_number', { ascending: false });

      if (error) throw error;
      return data as Quarter[];
    },
  });
}

export function useQuarter(id: string | undefined) {
  return useQuery({
    queryKey: ['quarter', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('quarters')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Quarter | null;
    },
    enabled: !!id,
  });
}

export function useCreateQuarter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (quarter: Omit<Quarter, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('quarters')
        .insert(quarter)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quarters'] });
      toast({ title: t('common.success'), description: 'Quarter created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateQuarter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...quarter }: Partial<Quarter> & { id: string }) => {
      const { data, error } = await supabase
        .from('quarters')
        .update(quarter)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quarters'] });
      queryClient.invalidateQueries({ queryKey: ['quarter', variables.id] });
      toast({ title: t('common.success'), description: 'Quarter updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteQuarter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quarters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quarters'] });
      toast({ title: t('common.success'), description: 'Quarter deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
