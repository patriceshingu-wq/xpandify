import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type ReviewRow = Database['public']['Tables']['performance_reviews']['Row'];
type ReviewInsert = Database['public']['Tables']['performance_reviews']['Insert'];

export interface Review extends ReviewRow {
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
  reviewer?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
}

interface ReviewFilters {
  search?: string;
  finalized?: boolean;
  person_id?: string;
}

export function useReviews(filters: ReviewFilters = {}) {
  return useQuery({
    queryKey: ['reviews', filters],
    queryFn: async (): Promise<Review[]> => {
      let query = supabase
        .from('performance_reviews')
        .select(`
          *,
          person:people!performance_reviews_person_id_fkey(id, first_name, last_name, preferred_name),
          reviewer:people!performance_reviews_reviewer_id_fkey(id, first_name, last_name, preferred_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.finalized !== undefined) {
        query = query.eq('finalized', filters.finalized);
      }

      if (filters.person_id) {
        query = query.eq('person_id', filters.person_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Review[];
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (review: ReviewInsert) => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .insert(review)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({ title: 'Review created', description: 'The review has been created successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Review> & { id: string }) => {
      const { data, error } = await supabase
        .from('performance_reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({ title: 'Review updated', description: 'The review has been updated successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('performance_reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({ title: 'Review deleted', description: 'The review has been deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
