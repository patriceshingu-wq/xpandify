import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface VisibleFeedback {
  id: string;
  title_en: string | null;
  title_fr: string | null;
  content_en: string | null;
  content_fr: string | null;
  feedback_type: 'encouragement' | 'coaching' | 'concern' | null;
  created_at: string | null;
  given_by: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
}

/**
 * Fetches feedback visible to a person (visible_to_person = true)
 * Used for populating 1:1 meeting agendas with received feedback
 */
export function useVisibleFeedback(personId: string | undefined) {
  return useQuery({
    queryKey: ['visible-feedback', personId],
    queryFn: async (): Promise<VisibleFeedback[]> => {
      if (!personId) return [];

      const { data, error } = await supabase
        .from('feedback')
        .select(`
          id,
          title_en,
          title_fr,
          content_en,
          content_fr,
          feedback_type,
          created_at,
          given_by:people!feedback_given_by_id_fkey(id, first_name, last_name, preferred_name)
        `)
        .eq('person_id', personId)
        .eq('visible_to_person', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        given_by: Array.isArray(item.given_by) ? item.given_by[0] || null : item.given_by,
      })) as VisibleFeedback[];
    },
    enabled: !!personId,
  });
}

/**
 * Fetch visible feedback directly (not as a hook) for use in mutation callbacks
 */
export async function fetchVisibleFeedback(personId: string): Promise<VisibleFeedback[]> {
  // First, get feedback IDs that are already linked to meeting agenda items
  const { data: linkedItems } = await supabase
    .from('meeting_agenda_items')
    .select('linked_feedback_id')
    .not('linked_feedback_id', 'is', null);

  const linkedFeedbackIds = new Set(
    (linkedItems || []).map(item => item.linked_feedback_id).filter(Boolean)
  );

  // Fetch visible feedback
  const { data, error } = await supabase
    .from('feedback')
    .select(`
      id,
      title_en,
      title_fr,
      content_en,
      content_fr,
      feedback_type,
      created_at,
      given_by:people!feedback_given_by_id_fkey(id, first_name, last_name, preferred_name)
    `)
    .eq('person_id', personId)
    .eq('visible_to_person', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter out feedback that's already linked to a meeting
  const feedbackList = (data || [])
    .filter(item => !linkedFeedbackIds.has(item.id))
    .map(item => ({
      ...item,
      given_by: Array.isArray(item.given_by) ? item.given_by[0] || null : item.given_by,
    })) as VisibleFeedback[];

  return feedbackList;
}

/**
 * Get the localized title for feedback
 */
export function getFeedbackTitle(
  feedback: VisibleFeedback,
  language: 'en' | 'fr' = 'en'
): { title_en: string; title_fr: string } {
  const title_en = feedback.title_en || 'Received Feedback';
  const title_fr = feedback.title_fr || feedback.title_en || 'Rétroaction reçue';
  return { title_en, title_fr };
}

/**
 * Format feedback content for display in discussion notes
 */
export function formatFeedbackForNotes(
  feedback: VisibleFeedback,
  language: 'en' | 'fr' = 'en'
): string {
  const content = language === 'fr' && feedback.content_fr ? feedback.content_fr : feedback.content_en;
  const givenBy = feedback.given_by 
    ? feedback.given_by.preferred_name || `${feedback.given_by.first_name} ${feedback.given_by.last_name}`
    : 'Unknown';
  const type = feedback.feedback_type?.replace(/_/g, ' ') || 'feedback';
  
  let notes = content || '';
  notes += `\n\n— ${givenBy} (${type})`;
  
  return notes.trim();
}
