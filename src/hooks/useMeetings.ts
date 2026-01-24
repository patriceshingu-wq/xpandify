import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';

type MeetingRow = Database['public']['Tables']['meetings']['Row'];
type MeetingInsert = Database['public']['Tables']['meetings']['Insert'];
type MeetingUpdate = Database['public']['Tables']['meetings']['Update'];
type AgendaItemRow = Database['public']['Tables']['meeting_agenda_items']['Row'];
type AgendaItemInsert = Database['public']['Tables']['meeting_agenda_items']['Insert'];
type AgendaItemUpdate = Database['public']['Tables']['meeting_agenda_items']['Update'];

export interface Meeting extends MeetingRow {
  organizer?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  ministry?: {
    id: string;
    name_en: string;
    name_fr?: string | null;
  } | null;
}

export interface MeetingAgendaItem extends AgendaItemRow {
  action_owner?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface MeetingFilters {
  meeting_type?: string;
  organizer_id?: string;
  ministry_id?: string;
  upcoming?: boolean;
}

export function useMeetings(filters?: MeetingFilters) {
  return useQuery({
    queryKey: ['meetings', filters],
    queryFn: async () => {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          organizer:people!meetings_organizer_id_fkey(id, first_name, last_name),
          ministry:ministries!meetings_ministry_id_fkey(id, name_en, name_fr)
        `)
        .order('date_time', { ascending: true });

      if (filters?.meeting_type && filters.meeting_type !== 'all') {
        query = query.eq('meeting_type', filters.meeting_type as MeetingRow['meeting_type']);
      }

      if (filters?.organizer_id) {
        query = query.eq('organizer_id', filters.organizer_id);
      }

      if (filters?.ministry_id) {
        query = query.eq('ministry_id', filters.ministry_id);
      }

      if (filters?.upcoming) {
        query = query.gte('date_time', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        organizer: Array.isArray(item.organizer) ? item.organizer[0] || null : item.organizer,
        ministry: Array.isArray(item.ministry) ? item.ministry[0] || null : item.ministry
      })) as Meeting[];
    },
  });
}

export function useMeeting(id: string | undefined) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          organizer:people!meetings_organizer_id_fkey(id, first_name, last_name),
          ministry:ministries!meetings_ministry_id_fkey(id, name_en, name_fr)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        organizer: Array.isArray(data.organizer) ? data.organizer[0] || null : data.organizer,
        ministry: Array.isArray(data.ministry) ? data.ministry[0] || null : data.ministry
      } as Meeting;
    },
    enabled: !!id,
  });
}

export function useMeetingAgendaItems(meetingId: string | undefined) {
  return useQuery({
    queryKey: ['meeting-agenda', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from('meeting_agenda_items')
        .select(`
          *,
          action_owner:people!meeting_agenda_items_action_owner_id_fkey(id, first_name, last_name)
        `)
        .eq('meeting_id', meetingId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        action_owner: Array.isArray(item.action_owner) ? item.action_owner[0] || null : item.action_owner
      })) as MeetingAgendaItem[];
    },
    enabled: !!meetingId,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (meeting: MeetingInsert) => {
      const { data, error } = await supabase
        .from('meetings')
        .insert(meeting)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast({
        title: t('common.success'),
        description: 'Meeting created successfully',
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

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...meeting }: MeetingUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('meetings')
        .update(meeting)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.id] });
      toast({
        title: t('common.success'),
        description: 'Meeting updated successfully',
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

export function useCreateAgendaItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (item: AgendaItemInsert) => {
      const { data, error } = await supabase
        .from('meeting_agenda_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-agenda', data.meeting_id] });
      toast({
        title: t('common.success'),
        description: 'Agenda item added',
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

export function useUpdateAgendaItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, meeting_id, ...item }: AgendaItemUpdate & { id: string; meeting_id: string }) => {
      const { data, error } = await supabase
        .from('meeting_agenda_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, meeting_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-agenda', data.meeting_id] });
      toast({
        title: t('common.success'),
        description: 'Agenda item updated',
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
