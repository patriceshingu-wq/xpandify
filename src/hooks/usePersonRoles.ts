import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { MinistryRole } from './useMinistryRoles';

export interface PersonRole {
  id: string;
  person_id: string;
  role_id: string;
  created_at: string | null;
  role: MinistryRole;
}

export function usePersonRoles(personId: string | undefined) {
  return useQuery({
    queryKey: ['person-roles', personId],
    queryFn: async () => {
      if (!personId) return [];

      const { data, error } = await supabase
        .from('people_roles')
        .select(`
          id,
          person_id,
          role_id,
          created_at,
          role:ministry_roles(*)
        `)
        .eq('person_id', personId);

      if (error) throw error;
      return data as PersonRole[];
    },
    enabled: !!personId,
  });
}

export function useAddPersonRole() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ personId, roleId }: { personId: string; roleId: string }) => {
      const { data, error } = await supabase
        .from('people_roles')
        .insert({ person_id: personId, role_id: roleId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-roles', variables.personId] });
      toast.success(t('ministries.roleAssigned'));
    },
    onError: (error) => {
      console.error('[usePersonRoles] Add error:', error);
      toast.error(t('common.error'));
    },
  });
}

export function useRemovePersonRole() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, personId }: { id: string; personId: string }) => {
      const { error } = await supabase
        .from('people_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return personId;
    },
    onSuccess: (personId) => {
      queryClient.invalidateQueries({ queryKey: ['person-roles', personId] });
      toast.success(t('ministries.roleRemoved'));
    },
    onError: (error) => {
      console.error('[usePersonRoles] Remove error:', error);
      toast.error(t('common.error'));
    },
  });
}

// Sync all roles for a person (useful for multi-select form)
export function useSyncPersonRoles() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ personId, roleIds }: { personId: string; roleIds: string[] }) => {
      // Get current roles
      const { data: currentRoles, error: fetchError } = await supabase
        .from('people_roles')
        .select('id, role_id')
        .eq('person_id', personId);

      if (fetchError) throw fetchError;

      const currentRoleIds = new Set(currentRoles?.map(r => r.role_id) || []);
      const newRoleIds = new Set(roleIds);

      // Roles to add
      const toAdd = roleIds.filter(id => !currentRoleIds.has(id));

      // Roles to remove
      const toRemove = currentRoles?.filter(r => !newRoleIds.has(r.role_id)).map(r => r.id) || [];

      // Remove old roles
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('people_roles')
          .delete()
          .in('id', toRemove);
        if (deleteError) throw deleteError;
      }

      // Add new roles
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('people_roles')
          .insert(toAdd.map(roleId => ({ person_id: personId, role_id: roleId })));
        if (insertError) throw insertError;
      }

      return personId;
    },
    onSuccess: (personId) => {
      queryClient.invalidateQueries({ queryKey: ['person-roles', personId] });
      toast.success(t('ministries.rolesUpdated'));
    },
    onError: (error) => {
      console.error('[usePersonRoles] Sync error:', error);
      toast.error(t('common.error'));
    },
  });
}
