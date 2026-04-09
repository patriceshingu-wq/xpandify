import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type RSVPStatus = 'attending' | 'declined' | 'maybe' | 'pending';

export interface EventRSVP {
  id: string;
  event_id: string;
  person_id: string;
  status: RSVPStatus;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  };
}

export function useEventRSVPs(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-rsvps', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          person:people!event_rsvps_person_id_fkey(id, first_name, last_name, preferred_name)
        `)
        .eq('event_id', eventId!)
        .order('responded_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EventRSVP[];
    },
    enabled: !!eventId,
  });
}

export function useMyEventRSVP(eventId: string | undefined) {
  const { person } = useAuth();
  return useQuery({
    queryKey: ['my-event-rsvp', eventId, person?.id],
    queryFn: async () => {
      if (!person?.id) return null;
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId!)
        .eq('person_id', person.id)
        .maybeSingle();
      if (error) throw error;
      return data as EventRSVP | null;
    },
    enabled: !!eventId && !!person?.id,
  });
}

export function useSubmitRSVP() {
  const queryClient = useQueryClient();
  const { person } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId, status, notes }: { eventId: string; status: RSVPStatus; notes?: string }) => {
      if (!person?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          person_id: person.id,
          status,
          notes: notes || null,
          responded_at: new Date().toISOString(),
        }, { onConflict: 'event_id,person_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-rsvps', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['my-event-rsvp', variables.eventId] });
      toast.success('RSVP submitted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
