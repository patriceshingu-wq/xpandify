import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeamMemberDetail {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  person_type: string | null;
  status: string | null;
  start_date: string | null;
  campus_id: string | null;
  calling_description: string | null;
  strengths: string | null;
  growth_areas: string | null;
}

export interface TeamMemberStats {
  member: TeamMemberDetail;
  goals: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  meetings: {
    total: number;
    upcoming: number;
    lastMeetingDate: string | null;
    nextMeetingDate: string | null;
  };
  courses: {
    assigned: number;
    completed: number;
    inProgress: number;
  };
  feedback: {
    received: number;
    encouragement: number;
    coaching: number;
  };
  actionItems: {
    open: number;
    completed: number;
  };
  pdps: {
    active: number;
    completed: number;
  };
}

export function useTeamMembersWithDetails() {
  const { person } = useAuth();

  return useQuery({
    queryKey: ['team-members-details', person?.id],
    queryFn: async () => {
      if (!person?.id) return [];

      // Get direct reports with full details
      const { data: members, error: membersError } = await supabase
        .from('people')
        .select('id, first_name, last_name, preferred_name, email, phone, person_type, status, start_date, campus_id, calling_description, strengths, growth_areas')
        .eq('supervisor_id', person.id)
        .eq('status', 'active')
        .order('first_name');

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const memberIds = members.map(m => m.id);

      // Fetch all related data in parallel
      const [goalsRes, meetingsRes, coursesRes, feedbackRes, actionItemsRes, pdpsRes] = await Promise.all([
        // Goals
        supabase
          .from('goals')
          .select('owner_person_id, status')
          .in('owner_person_id', memberIds),
        
        // Meetings (as person_focus_id)
        supabase
          .from('meetings')
          .select('person_focus_id, date_time')
          .in('person_focus_id', memberIds)
          .order('date_time', { ascending: true }),
        
        // Course assignments
        supabase
          .from('course_assignments')
          .select('person_id, status')
          .in('person_id', memberIds),
        
        // Feedback received
        supabase
          .from('feedback')
          .select('person_id, feedback_type')
          .in('person_id', memberIds),
        
        // Action items
        supabase
          .from('meeting_agenda_items')
          .select('action_owner_id, action_status')
          .in('action_owner_id', memberIds)
          .eq('action_required', true),
        
        // PDPs
        supabase
          .from('personal_development_plans')
          .select('person_id, status')
          .in('person_id', memberIds),
      ]);

      const now = new Date().toISOString();

      return members.map(member => {
        const memberGoals = goalsRes.data?.filter(g => g.owner_person_id === member.id) || [];
        const memberMeetings = meetingsRes.data?.filter(m => m.person_focus_id === member.id) || [];
        const memberCourses = coursesRes.data?.filter(c => c.person_id === member.id) || [];
        const memberFeedback = feedbackRes.data?.filter(f => f.person_id === member.id) || [];
        const memberActions = actionItemsRes.data?.filter(a => a.action_owner_id === member.id) || [];
        const memberPdps = pdpsRes.data?.filter(p => p.person_id === member.id) || [];

        const pastMeetings = memberMeetings.filter(m => m.date_time < now);
        const upcomingMeetings = memberMeetings.filter(m => m.date_time >= now);

        return {
          member: member as TeamMemberDetail,
          goals: {
            total: memberGoals.length,
            completed: memberGoals.filter(g => g.status === 'completed').length,
            inProgress: memberGoals.filter(g => g.status === 'in_progress').length,
            notStarted: memberGoals.filter(g => g.status === 'not_started').length,
          },
          meetings: {
            total: memberMeetings.length,
            upcoming: upcomingMeetings.length,
            lastMeetingDate: pastMeetings.length > 0 ? pastMeetings[pastMeetings.length - 1].date_time : null,
            nextMeetingDate: upcomingMeetings.length > 0 ? upcomingMeetings[0].date_time : null,
          },
          courses: {
            assigned: memberCourses.length,
            completed: memberCourses.filter(c => c.status === 'completed').length,
            inProgress: memberCourses.filter(c => c.status === 'in_progress').length,
          },
          feedback: {
            received: memberFeedback.length,
            encouragement: memberFeedback.filter(f => f.feedback_type === 'encouragement').length,
            coaching: memberFeedback.filter(f => f.feedback_type === 'coaching').length,
          },
          actionItems: {
            open: memberActions.filter(a => a.action_status === 'open' || a.action_status === 'in_progress').length,
            completed: memberActions.filter(a => a.action_status === 'done').length,
          },
          pdps: {
            active: memberPdps.filter(p => p.status === 'active').length,
            completed: memberPdps.filter(p => p.status === 'completed').length,
          },
        } as TeamMemberStats;
      });
    },
    enabled: !!person?.id,
  });
}
