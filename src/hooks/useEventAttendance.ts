import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EventAttendance {
  id: string;
  event_id: string;
  person_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
  notes: string | null;
  created_at: string;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  };
}

export function useEventAttendance(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-attendance', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_attendance')
        .select(`
          *,
          person:people!event_attendance_person_id_fkey(id, first_name, last_name, preferred_name)
        `)
        .eq('event_id', eventId!)
        .order('checked_in_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as EventAttendance[];
    },
    enabled: !!eventId,
  });
}

export function useCheckInPerson() {
  const queryClient = useQueryClient();
  const { person } = useAuth();

  return useMutation({
    mutationFn: async ({ eventId, personId, notes }: { eventId: string; personId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('event_attendance')
        .upsert({
          event_id: eventId,
          person_id: personId,
          checked_in_at: new Date().toISOString(),
          checked_in_by: person?.id || null,
          notes: notes || null,
        }, { onConflict: 'event_id,person_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendance', variables.eventId] });
      toast.success('Person checked in');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('event_attendance')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendance', variables.eventId] });
      toast.success('Check-in removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
