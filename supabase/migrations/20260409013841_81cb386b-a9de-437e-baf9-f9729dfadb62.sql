
-- Task 8: Add created_by_id to meeting_agenda_items
ALTER TABLE public.meeting_agenda_items 
ADD COLUMN IF NOT EXISTS created_by_id uuid REFERENCES public.people(id);

-- Task 9: Create event_role_requirements table
CREATE TABLE IF NOT EXISTS public.event_role_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  quantity_needed integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_role_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view event role requirements"
  ON public.event_role_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage event role requirements"
  ON public.event_role_requirements FOR ALL
  USING (is_admin_or_super(auth.uid()))
  WITH CHECK (is_admin_or_super(auth.uid()));

CREATE POLICY "Ministry leaders can manage event role requirements"
  ON public.event_role_requirements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_role_requirements.event_id
      AND is_ministry_leader(auth.uid(), e.ministry_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_role_requirements.event_id
      AND is_ministry_leader(auth.uid(), e.ministry_id)
  ));

CREATE POLICY "Organizers can manage event role requirements"
  ON public.event_role_requirements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_role_requirements.event_id
      AND e.organizer_id = get_person_id_for_user(auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_role_requirements.event_id
      AND e.organizer_id = get_person_id_for_user(auth.uid())
  ));

-- Trigger for updated_at
CREATE TRIGGER update_event_role_requirements_updated_at
  BEFORE UPDATE ON public.event_role_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
