import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface Mentorship {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: string | null;
  focus_area: string | null;
  start_date: string | null;
  end_date: string | null;
  meeting_frequency: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  mentor?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    email: string | null;
  };
  mentee?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    email: string | null;
  };
}

export interface MentorshipCheckIn {
  id: string;
  mentorship_id: string;
  check_in_date: string;
  discussion_notes: string | null;
  prayer_points: string | null;
  next_steps: string | null;
  action_items: Json | null;
  mentee_mood: string | null;
  created_by_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export function useMyMentorships() {
  return useQuery({
    queryKey: ['my-mentorships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentorship')
        .select(`
          *,
          mentor:people!mentorship_mentor_id_fkey(id, first_name, last_name, preferred_name, email),
          mentee:people!mentorship_mentee_id_fkey(id, first_name, last_name, preferred_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Mentorship[];
    },
  });
}

export function useMentorshipCheckIns(mentorshipId: string | undefined) {
  return useQuery({
    queryKey: ['mentorship-check-ins', mentorshipId],
    queryFn: async () => {
      if (!mentorshipId) return [];
      const { data, error } = await supabase
        .from('mentorship_check_ins')
        .select(`
          *,
          created_by:people!mentorship_check_ins_created_by_id_fkey(id, first_name, last_name)
        `)
        .eq('mentorship_id', mentorshipId)
        .order('check_in_date', { ascending: false });

      if (error) throw error;
      return data as MentorshipCheckIn[];
    },
    enabled: !!mentorshipId,
  });
}

export function useCreateMentorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mentorship: Omit<Mentorship, 'id' | 'created_at' | 'updated_at' | 'mentor' | 'mentee'>) => {
      const { data, error } = await supabase
        .from('mentorship')
        .insert(mentorship)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentorships'] });
      toast.success('Mentorship created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create mentorship: ' + error.message);
    },
  });
}

export function useUpdateMentorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Mentorship> & { id: string }) => {
      const { data, error } = await supabase
        .from('mentorship')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentorships'] });
      toast.success('Mentorship updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update mentorship: ' + error.message);
    },
  });
}

export function useDeleteMentorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mentorship')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mentorships'] });
      toast.success('Mentorship deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete mentorship: ' + error.message);
    },
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkIn: {
      mentorship_id: string;
      check_in_date: string;
      discussion_notes?: string | null;
      prayer_points?: string | null;
      next_steps?: string | null;
      action_items?: Json | null;
      mentee_mood?: string | null;
      created_by_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('mentorship_check_ins')
        .insert(checkIn)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-check-ins', variables.mentorship_id] });
      toast.success('Check-in recorded');
    },
    onError: (error) => {
      toast.error('Failed to record check-in: ' + error.message);
    },
  });
}

export function useUpdateCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mentorshipId, ...updates }: {
      id: string;
      mentorshipId: string;
      discussion_notes?: string | null;
      prayer_points?: string | null;
      next_steps?: string | null;
      action_items?: Json | null;
      mentee_mood?: string | null;
      check_in_date?: string;
    }) => {
      const { data, error } = await supabase
        .from('mentorship_check_ins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-check-ins', variables.mentorshipId] });
      toast.success('Check-in updated');
    },
    onError: (error) => {
      toast.error('Failed to update check-in: ' + error.message);
    },
  });
}

export function useDeleteCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mentorshipId }: { id: string; mentorshipId: string }) => {
      const { error } = await supabase
        .from('mentorship_check_ins')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentorship-check-ins', variables.mentorshipId] });
      toast.success('Check-in deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete check-in: ' + error.message);
    },
  });
}
