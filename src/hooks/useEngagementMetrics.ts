import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';

export interface MonthlyMetric {
  month: string;
  label: string;
  meetings: number;
  feedback: number;
  avgGoalProgress: number;
}

export function useEngagementMetrics(monthsBack = 6) {
  return useQuery({
    queryKey: ['engagement-metrics', monthsBack],
    queryFn: async () => {
      const now = new Date();
      const months: MonthlyMetric[] = [];

      for (let i = monthsBack - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const start = startOfMonth(monthDate).toISOString();
        const end = endOfMonth(monthDate).toISOString();
        const label = format(monthDate, 'MMM');

        // Count meetings in this month
        const { count: meetingCount } = await supabase
          .from('meetings')
          .select('*', { count: 'exact', head: true })
          .gte('date_time', start)
          .lte('date_time', end);

        // Count feedback in this month
        const { count: feedbackCount } = await supabase
          .from('feedback')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end);

        // Average goal progress (current snapshot for this month — we only have current state)
        // For historical accuracy we'd need snapshots; for now use current data
        const { data: goals } = await supabase
          .from('goals')
          .select('progress_percent')
          .in('status', ['in_progress', 'completed']);

        const avgProgress = goals && goals.length > 0
          ? Math.round(goals.reduce((sum, g) => sum + (g.progress_percent || 0), 0) / goals.length)
          : 0;

        months.push({
          month: format(monthDate, 'yyyy-MM'),
          label,
          meetings: meetingCount || 0,
          feedback: feedbackCount || 0,
          avgGoalProgress: avgProgress,
        });
      }

      return months;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
