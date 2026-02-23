import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';

type GoalRow = Database['public']['Tables']['goals']['Row'];

export interface EventGoal {
  id: string;
  event_id: string;
  goal_id: string;
  created_at: string;
  goal?: {
    id: string;
    title_en: string;
    title_fr: string | null;
    goal_level: GoalRow['goal_level'];
    status: string;
    progress_percent: number;
  } | null;
}

export interface EventGoalWithEvent {
  id: string;
  event_id: string;
  goal_id: string;
  created_at: string;
  event?: {
    id: string;
    title_en: string;
    title_fr: string | null;
    start_time: string;
  } | null;
}

export function useEventGoals(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-goals', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_goals')
        .select(`
          *,
          goal:goals(id, title_en, title_fr, goal_level, status, progress_percent)
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      // Normalize embedded relationships
      return (data || []).map(item => ({
        ...item,
        goal: Array.isArray(item.goal) ? item.goal[0] : item.goal,
      })) as EventGoal[];
    },
    enabled: !!eventId,
  });
}

export function useAddEventGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ event_id, goal_id }: { event_id: string; goal_id: string }) => {
      const { data, error } = await supabase
        .from('event_goals')
        .insert({ event_id, goal_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-goals', variables.event_id] });
      toast({ title: t('common.success'), description: 'Goal linked to event' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useRemoveEventGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, event_id }: { id: string; event_id: string }) => {
      const { error } = await supabase.from('event_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-goals', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['goal-events'] });
      toast({ title: t('common.success'), description: t('goals.unlinkedFromEvent') });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Hook to fetch events linked to a specific goal
 */
export function useGoalEvents(goalId: string | undefined) {
  return useQuery({
    queryKey: ['goal-events', goalId],
    queryFn: async () => {
      if (!goalId) return [];

      const { data, error } = await supabase
        .from('event_goals')
        .select(`
          *,
          event:events(id, title_en, title_fr, start_time)
        `)
        .eq('goal_id', goalId);

      if (error) throw error;

      // Normalize embedded relationships
      return (data || []).map(item => ({
        ...item,
        event: Array.isArray(item.event) ? item.event[0] : item.event,
      })) as EventGoalWithEvent[];
    },
    enabled: !!goalId,
  });
}

/**
 * Hook to sync event goals (replace all linked goals for an event)
 */
export function useSyncEventGoals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ eventId, goalIds }: { eventId: string; goalIds: string[] }) => {
      // Delete existing links
      const { error: deleteError } = await supabase
        .from('event_goals')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) throw deleteError;

      // Insert new links
      if (goalIds.length > 0) {
        const { error: insertError } = await supabase
          .from('event_goals')
          .insert(goalIds.map(goalId => ({ event_id: eventId, goal_id: goalId })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-goals', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['goal-events'] });
    },
    onError: (error: Error) => {
      console.error('[useEventGoals] Sync error:', error);
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Hook to sync goal events (replace all linked events for a goal)
 */
export function useSyncGoalEvents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ goalId, eventIds }: { goalId: string; eventIds: string[] }) => {
      // Delete existing links
      const { error: deleteError } = await supabase
        .from('event_goals')
        .delete()
        .eq('goal_id', goalId);

      if (deleteError) throw deleteError;

      // Insert new links
      if (eventIds.length > 0) {
        const { error: insertError } = await supabase
          .from('event_goals')
          .insert(eventIds.map(eventId => ({ event_id: eventId, goal_id: goalId })));

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal-events', variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ['event-goals'] });
    },
    onError: (error: Error) => {
      console.error('[useEventGoals] Sync error:', error);
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
