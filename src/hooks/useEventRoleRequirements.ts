import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export interface EventRoleRequirement {
  id: string;
  event_id: string;
  role_name: string;
  quantity_needed: number;
  created_at: string;
  updated_at: string;
}

export function useEventRoleRequirements(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-role-requirements', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await (supabase.from('event_role_requirements' as any))
        .select('*')
        .eq('event_id', eventId)
        .order('role_name');

      if (error) throw error;
      return (data || []) as unknown as EventRoleRequirement[];
    },
    enabled: !!eventId,
  });
}

export function useCreateEventRoleRequirement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (req: { event_id: string; role_name: string; quantity_needed: number }) => {
      const { data, error } = await (supabase.from('event_role_requirements' as any))
        .insert(req)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-role-requirements', variables.event_id] });
      toast({ title: t('common.success'), description: 'Role requirement added' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEventRoleRequirement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, event_id, ...data }: Partial<EventRoleRequirement> & { id: string; event_id: string }) => {
      const { error } = await (supabase.from('event_role_requirements' as any))
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-role-requirements', variables.event_id] });
      toast({ title: t('common.success'), description: 'Role requirement updated' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEventRoleRequirement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, event_id }: { id: string; event_id: string }) => {
      const { error } = await (supabase.from('event_role_requirements' as any))
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-role-requirements', variables.event_id] });
      toast({ title: t('common.success'), description: 'Role requirement removed' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

/**
 * Bulk copy role requirements AND role assignments from one event to another
 */
export function useCopyEventRoles() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ sourceEventId, targetEventId }: { sourceEventId: string; targetEventId: string }) => {
      // Copy requirements
      const { data: requirements } = await (supabase.from('event_role_requirements' as any))
        .select('role_name, quantity_needed')
        .eq('event_id', sourceEventId);

      if (requirements && requirements.length > 0) {
        const newReqs = (requirements as any[]).map(r => ({
          event_id: targetEventId,
          role_name: r.role_name,
          quantity_needed: r.quantity_needed,
        }));
        await (supabase.from('event_role_requirements' as any)).insert(newReqs);
      }

      // Copy role assignments
      const { data: roles } = await supabase
        .from('event_roles')
        .select('person_id, role, from_country, notes')
        .eq('event_id', sourceEventId);

      if (roles && roles.length > 0) {
        const newRoles = roles.map(r => ({
          event_id: targetEventId,
          person_id: r.person_id,
          role: r.role,
          from_country: r.from_country,
          notes: r.notes,
        }));
        await supabase.from('event_roles').insert(newRoles);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-roles', variables.targetEventId] });
      queryClient.invalidateQueries({ queryKey: ['event-role-requirements', variables.targetEventId] });
      toast({ title: t('common.success'), description: 'Roles copied from previous event' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
