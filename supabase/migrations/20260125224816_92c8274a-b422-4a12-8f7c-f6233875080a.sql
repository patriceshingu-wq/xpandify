-- Add linked_feedback_id column to meeting_agenda_items
ALTER TABLE public.meeting_agenda_items 
ADD COLUMN linked_feedback_id uuid REFERENCES public.feedback(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX idx_meeting_agenda_items_linked_feedback_id 
ON public.meeting_agenda_items(linked_feedback_id) 
WHERE linked_feedback_id IS NOT NULL;