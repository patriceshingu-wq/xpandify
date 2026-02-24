import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

/**
 * Hook for prefetching data on route hover/focus
 * Improves perceived performance by loading data before navigation
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchPeople = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['people'],
      queryFn: async () => {
        const { data } = await supabase
          .from('people')
          .select('*, campus:campuses(id, name, code)')
          .order('first_name');
        return data || [];
      },
      staleTime: 30000, // Consider fresh for 30 seconds
    });
  }, [queryClient]);

  const prefetchGoals = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['goals'],
      queryFn: async () => {
        const { data } = await supabase
          .from('goals')
          .select('*')
          .order('created_at', { ascending: false });
        return data || [];
      },
      staleTime: 30000,
    });
  }, [queryClient]);

  const prefetchMeetings = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['meetings'],
      queryFn: async () => {
        const { data } = await supabase
          .from('meetings')
          .select('*')
          .order('date_time', { ascending: false });
        return data || [];
      },
      staleTime: 30000,
    });
  }, [queryClient]);

  const prefetchDashboard = useCallback(() => {
    // Prefetch all data needed for dashboard
    prefetchPeople();
    prefetchGoals();
    prefetchMeetings();
  }, [prefetchPeople, prefetchGoals, prefetchMeetings]);

  const prefetchEvents = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['events'],
      queryFn: async () => {
        const { data } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true });
        return data || [];
      },
      staleTime: 30000,
    });
  }, [queryClient]);

  const prefetchMinistries = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['ministries'],
      queryFn: async () => {
        const { data } = await supabase
          .from('ministries')
          .select('*')
          .order('name_en');
        return data || [];
      },
      staleTime: 30000,
    });
  }, [queryClient]);

  return {
    prefetchPeople,
    prefetchGoals,
    prefetchMeetings,
    prefetchDashboard,
    prefetchEvents,
    prefetchMinistries,
  };
}
