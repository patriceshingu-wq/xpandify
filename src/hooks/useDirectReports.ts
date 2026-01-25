import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DirectReport {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string | null;
  person_type: string | null;
  status: string | null;
  supervisor_id: string | null;
}

export interface DirectReportWithStats extends DirectReport {
  nextMeeting?: {
    id: string;
    date_time: string;
    title_en: string;
  } | null;
  openActionItems: number;
  goalsInProgress: number;
  goalsCompleted: number;
}

export function useDirectReports() {
  const { person } = useAuth();

  return useQuery({
    queryKey: ['direct-reports', person?.id],
    queryFn: async () => {
      if (!person?.id) return [];

      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('supervisor_id', person.id)
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      return (data || []) as DirectReport[];
    },
    enabled: !!person?.id,
  });
}

export function useDirectReportsWithStats() {
  const { person } = useAuth();

  return useQuery({
    queryKey: ['direct-reports-stats', person?.id],
    queryFn: async () => {
      if (!person?.id) return [];

      // Get direct reports
      const { data: reports, error: reportsError } = await supabase
        .from('people')
        .select('*')
        .eq('supervisor_id', person.id)
        .eq('status', 'active')
        .order('first_name');

      if (reportsError) throw reportsError;
      if (!reports || reports.length === 0) return [];

      const reportIds = reports.map(r => r.id);

      // Get next meetings for each direct report (where they are person_focus_id)
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, date_time, title_en, person_focus_id')
        .in('person_focus_id', reportIds)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true });

      // Get open action items for each direct report
      const { data: actionItems } = await supabase
        .from('meeting_agenda_items')
        .select('action_owner_id, action_status')
        .in('action_owner_id', reportIds)
        .eq('action_required', true)
        .in('action_status', ['open', 'in_progress']);

      // Get goals for each direct report
      const { data: goals } = await supabase
        .from('goals')
        .select('owner_person_id, status')
        .in('owner_person_id', reportIds);

      // Combine data
      return reports.map(report => {
        const nextMeeting = meetings?.find(m => m.person_focus_id === report.id);
        const reportActionItems = actionItems?.filter(a => a.action_owner_id === report.id) || [];
        const reportGoals = goals?.filter(g => g.owner_person_id === report.id) || [];

        return {
          ...report,
          nextMeeting: nextMeeting ? {
            id: nextMeeting.id,
            date_time: nextMeeting.date_time,
            title_en: nextMeeting.title_en,
          } : null,
          openActionItems: reportActionItems.length,
          goalsInProgress: reportGoals.filter(g => g.status === 'in_progress').length,
          goalsCompleted: reportGoals.filter(g => g.status === 'completed').length,
        } as DirectReportWithStats;
      });
    },
    enabled: !!person?.id,
  });
}
