import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AgendaSectionType = Database['public']['Enums']['agenda_section_type'];

export interface MeetingAgendaItemWithMeeting {
  id: string;
  topic_en: string;
  topic_fr: string | null;
  section_type: AgendaSectionType | null;
  discussion_notes: string | null;
  action_required: boolean | null;
  action_status: Database['public']['Enums']['action_status'] | null;
  action_due_date: string | null;
  action_owner_id: string | null;
  linked_goal_id: string | null;
  linked_pdp_item_id: string | null;
  meeting: {
    id: string;
    title_en: string;
    title_fr: string | null;
    date_time: string;
    meeting_type: Database['public']['Enums']['meeting_type'] | null;
  };
}

export interface ActionItemSummary {
  total: number;
  open: number;
  in_progress: number;
  done: number;
  items: MeetingAgendaItemWithMeeting[];
}

export interface MeetingWithAgenda {
  id: string;
  title_en: string;
  title_fr: string | null;
  date_time: string;
  meeting_type: Database['public']['Enums']['meeting_type'] | null;
  agenda_items: Array<{
    id: string;
    topic_en: string;
    topic_fr: string | null;
    section_type: AgendaSectionType | null;
    discussion_notes: string | null;
    action_required: boolean | null;
    action_status: Database['public']['Enums']['action_status'] | null;
  }>;
}

export interface GroupedAgendaItems {
  section_type: AgendaSectionType;
  label: string;
  items: MeetingAgendaItemWithMeeting[];
}

export function useReviewMeetingHistory(
  personId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined
) {
  return useQuery({
    queryKey: ['review-meeting-history', personId, startDate, endDate],
    queryFn: async () => {
      if (!personId || !startDate || !endDate) {
        return { meetings: [], groupedItems: [] };
      }

      // Fetch 1:1 meetings where this person is the focus
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select(`
          id,
          title_en,
          title_fr,
          date_time,
          meeting_type
        `)
        .eq('person_focus_id', personId)
        .eq('meeting_type', 'one_on_one')
        .gte('date_time', startDate)
        .lte('date_time', endDate)
        .order('date_time', { ascending: false });

      if (meetingsError) throw meetingsError;
      if (!meetings || meetings.length === 0) {
        return { meetings: [], groupedItems: [] };
      }

      const meetingIds = meetings.map(m => m.id);

      // Fetch agenda items for these meetings
      const { data: agendaItems, error: agendaError } = await supabase
        .from('meeting_agenda_items')
        .select(`
          id,
          topic_en,
          topic_fr,
          section_type,
          discussion_notes,
          action_required,
          action_status,
          action_due_date,
          action_owner_id,
          linked_goal_id,
          linked_pdp_item_id,
          meeting_id
        `)
        .in('meeting_id', meetingIds)
        .order('order_index');

      if (agendaError) throw agendaError;

      // Create meeting lookup
      const meetingLookup = new Map(meetings.map(m => [m.id, m]));

      // Build meetings with their agenda items
      const meetingsWithAgenda: MeetingWithAgenda[] = meetings.map(meeting => ({
        ...meeting,
        agenda_items: (agendaItems || [])
          .filter(item => item.meeting_id === meeting.id)
          .map(item => ({
            id: item.id,
            topic_en: item.topic_en,
            topic_fr: item.topic_fr,
            section_type: item.section_type,
            discussion_notes: item.discussion_notes,
            action_required: item.action_required,
            action_status: item.action_status,
          })),
      }));

      // Group agenda items by section type
      const sectionLabels: Record<AgendaSectionType, string> = {
        spiritual_life: 'Spiritual Life',
        personal_family: 'Personal & Family',
        ministry_updates: 'Ministry Updates',
        goals_review: 'Goals Review',
        development_training: 'Development & Training',
        feedback_coaching: 'Feedback & Coaching',
        other: 'Other',
      };

      const itemsWithMeeting: MeetingAgendaItemWithMeeting[] = (agendaItems || [])
        .filter(item => item.discussion_notes) // Only include items with notes
        .map(item => ({
          id: item.id,
          topic_en: item.topic_en,
          topic_fr: item.topic_fr,
          section_type: item.section_type,
          discussion_notes: item.discussion_notes,
          action_required: item.action_required,
          action_status: item.action_status,
          action_due_date: item.action_due_date,
          action_owner_id: item.action_owner_id,
          linked_goal_id: item.linked_goal_id,
          linked_pdp_item_id: item.linked_pdp_item_id,
          meeting: meetingLookup.get(item.meeting_id)!,
        }));

      // Build action items summary
      const actionItems = (agendaItems || [])
        .filter(item => item.action_required)
        .map(item => ({
          id: item.id,
          topic_en: item.topic_en,
          topic_fr: item.topic_fr,
          section_type: item.section_type,
          discussion_notes: item.discussion_notes,
          action_required: item.action_required,
          action_status: item.action_status,
          action_due_date: item.action_due_date,
          action_owner_id: item.action_owner_id,
          linked_goal_id: item.linked_goal_id,
          linked_pdp_item_id: item.linked_pdp_item_id,
          meeting: meetingLookup.get(item.meeting_id)!,
        }));

      const actionItemsSummary: ActionItemSummary = {
        total: actionItems.length,
        open: actionItems.filter(i => i.action_status === 'open').length,
        in_progress: actionItems.filter(i => i.action_status === 'in_progress').length,
        done: actionItems.filter(i => i.action_status === 'done').length,
        items: actionItems,
      };

      // Group by section type
      const grouped: GroupedAgendaItems[] = [];
      const sectionOrder: AgendaSectionType[] = [
        'spiritual_life',
        'personal_family',
        'ministry_updates',
        'goals_review',
        'development_training',
        'feedback_coaching',
        'other',
      ];

      for (const sectionType of sectionOrder) {
        const items = itemsWithMeeting.filter(item => item.section_type === sectionType);
        if (items.length > 0) {
          grouped.push({
            section_type: sectionType,
            label: sectionLabels[sectionType],
            items,
          });
        }
      }

      return {
        meetings: meetingsWithAgenda,
        groupedItems: grouped,
        actionItems: actionItemsSummary,
      };
    },
    enabled: !!personId && !!startDate && !!endDate,
  });
}

// Also fetch goals and PDP items for the review period
export function useReviewPeriodData(
  personId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined
) {
  return useQuery({
    queryKey: ['review-period-data', personId, startDate, endDate],
    queryFn: async () => {
      if (!personId) {
        return { goals: [], pdpItems: [], courseAssignments: [] };
      }

      // Fetch goals for this person
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('owner_person_id', personId)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // Fetch PDPs and items for this person
      const { data: pdps, error: pdpsError } = await supabase
        .from('personal_development_plans')
        .select(`
          id,
          plan_title_en,
          plan_title_fr,
          status,
          pdp_items:pdp_items(*)
        `)
        .eq('person_id', personId);

      if (pdpsError) throw pdpsError;

      // Flatten PDP items
      const pdpItems = (pdps || []).flatMap(pdp => 
        (pdp.pdp_items || []).map(item => ({
          ...item,
          pdp_title: pdp.plan_title_en,
        }))
      );

      // Fetch course assignments for this person
      const { data: assignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(id, title_en, title_fr)
        `)
        .eq('person_id', personId);

      if (assignmentsError) throw assignmentsError;

      return {
        goals: goals || [],
        pdpItems,
        courseAssignments: assignments || [],
      };
    },
    enabled: !!personId,
  });
}
