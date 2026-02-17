-- Migration: Fix Events Schema Issues
-- 1. Add organizer_id (person who created/owns the event)
-- 2. Add campus_id (for multi-campus support)
-- 3. Drop unused recurrence_pattern column (recurrence_rule_id is the proper FK)

-- 1. Add organizer_id to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS organizer_id uuid REFERENCES public.people(id) ON DELETE SET NULL;

-- Create index for organizer lookups
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id) WHERE organizer_id IS NOT NULL;

-- 2. Add campus_id to events table for multi-campus support
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL;

-- Create index for campus filtering
CREATE INDEX IF NOT EXISTS idx_events_campus ON public.events(campus_id) WHERE campus_id IS NOT NULL;

-- 3. Drop unused recurrence_pattern column (replaced by recurrence_rule_id FK)
-- Note: This column was added but never used for events; recurrence_rule_id is the proper approach
ALTER TABLE public.events
  DROP COLUMN IF EXISTS recurrence_pattern;

-- Update RLS policies to allow ministry leaders to manage events they organize
CREATE POLICY "Organizers can manage their events"
  ON public.events FOR ALL
  USING (
    organizer_id IN (
      SELECT id FROM public.people WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM public.people WHERE user_id = auth.uid()
    )
  );
