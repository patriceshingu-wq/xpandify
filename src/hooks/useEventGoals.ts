import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface EventGoal {
  id: string;
  event_id: string;
  goal_id: string;
  created_at: string;
  goal?: {
    id: string;
    title_en: string;
    title_fr: string | null;
    status: string;
    progress_percent: number;
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
          goal:goals(id, title_en, title_fr, status, progress_percent)
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      return data as EventGoal[];
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
      toast({ title: t('common.success'), description: 'Goal unlinked from event' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
