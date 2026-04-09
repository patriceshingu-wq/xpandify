import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GoalChange {
  id: string;
  title_en: string;
  title_fr: string | null;
  progress_percent: number | null;
  status: string | null;
  updated_at: string | null;
}

interface FeedbackItem {
  id: string;
  title_en: string | null;
  title_fr: string | null;
  content_en: string | null;
  feedback_type: string | null;
  created_at: string | null;
  given_by: { first_name: string; last_name: string } | null;
}

interface OutstandingAction {
  id: string;
  topic_en: string;
  topic_fr: string | null;
  action_status: string | null;
  action_due_date: string | null;
  meeting_title: string;
  meeting_date: string;
}

export interface MeetingPrepData {
  goalChanges: GoalChange[];
  recentFeedback: FeedbackItem[];
  outstandingActions: OutstandingAction[];
  lastMeetingDate: string | null;
  isLoading: boolean;
}

/**
 * Hook to prepare data for a meeting with a specific person.
 * Fetches goal changes, recent feedback, and outstanding action items since the last meeting.
 */
export function useMeetingPrep(personFocusId: string | undefined, organizerId: string | undefined, currentMeetingDate: string | undefined): MeetingPrepData {
  const { person } = useAuth();

  // Find the last meeting with the same person_focus
  const { data: lastMeeting } = useQuery({
    queryKey: ['last-meeting', personFocusId, organizerId, currentMeetingDate],
    queryFn: async () => {
      if (!personFocusId || !organizerId) return null;

      const { data, error } = await supabase
        .from('meetings')
        .select('id, date_time, title_en')
        .eq('person_focus_id', personFocusId)
        .eq('organizer_id', organizerId)
        .lt('date_time', currentMeetingDate || new Date().toISOString())
        .order('date_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!personFocusId && !!organizerId,
  });

  const sinceDate = lastMeeting?.date_time || null;

  // Goal changes since last meeting
  const { data: goalChanges = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['meeting-prep-goals', personFocusId, sinceDate],
    queryFn: async () => {
      if (!personFocusId) return [];

      let query = supabase
        .from('goals')
        .select('id, title_en, title_fr, progress_percent, status, updated_at')
        .eq('owner_person_id', personFocusId)
        .in('status', ['not_started', 'in_progress', 'on_hold']);

      if (sinceDate) {
        query = query.gte('updated_at', sinceDate);
      }

      const { data, error } = await query.order('updated_at', { ascending: false }).limit(10);
      if (error) throw error;
      return (data || []) as GoalChange[];
    },
    enabled: !!personFocusId,
  });

  // Recent feedback
  const { data: recentFeedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ['meeting-prep-feedback', personFocusId, sinceDate],
    queryFn: async () => {
      if (!personFocusId) return [];

      let query = supabase
        .from('feedback')
        .select('id, title_en, title_fr, content_en, feedback_type, created_at, given_by:people!feedback_given_by_id_fkey(first_name, last_name)')
        .eq('person_id', personFocusId);

      if (sinceDate) {
        query = query.gte('created_at', sinceDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        given_by: Array.isArray(item.given_by) ? item.given_by[0] || null : item.given_by,
      })) as FeedbackItem[];
    },
    enabled: !!personFocusId,
  });

  // Outstanding action items from previous meetings with this person
  const { data: outstandingActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ['meeting-prep-actions', personFocusId, organizerId],
    queryFn: async () => {
      if (!personFocusId) return [];

      const { data, error } = await supabase
        .from('meeting_agenda_items')
        .select(`
          id, topic_en, topic_fr, action_status, action_due_date,
          meeting:meetings!meeting_agenda_items_meeting_id_fkey(id, title_en, date_time, person_focus_id)
        `)
        .eq('action_required', true)
        .in('action_status', ['open', 'in_progress'])
        .eq('action_owner_id', personFocusId)
        .order('action_due_date', { ascending: true, nullsFirst: false })
        .limit(20);

      if (error) throw error;

      return (data || [])
        .map(item => {
          const meeting = Array.isArray(item.meeting) ? item.meeting[0] : item.meeting;
          return {
            id: item.id,
            topic_en: item.topic_en,
            topic_fr: item.topic_fr,
            action_status: item.action_status,
            action_due_date: item.action_due_date,
            meeting_title: meeting?.title_en || '',
            meeting_date: meeting?.date_time || '',
          };
        })
        .filter(item => item.meeting_title) as OutstandingAction[];
    },
    enabled: !!personFocusId,
  });

  return {
    goalChanges,
    recentFeedback,
    outstandingActions,
    lastMeetingDate: sinceDate,
    isLoading: goalsLoading || feedbackLoading || actionsLoading,
  };
}
