import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export type ProgramLanguage = 'EN' | 'FR' | 'Bilingual';

export interface Program {
  id: string;
  code: string;
  name_en: string;
  name_fr: string | null;
  theme_en: string | null;
  theme_fr: string | null;
  primary_language: ProgramLanguage;
  description_en: string | null;
  description_fr: string | null;
  quarter_id: string | null;
  primary_ministry_id: string | null;
  created_at: string;
  updated_at: string;
  quarter?: {
    id: string;
    year: number;
    quarter_number: number;
    theme_en: string;
  } | null;
  ministry?: {
    id: string;
    name_en: string;
    name_fr: string | null;
  } | null;
}

interface ProgramFilters {
  quarter_id?: string;
  ministry_id?: string;
}

export function usePrograms(filters?: ProgramFilters) {
  return useQuery({
    queryKey: ['programs', filters],
    queryFn: async () => {
      let query = supabase
        .from('programs')
        .select(`
          *,
          quarter:quarters(id, year, quarter_number, theme_en),
          ministry:ministries!programs_primary_ministry_id_fkey(id, name_en, name_fr)
        `)
        .order('created_at', { ascending: false });

      if (filters?.quarter_id) {
        query = query.eq('quarter_id', filters.quarter_id);
      }
      if (filters?.ministry_id) {
        query = query.eq('primary_ministry_id', filters.ministry_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Program[];
    },
  });
}

export function useProgram(id: string | undefined) {
  return useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          quarter:quarters(id, year, quarter_number, theme_en),
          ministry:ministries!programs_primary_ministry_id_fkey(id, name_en, name_fr)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Program | null;
    },
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (program: Omit<Program, 'id' | 'created_at' | 'updated_at' | 'quarter' | 'ministry'>) => {
      const { data, error } = await supabase
        .from('programs')
        .insert(program)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast({ title: t('common.success'), description: 'Program created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...program }: Partial<Program> & { id: string }) => {
      const { quarter, ministry, ...updateData } = program as any;
      const { data, error } = await supabase
        .from('programs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program', variables.id] });
      toast({ title: t('common.success'), description: 'Program updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast({ title: t('common.success'), description: 'Program deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
