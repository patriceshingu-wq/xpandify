import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRoleType } from '@/contexts/AuthContext';

export interface AdminUser {
  id: string;
  email: string;
  is_active: boolean;
  primary_language: 'en' | 'fr';
  created_at: string;
  last_login_at: string | null;
  person?: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
  roles: AppRoleType[];
}

export interface AppRole {
  id: string;
  name: AppRoleType;
  description: string | null;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<AdminUser[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch people linked to users
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, user_id, first_name, last_name, preferred_name')
        .not('user_id', 'is', null);

      if (peopleError) throw peopleError;

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          app_roles (name)
        `);

      if (rolesError) throw rolesError;

      // Map roles by user_id
      const rolesMap: Record<string, AppRoleType[]> = {};
      userRoles?.forEach((ur: { user_id: string; app_roles: { name: string } | null }) => {
        if (ur.app_roles?.name) {
          if (!rolesMap[ur.user_id]) rolesMap[ur.user_id] = [];
          rolesMap[ur.user_id].push(ur.app_roles.name as AppRoleType);
        }
      });

      // Map people by user_id
      const peopleMap: Record<string, typeof people[0]> = {};
      people?.forEach((p) => {
        if (p.user_id) peopleMap[p.user_id] = p;
      });

      return (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        is_active: profile.is_active ?? true,
        primary_language: profile.primary_language as 'en' | 'fr',
        created_at: profile.created_at,
        last_login_at: profile.last_login_at,
        person: peopleMap[profile.id] ? {
          id: peopleMap[profile.id].id,
          first_name: peopleMap[profile.id].first_name,
          last_name: peopleMap[profile.id].last_name,
          preferred_name: peopleMap[profile.id].preferred_name,
        } : null,
        roles: rolesMap[profile.id] || [],
      }));
    },
  });
}

export function useAppRoles() {
  return useQuery({
    queryKey: ['app-roles'],
    queryFn: async (): Promise<AppRole[]> => {
      const { data, error } = await supabase
        .from('app_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []).map((role) => ({
        id: role.id,
        name: role.name as AppRoleType,
        description: role.description,
      }));
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'User updated',
        description: 'User status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Role assigned',
        description: 'User role has been assigned successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Role removed',
        description: 'User role has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useLinkPersonToUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, personId }: { userId: string; personId: string }) => {
      const { error } = await supabase
        .from('people')
        .update({ user_id: userId })
        .eq('id', personId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast({
        title: 'Person linked',
        description: 'Person has been linked to the user account.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
