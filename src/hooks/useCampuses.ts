import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Campus {
  id: string;
  name: string;
  code: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  is_main_campus: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CampusInsert = Omit<Campus, 'id' | 'created_at' | 'updated_at'>;
export type CampusUpdate = Partial<CampusInsert> & { id: string };

export function useCampuses() {
  return useQuery({
    queryKey: ['campuses'],
    queryFn: async (): Promise<Campus[]> => {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .order('is_main_campus', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Campus[];
    },
  });
}

export function useCreateCampus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campus: CampusInsert) => {
      const { data, error } = await supabase
        .from('campuses')
        .insert(campus)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campuses'] });
      toast({
        title: 'Campus created',
        description: 'Campus has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCampus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campus: CampusUpdate) => {
      const { id, ...updates } = campus;
      const { data, error } = await supabase
        .from('campuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campuses'] });
      toast({
        title: 'Campus updated',
        description: 'Campus has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCampus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campuses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campuses'] });
      toast({
        title: 'Campus deleted',
        description: 'Campus has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
