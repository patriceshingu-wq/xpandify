import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Pathway {
  id: string;
  code: string;
  name_en: string;
  name_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  estimated_duration_weeks: number | null;
  difficulty_level: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  courses?: PathwayCourse[];
}

export interface PathwayCourse {
  id: string;
  pathway_id: string;
  course_id: string;
  order_index: number | null;
  is_required: boolean | null;
  course?: {
    id: string;
    title_en: string;
    title_fr: string | null;
    code: string | null;
    category: string | null;
    estimated_duration_hours: number | null;
  };
}

export function usePathways() {
  return useQuery({
    queryKey: ['pathways'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pathways')
        .select(`
          *,
          courses:pathway_courses(
            id,
            pathway_id,
            course_id,
            order_index,
            is_required,
            course:courses(id, title_en, title_fr, code, category, estimated_duration_hours)
          )
        `)
        .order('name_en');

      if (error) throw error;
      return data as Pathway[];
    },
  });
}

export function usePathway(id: string | undefined) {
  return useQuery({
    queryKey: ['pathway', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('pathways')
        .select(`
          *,
          courses:pathway_courses(
            id,
            pathway_id,
            course_id,
            order_index,
            is_required,
            course:courses(id, title_en, title_fr, code, category, estimated_duration_hours)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Pathway;
    },
    enabled: !!id,
  });
}

export function useCreatePathway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pathway: Omit<Pathway, 'id' | 'created_at' | 'updated_at' | 'courses'>) => {
      const { data, error } = await supabase
        .from('pathways')
        .insert(pathway)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      toast.success('Pathway created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create pathway: ' + error.message);
    },
  });
}

export function useUpdatePathway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Pathway> & { id: string }) => {
      const { data, error } = await supabase
        .from('pathways')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      queryClient.invalidateQueries({ queryKey: ['pathway', variables.id] });
      toast.success('Pathway updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update pathway: ' + error.message);
    },
  });
}

export function useDeletePathway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pathways')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      toast.success('Pathway deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete pathway: ' + error.message);
    },
  });
}

export function useAddCourseToPathway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pathwayId, courseId, orderIndex, isRequired }: {
      pathwayId: string;
      courseId: string;
      orderIndex?: number;
      isRequired?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('pathway_courses')
        .insert({
          pathway_id: pathwayId,
          course_id: courseId,
          order_index: orderIndex ?? 0,
          is_required: isRequired ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      queryClient.invalidateQueries({ queryKey: ['pathway', variables.pathwayId] });
      toast.success('Course added to pathway');
    },
    onError: (error) => {
      toast.error('Failed to add course: ' + error.message);
    },
  });
}

export function useRemoveCourseFromPathway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pathwayId, courseId }: { pathwayId: string; courseId: string }) => {
      const { error } = await supabase
        .from('pathway_courses')
        .delete()
        .eq('pathway_id', pathwayId)
        .eq('course_id', courseId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
      queryClient.invalidateQueries({ queryKey: ['pathway', variables.pathwayId] });
      toast.success('Course removed from pathway');
    },
    onError: (error) => {
      toast.error('Failed to remove course: ' + error.message);
    },
  });
}
