import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database } from '@/integrations/supabase/types';

type PDPRow = Database['public']['Tables']['personal_development_plans']['Row'];
type PDPInsert = Database['public']['Tables']['personal_development_plans']['Insert'];
type PDPUpdate = Database['public']['Tables']['personal_development_plans']['Update'];
type PDPItemRow = Database['public']['Tables']['pdp_items']['Row'];
type PDPItemInsert = Database['public']['Tables']['pdp_items']['Insert'];
type PDPItemUpdate = Database['public']['Tables']['pdp_items']['Update'];

export interface PDP extends PDPRow {
  person?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  items?: PDPItem[];
}

export interface PDPItem extends PDPItemRow {
  linked_goal?: {
    id: string;
    title_en: string;
    title_fr: string | null;
  } | null;
}

export interface PDPFilters {
  person_id?: string;
  status?: string;
}

// Fetch all PDPs with optional filters
export function useDevelopmentPlans(filters: PDPFilters = {}) {
  return useQuery({
    queryKey: ['development-plans', filters],
    queryFn: async (): Promise<PDP[]> => {
      let query = supabase
        .from('personal_development_plans')
        .select(`
          *,
          person:people(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.person_id) {
        query = query.eq('person_id', filters.person_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status as 'active' | 'completed' | 'on_hold');
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(pdp => ({
        ...pdp,
        person: Array.isArray(pdp.person) ? pdp.person[0] : pdp.person,
      }));
    },
  });
}

// Fetch a single PDP with items
export function useDevelopmentPlan(id: string | undefined) {
  return useQuery({
    queryKey: ['development-plan', id],
    queryFn: async (): Promise<PDP | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('personal_development_plans')
        .select(`
          *,
          person:people(id, first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch items separately
      const { data: items, error: itemsError } = await supabase
        .from('pdp_items')
        .select(`
          *,
          linked_goal:goals(id, title_en, title_fr)
        `)
        .eq('pdp_id', id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...data,
        person: Array.isArray(data.person) ? data.person[0] : data.person,
        items: (items || []).map(item => ({
          ...item,
          linked_goal: Array.isArray(item.linked_goal) ? item.linked_goal[0] : item.linked_goal,
        })),
      };
    },
    enabled: !!id,
  });
}

// Create PDP
export function useCreateDevelopmentPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (pdp: PDPInsert) => {
      const { data, error } = await supabase
        .from('personal_development_plans')
        .insert(pdp)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-plans'] });
      toast({
        title: t('common.success'),
        description: 'Development plan created successfully',
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

// Update PDP
export function useUpdateDevelopmentPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PDPUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('personal_development_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['development-plans'] });
      queryClient.invalidateQueries({ queryKey: ['development-plan', variables.id] });
      toast({
        title: t('common.success'),
        description: 'Development plan updated successfully',
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

// Delete PDP
export function useDeleteDevelopmentPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('personal_development_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-plans'] });
      toast({
        title: t('common.success'),
        description: 'Development plan deleted successfully',
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

// PDP Items mutations
export function useCreatePDPItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (item: PDPItemInsert) => {
      const { data, error } = await supabase
        .from('pdp_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['development-plan', variables.pdp_id] });
      toast({
        title: t('common.success'),
        description: 'Item added successfully',
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

export function useUpdatePDPItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, pdp_id, ...updates }: PDPItemUpdate & { id: string; pdp_id: string }) => {
      const { data, error } = await supabase
        .from('pdp_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, pdp_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['development-plan', data.pdp_id] });
      toast({
        title: t('common.success'),
        description: 'Item updated successfully',
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

export function useDeletePDPItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, pdp_id }: { id: string; pdp_id: string }) => {
      const { error } = await supabase
        .from('pdp_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { pdp_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['development-plan', data.pdp_id] });
      toast({
        title: t('common.success'),
        description: 'Item deleted successfully',
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
