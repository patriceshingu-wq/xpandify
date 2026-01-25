import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';

type MeetingType = Database['public']['Enums']['meeting_type'];

export type AgendaSectionType = 
  | 'spiritual_life'
  | 'personal_family'
  | 'ministry_updates'
  | 'goals_review'
  | 'development_training'
  | 'feedback_coaching'
  | 'other';

export interface MeetingTemplate {
  id: string;
  name_en: string;
  name_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  meeting_type: MeetingType;
  is_active: boolean | null;
  is_default: boolean | null;
  created_by_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  items?: MeetingTemplateItem[];
}

export interface MeetingTemplateItem {
  id: string;
  template_id: string;
  order_index: number | null;
  section_type: AgendaSectionType;
  topic_en: string;
  topic_fr: string | null;
  is_required: boolean | null;
  created_at: string | null;
}

export function useMeetingTemplates(meetingType?: MeetingType) {
  return useQuery({
    queryKey: ['meeting-templates', meetingType],
    queryFn: async () => {
      let query = supabase
        .from('meeting_templates')
        .select(`
          *,
          items:meeting_template_items(*)
        `)
        .eq('is_active', true)
        .order('name_en');

      if (meetingType) {
        query = query.eq('meeting_type', meetingType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as MeetingTemplate[];
    },
  });
}

export function useMeetingTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['meeting-template', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('meeting_templates')
        .select(`
          *,
          items:meeting_template_items(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as MeetingTemplate | null;
    },
    enabled: !!id,
  });
}

export function useCreateMeetingTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (template: { 
      name_en: string; 
      name_fr?: string | null;
      description_en?: string | null;
      description_fr?: string | null;
      meeting_type: MeetingType;
      is_active?: boolean;
      is_default?: boolean;
      created_by_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('meeting_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-templates'] });
      toast({
        title: t('common.success'),
        description: 'Template created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateMeetingTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...template }: { 
      id: string;
      name_en?: string; 
      name_fr?: string | null;
      description_en?: string | null;
      description_fr?: string | null;
      meeting_type?: MeetingType;
      is_active?: boolean;
      is_default?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('meeting_templates')
        .update(template)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-templates'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-template', variables.id] });
      toast({
        title: t('common.success'),
        description: 'Template updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreateTemplateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (item: Omit<MeetingTemplateItem, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('meeting_template_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-templates'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-template', data.template_id] });
      toast({
        title: t('common.success'),
        description: 'Template item added',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTemplateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, template_id }: { id: string; template_id: string }) => {
      const { error } = await supabase
        .from('meeting_template_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, template_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-templates'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-template', data.template_id] });
      toast({
        title: t('common.success'),
        description: 'Template item removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Helper to get section type label
export function getSectionTypeLabel(sectionType: AgendaSectionType, t: (key: string) => string): string {
  const labels: Record<AgendaSectionType, string> = {
    spiritual_life: 'Spiritual Life',
    personal_family: 'Personal & Family',
    ministry_updates: 'Ministry Updates',
    goals_review: 'Goals Review',
    development_training: 'Development & Training',
    feedback_coaching: 'Feedback & Coaching',
    other: 'Other',
  };
  return labels[sectionType] || sectionType;
}

export function getSectionTypeColor(sectionType: AgendaSectionType): string {
  const colors: Record<AgendaSectionType, string> = {
    spiritual_life: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    personal_family: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    ministry_updates: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    goals_review: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    development_training: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    feedback_coaching: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  return colors[sectionType] || colors.other;
}
