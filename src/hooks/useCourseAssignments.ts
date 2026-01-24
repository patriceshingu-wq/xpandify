import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Database } from '@/integrations/supabase/types';

type CourseAssignmentRow = Database['public']['Tables']['course_assignments']['Row'];
type CourseAssignmentInsert = Database['public']['Tables']['course_assignments']['Insert'];
type CourseAssignmentUpdate = Database['public']['Tables']['course_assignments']['Update'];

export interface CourseAssignment extends CourseAssignmentRow {
  person?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  course?: {
    id: string;
    code: string | null;
    title_en: string;
    title_fr: string | null;
    category: string | null;
    delivery_type: string | null;
    estimated_duration_hours: number | null;
  } | null;
  assigned_by?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface CourseAssignmentFilters {
  person_id?: string;
  course_id?: string;
  status?: string;
}

// Fetch all course assignments
export function useCourseAssignments(filters: CourseAssignmentFilters = {}) {
  return useQuery({
    queryKey: ['course-assignments', filters],
    queryFn: async (): Promise<CourseAssignment[]> => {
      let query = supabase
        .from('course_assignments')
        .select(`
          *,
          person:people!course_assignments_person_id_fkey(id, first_name, last_name),
          course:courses(id, code, title_en, title_fr, category, delivery_type, estimated_duration_hours),
          assigned_by:people!course_assignments_assigned_by_id_fkey(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.person_id) {
        query = query.eq('person_id', filters.person_id);
      }

      if (filters.course_id) {
        query = query.eq('course_id', filters.course_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status as 'not_started' | 'in_progress' | 'completed' | 'dropped');
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(assignment => ({
        ...assignment,
        person: Array.isArray(assignment.person) ? assignment.person[0] : assignment.person,
        course: Array.isArray(assignment.course) ? assignment.course[0] : assignment.course,
        assigned_by: Array.isArray(assignment.assigned_by) ? assignment.assigned_by[0] : assignment.assigned_by,
      }));
    },
  });
}

// Create course assignment
export function useCreateCourseAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (assignment: CourseAssignmentInsert) => {
      const { data, error } = await supabase
        .from('course_assignments')
        .insert(assignment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      toast({
        title: t('common.success'),
        description: 'Course assigned successfully',
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

// Update course assignment
export function useUpdateCourseAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CourseAssignmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('course_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      toast({
        title: t('common.success'),
        description: 'Assignment updated successfully',
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

// Delete course assignment
export function useDeleteCourseAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      toast({
        title: t('common.success'),
        description: 'Assignment deleted successfully',
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
