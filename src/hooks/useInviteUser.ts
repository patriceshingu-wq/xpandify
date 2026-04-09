import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface InviteUserData {
  email: string;
  person: {
    first_name: string;
    last_name: string;
    preferred_name?: string;
    phone?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    primary_language: 'en' | 'fr';
    person_type: 'staff' | 'volunteer' | 'congregant';
    status: 'active' | 'inactive' | 'on_leave';
    supervisor_id?: string;
    start_date?: string;
    campus_id?: string;
    title?: string;
    notes?: string;
  };
  role_id?: string;
  ministry_ids?: string[];
}

interface InviteUserResponse {
  success: boolean;
  data?: {
    user_id: string;
    person_id: string;
    email: string;
  };
  error?: string;
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (data: InviteUserData): Promise<InviteUserResponse> => {
      // Get the current session token
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('invite-user', {
        body: {
          ...data,
          redirect_to: 'https://xpandify.wearemc.church/auth',
        },
      });

      if (response.error) {
        let errorMessage = 'Failed to invite user';
        try {
          // For FunctionsHttpError, the response body is in error.context
          const ctx = (response.error as any)?.context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) errorMessage = body.error;
          } else if (response.data && typeof response.data === 'object' && response.data.error) {
            errorMessage = response.data.error;
          }
        } catch {
          // fallback
        }
        throw new Error(errorMessage);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to invite user');
      }

      // If ministry_ids provided, link person to ministries
      if (response.data?.data?.person_id && data.ministry_ids?.length) {
        const ministryInserts = data.ministry_ids.map(ministry_id => ({
          person_id: response.data.data!.person_id,
          ministry_id,
        }));
        await supabase.from('people_ministries').insert(ministryInserts);
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['people-ministries'] });
      toast.success(t('admin.inviteSuccess'));
    },
    onError: (error: Error) => {
      console.error('[useInviteUser] Error:', error);

      // Handle specific error messages
      if (error.message.includes('already exists')) {
        toast.error(t('admin.inviteErrorEmailExists'));
      } else if (error.message.includes('permissions')) {
        toast.error(t('admin.inviteErrorPermissions'));
      } else {
        toast.error(t('admin.inviteError'));
      }
    },
  });
}
