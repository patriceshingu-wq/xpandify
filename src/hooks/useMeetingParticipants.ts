import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  person_id: string;
  created_at: string | null;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
}

export function useMeetingParticipants(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-participants', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from('meeting_participants')
        .select(`
          *,
          person:people!meeting_participants_person_id_fkey(id, first_name, last_name, preferred_name)
        `)
        .eq('meeting_id', meetingId);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        person: Array.isArray(item.person) ? item.person[0] || null : item.person
      })) as MeetingParticipant[];
    },
    enabled: !!meetingId,
  });
}

export function useAddMeetingParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ meeting_id, person_id }: { meeting_id: string; person_id: string }) => {
      const { data, error } = await supabase
        .from('meeting_participants')
        .insert({ meeting_id, person_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-participants', data.meeting_id] });
      toast({
        title: t('common.success'),
        description: 'Participant added',
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

export function useRemoveMeetingParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, meeting_id }: { id: string; meeting_id: string }) => {
      const { error } = await supabase
        .from('meeting_participants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, meeting_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-participants', data.meeting_id] });
      toast({
        title: t('common.success'),
        description: 'Participant removed',
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

export function useBulkAddMeetingParticipants() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ meeting_id, person_ids }: { meeting_id: string; person_ids: string[] }) => {
      const participants = person_ids.map(person_id => ({ meeting_id, person_id }));
      
      const { data, error } = await supabase
        .from('meeting_participants')
        .insert(participants)
        .select();

      if (error) throw error;
      return { meeting_id, data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-participants', result.meeting_id] });
      toast({
        title: t('common.success'),
        description: `${result.data?.length || 0} participants added`,
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
