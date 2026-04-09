
-- Add onboarding_completed to people table
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Create event_rsvps table
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, person_id)
);

-- Create validation trigger for RSVP status
CREATE OR REPLACE FUNCTION public.validate_rsvp_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('attending', 'declined', 'maybe', 'pending') THEN
    RAISE EXCEPTION 'Invalid RSVP status: %. Must be attending, declined, maybe, or pending', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_rsvp_status_trigger
  BEFORE INSERT OR UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.validate_rsvp_status();

-- RLS for event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all RSVPs"
  ON public.event_rsvps FOR ALL
  USING (is_admin_or_super(auth.uid()))
  WITH CHECK (is_admin_or_super(auth.uid()));

CREATE POLICY "Authenticated users can view RSVPs"
  ON public.event_rsvps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own RSVP"
  ON public.event_rsvps FOR ALL
  TO authenticated
  USING (person_id = get_person_id_for_user(auth.uid()))
  WITH CHECK (person_id = get_person_id_for_user(auth.uid()));

CREATE POLICY "Organizers can manage event RSVPs"
  ON public.event_rsvps FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_rsvps.event_id
    AND e.organizer_id = get_person_id_for_user(auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_rsvps.event_id
    AND e.organizer_id = get_person_id_for_user(auth.uid())
  ));

-- Create event_attendance table
CREATE TABLE public.event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  checked_in_by UUID REFERENCES public.people(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, person_id)
);

-- RLS for event_attendance
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all attendance"
  ON public.event_attendance FOR ALL
  USING (is_admin_or_super(auth.uid()))
  WITH CHECK (is_admin_or_super(auth.uid()));

CREATE POLICY "Authenticated users can view attendance"
  ON public.event_attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can manage event attendance"
  ON public.event_attendance FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendance.event_id
    AND e.organizer_id = get_person_id_for_user(auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendance.event_id
    AND e.organizer_id = get_person_id_for_user(auth.uid())
  ));

CREATE POLICY "Ministry leaders can manage event attendance"
  ON public.event_attendance FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendance.event_id
    AND is_ministry_leader(auth.uid(), e.ministry_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendance.event_id
    AND is_ministry_leader(auth.uid(), e.ministry_id)
  ));

-- Trigger for updated_at on event_rsvps
CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
