import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CourseProgress {
  id: string;
  person_id: string;
  course_id: string;
  pathway_id: string | null;
  completion_percentage: number | null;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  course?: {
    id: string;
    title_en: string;
    title_fr: string | null;
    code: string | null;
    category: string | null;
    estimated_duration_hours: number | null;
  };
  pathway?: {
    id: string;
    name_en: string;
    name_fr: string | null;
    code: string;
  };
}

export function useMyCourseProgress() {
  return useQuery({
    queryKey: ['my-course-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_progress')
        .select(`
          *,
          course:courses(id, title_en, title_fr, code, category, estimated_duration_hours),
          pathway:pathways(id, name_en, name_fr, code)
        `)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as CourseProgress[];
    },
  });
}

export function useCourseProgressByPerson(personId: string | undefined) {
  return useQuery({
    queryKey: ['course-progress', personId],
    queryFn: async () => {
      if (!personId) return [];
      const { data, error } = await supabase
        .from('course_progress')
        .select(`
          *,
          course:courses(id, title_en, title_fr, code, category, estimated_duration_hours),
          pathway:pathways(id, name_en, name_fr, code)
        `)
        .eq('person_id', personId)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as CourseProgress[];
    },
    enabled: !!personId,
  });
}

export function useStartCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, pathwayId, personId }: {
      courseId: string;
      pathwayId?: string;
      personId: string;
    }) => {
      const { data, error } = await supabase
        .from('course_progress')
        .insert({
          course_id: courseId,
          pathway_id: pathwayId ?? null,
          person_id: personId,
          completion_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
      toast.success('Course started!');
    },
    onError: (error) => {
      toast.error('Failed to start course: ' + error.message);
    },
  });
}

export function useUpdateCourseProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseProgress> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates, last_activity_at: new Date().toISOString() };
      
      // If completed, set completed_at
      if (updates.completion_percentage === 100) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('course_progress')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
      toast.success('Progress updated');
    },
    onError: (error) => {
      toast.error('Failed to update progress: ' + error.message);
    },
  });
}

export function useDeleteCourseProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_progress')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
      toast.success('Progress removed');
    },
    onError: (error) => {
      toast.error('Failed to remove progress: ' + error.message);
    },
  });
}
