import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrganizationSettings {
  id: string;
  organization_name: string;
  organization_logo_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state_province: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  email_sender_name: string | null;
  email_sender_address: string | null;
  email_reply_to: string | null;
  email_footer_text: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  font_family: string | null;
  yearly_theme_en: string | null;
  yearly_theme_fr: string | null;
  yearly_vision_en: string | null;
  yearly_vision_fr: string | null;
  theme_year: number | null;
  theme_scripture: string | null;
  created_at: string;
  updated_at: string;
  // Feature toggles (upgrades)
  feature_org_chart: boolean | null;
  feature_bulk_operations: boolean | null;
  feature_cascade_view: boolean | null;
  feature_department_goals: boolean | null;
  feature_dev_plans: boolean | null;
  feature_event_goal_linking: boolean | null;
  feature_quarters: boolean | null;
  feature_programs: boolean | null;
  feature_bilingual_editing: boolean | null;
  // Phase 2 feature toggles
  feature_courses: boolean | null;
  feature_pathways: boolean | null;
  feature_mentorship: boolean | null;
  feature_reviews: boolean | null;
  feature_surveys: boolean | null;
  feature_analytics: boolean | null;
  feature_recurring_meetings: boolean | null;
}

export function useOrganizationSettings() {
  return useQuery({
    queryKey: ['organization-settings'],
    queryFn: async (): Promise<OrganizationSettings | null> => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as OrganizationSettings | null;
    },
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<OrganizationSettings> & { id: string }) => {
      const { id, ...updates } = settings;
      const { data, error } = await supabase
        .from('organization_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast({
        title: 'Settings saved',
        description: 'Organization settings have been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
