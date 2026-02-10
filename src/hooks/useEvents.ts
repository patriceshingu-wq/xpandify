import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ProgramLanguage } from './usePrograms';

export type EventStatus = 'Planned' | 'Confirmed' | 'Completed' | 'Canceled' | 'Postponed';

export interface CalendarEvent {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  title_en: string;
  title_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  location: string | null;
  is_all_day: boolean;
  quarter_id: string | null;
  program_id: string | null;
  ministry_id: string | null;
  activity_category_id: string | null;
  language: ProgramLanguage;
  status: EventStatus;
  completion_percentage: number;
  notes_internal: string | null;
  related_course_id: string | null;
  created_at: string;
  updated_at: string;
  quarter?: {
    id: string;
    year: number;
    quarter_number: number;
    theme_en: string;
  } | null;
  program?: {
    id: string;
    code: string;
    name_en: string;
    name_fr: string | null;
  } | null;
  ministry?: {
    id: string;
    name_en: string;
    name_fr: string | null;
  } | null;
  activity_category?: {
    id: string;
    name_en: string;
    name_fr: string | null;
    icon: string | null;
  } | null;
  course?: {
    id: string;
    title_en: string;
    title_fr: string | null;
  } | null;
}

export interface EventFilters {
  quarter_id?: string;
  program_id?: string;
  ministry_id?: string;
  activity_category_id?: string;
  language?: ProgramLanguage;
  status?: EventStatus;
  start_date?: string;
  end_date?: string;
  person_id?: string;
}

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          quarter:quarters(id, year, quarter_number, theme_en),
          program:programs(id, code, name_en, name_fr),
          ministry:ministries(id, name_en, name_fr),
          activity_category:activity_categories(id, name_en, name_fr, icon),
          course:courses(id, title_en, title_fr)
        `)
        .order('date', { ascending: true });

      if (filters?.quarter_id) query = query.eq('quarter_id', filters.quarter_id);
      if (filters?.program_id) query = query.eq('program_id', filters.program_id);
      if (filters?.ministry_id) query = query.eq('ministry_id', filters.ministry_id);
      if (filters?.activity_category_id) query = query.eq('activity_category_id', filters.activity_category_id);
      if (filters?.language) query = query.eq('language', filters.language);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.start_date) query = query.gte('date', filters.start_date);
      if (filters?.end_date) query = query.lte('date', filters.end_date);

      const { data, error } = await query;
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          quarter:quarters(id, year, quarter_number, theme_en),
          program:programs(id, code, name_en, name_fr),
          ministry:ministries(id, name_en, name_fr),
          activity_category:activity_categories(id, name_en, name_fr, icon),
          course:courses(id, title_en, title_fr)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as CalendarEvent | null;
    },
    enabled: !!id,
  });
}

export function usePersonEvents(personId: string | undefined) {
  return useQuery({
    queryKey: ['person-events', personId],
    queryFn: async () => {
      if (!personId) return [];

      const { data, error } = await supabase
        .from('event_roles')
        .select(`
          id,
          role,
          from_country,
          notes,
          event:events(
            *,
            quarter:quarters(id, year, quarter_number, theme_en),
            program:programs(id, code, name_en, name_fr),
            ministry:ministries(id, name_en, name_fr)
          )
        `)
        .eq('person_id', personId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!personId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'quarter' | 'program' | 'ministry' | 'activity_category' | 'course'>) => {
      const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: t('common.success'), description: 'Event created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...event }: Partial<CalendarEvent> & { id: string }) => {
      const { quarter, program, ministry, activity_category, course, ...updateData } = event as any;
      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
      toast({ title: t('common.success'), description: 'Event updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: t('common.success'), description: 'Event deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
