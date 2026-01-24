import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type SurveyRow = Database['public']['Tables']['pulse_surveys']['Row'];
type SurveyInsert = Database['public']['Tables']['pulse_surveys']['Insert'];
type ResponseRow = Database['public']['Tables']['pulse_responses']['Row'];

export interface Survey extends SurveyRow {
  response_count?: number;
}

export interface SurveyResponse extends ResponseRow {
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
}

interface SurveyFilters {
  search?: string;
  is_active?: boolean;
  target_group?: string;
}

export function useSurveys(filters: SurveyFilters = {}) {
  return useQuery({
    queryKey: ['surveys', filters],
    queryFn: async (): Promise<Survey[]> => {
      let query = supabase
        .from('pulse_surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.target_group && filters.target_group !== 'all') {
        query = query.eq('target_group', filters.target_group as Database['public']['Enums']['pulse_target']);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get response counts
      const { data: responses } = await supabase
        .from('pulse_responses')
        .select('pulse_survey_id');

      const responseCounts: Record<string, number> = {};
      responses?.forEach((r) => {
        responseCounts[r.pulse_survey_id] = (responseCounts[r.pulse_survey_id] || 0) + 1;
      });

      return (data || []).map((survey) => ({
        ...survey,
        response_count: responseCounts[survey.id] || 0,
      }));
    },
  });
}

export function useSurveyResponses(surveyId: string) {
  return useQuery({
    queryKey: ['survey-responses', surveyId],
    queryFn: async (): Promise<SurveyResponse[]> => {
      const { data, error } = await supabase
        .from('pulse_responses')
        .select(`
          *,
          person:people!pulse_responses_person_id_fkey(id, first_name, last_name, preferred_name)
        `)
        .eq('pulse_survey_id', surveyId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SurveyResponse[];
    },
    enabled: !!surveyId,
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (survey: SurveyInsert) => {
      const { data, error } = await supabase
        .from('pulse_surveys')
        .insert(survey)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast({ title: 'Survey created', description: 'The survey has been created successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Survey> & { id: string }) => {
      const { data, error } = await supabase
        .from('pulse_surveys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast({ title: 'Survey updated', description: 'The survey has been updated successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pulse_surveys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast({ title: 'Survey deleted', description: 'The survey has been deleted successfully.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
