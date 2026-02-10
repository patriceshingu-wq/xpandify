-- Add 'Postponed' to event_status enum
ALTER TYPE public.event_status ADD VALUE IF NOT EXISTS 'Postponed';

-- Add recurrence_pattern column if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'recurrence_pattern') THEN
    ALTER TABLE public.events ADD COLUMN recurrence_pattern text DEFAULT NULL;
  END IF;
END $$;
