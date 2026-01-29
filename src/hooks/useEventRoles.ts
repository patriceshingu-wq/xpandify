import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface EventRole {
  id: string;
  event_id: string;
  person_id: string;
  role: string;
  from_country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    email: string | null;
  } | null;
}

export function useEventRoles(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-roles', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('event_roles')
        .select(`
          *,
          person:people(id, first_name, last_name, preferred_name, email)
        `)
        .eq('event_id', eventId)
        .order('role', { ascending: true });

      if (error) throw error;
      return data as EventRole[];
    },
    enabled: !!eventId,
  });
}

export function useCreateEventRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (role: Omit<EventRole, 'id' | 'created_at' | 'updated_at' | 'person'>) => {
      const { data, error } = await supabase
        .from('event_roles')
        .insert(role)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-roles', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['person-events'] });
      toast({ title: t('common.success'), description: 'Role assignment added' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEventRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, event_id, ...role }: Partial<EventRole> & { id: string; event_id: string }) => {
      const { person, ...updateData } = role as any;
      const { data, error } = await supabase
        .from('event_roles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-roles', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['person-events'] });
      toast({ title: t('common.success'), description: 'Role assignment updated' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEventRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, event_id }: { id: string; event_id: string }) => {
      const { error } = await supabase.from('event_roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-roles', variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ['person-events'] });
      toast({ title: t('common.success'), description: 'Role assignment removed' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
