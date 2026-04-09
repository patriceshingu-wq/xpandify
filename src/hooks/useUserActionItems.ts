import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AgendaSectionType } from './useMeetingTemplates';

export interface ActionItem {
  id: string;
  meeting_id: string;
  topic_en: string;
  topic_fr: string | null;
  section_type: AgendaSectionType | null;
  action_due_date: string | null;
  action_status: string | null;
  action_owner_id: string | null;
  discussion_notes: string | null;
  linked_goal_id: string | null;
  linked_pdp_item_id: string | null;
  meeting?: {
    id: string;
    title_en: string;
    title_fr: string | null;
    date_time: string;
  } | null;
}

export function useUserActionItems(status?: 'open' | 'in_progress' | 'done' | 'cancelled' | 'all') {
  const { person } = useAuth();

  return useQuery({
    queryKey: ['user-action-items', person?.id, status],
    queryFn: async () => {
      if (!person?.id) return [];

      let query = supabase
        .from('meeting_agenda_items')
        .select(`
          *,
          meeting:meetings!meeting_agenda_items_meeting_id_fkey(id, title_en, title_fr, date_time)
        `)
        .eq('action_owner_id', person.id)
        .eq('action_required', true)
        .order('action_due_date', { ascending: true, nullsFirst: false });

      if (status && status !== 'all') {
        query = query.eq('action_status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        meeting: Array.isArray(item.meeting) ? item.meeting[0] || null : item.meeting
      })) as ActionItem[];
    },
    enabled: !!person?.id,
  });
}

export function useOpenActionItemsCount() {
  const { person } = useAuth();

  return useQuery({
    queryKey: ['open-action-items-count', person?.id],
    queryFn: async () => {
      if (!person?.id) return 0;

      const { count, error } = await supabase
        .from('meeting_agenda_items')
        .select('*', { count: 'exact', head: true })
        .eq('action_owner_id', person.id)
        .eq('action_required', true)
        .in('action_status', ['open', 'in_progress']);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!person?.id,
  });
}

export function useOverdueActionItemsCount() {
  const { person } = useAuth();

  return useQuery({
    queryKey: ['overdue-action-items-count', person?.id],
    queryFn: async () => {
      if (!person?.id) return 0;

      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('meeting_agenda_items')
        .select('*', { count: 'exact', head: true })
        .eq('action_owner_id', person.id)
        .eq('action_required', true)
        .in('action_status', ['open', 'in_progress'])
        .lt('action_due_date', today);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!person?.id,
  });
}
