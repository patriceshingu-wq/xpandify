import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type FeedbackRow = Database['public']['Tables']['feedback']['Row'];
type FeedbackInsert = Database['public']['Tables']['feedback']['Insert'];

export interface Feedback extends FeedbackRow {
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
  given_by?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
}

interface FeedbackFilters {
  search?: string;
  feedback_type?: string;
  person_id?: string;
}

export function useFeedback(filters: FeedbackFilters = {}) {
  return useQuery({
    queryKey: ['feedback', filters],
    queryFn: async (): Promise<Feedback[]> => {
      let query = supabase
        .from('feedback')
        .select(`
          *,
          person:people!feedback_person_id_fkey(id, first_name, last_name, preferred_name),
          given_by:people!feedback_given_by_id_fkey(id, first_name, last_name, preferred_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.feedback_type && filters.feedback_type !== 'all') {
        query = query.eq('feedback_type', filters.feedback_type as Database['public']['Enums']['feedback_type']);
      }

      if (filters.person_id) {
        query = query.eq('person_id', filters.person_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Feedback[];
    },
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (feedback: FeedbackInsert) => {
      const { data, error } = await supabase
        .from('feedback')
        .insert(feedback)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast({ title: 'Feedback created', description: 'The feedback has been submitted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast({ title: 'Feedback deleted', description: 'The feedback has been deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
