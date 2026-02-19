import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PersonStats {
  goalsCount: number;
  meetingsCount: number;
  coursesCount: number;
  feedbackCount: number;
}

export function usePersonStats(personId: string | undefined) {
  return useQuery({
    queryKey: ['person-stats', personId],
    queryFn: async (): Promise<PersonStats> => {
      if (!personId) {
        return { goalsCount: 0, meetingsCount: 0, coursesCount: 0, feedbackCount: 0 };
      }

      // Fetch counts in parallel
      const [goalsResult, meetingsResult, coursesResult, feedbackResult] = await Promise.all([
        // Goals owned by this person
        supabase
          .from('goals')
          .select('id', { count: 'exact', head: true })
          .eq('owner_person_id', personId),

        // Meetings where this person is a participant
        supabase
          .from('meeting_participants')
          .select('id', { count: 'exact', head: true })
          .eq('person_id', personId),

        // Course assignments for this person
        supabase
          .from('course_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('person_id', personId),

        // Feedback received by this person
        supabase
          .from('feedback')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', personId),
      ]);

      return {
        goalsCount: goalsResult.count ?? 0,
        meetingsCount: meetingsResult.count ?? 0,
        coursesCount: coursesResult.count ?? 0,
        feedbackCount: feedbackResult.count ?? 0,
      };
    },
    enabled: !!personId,
  });
}
