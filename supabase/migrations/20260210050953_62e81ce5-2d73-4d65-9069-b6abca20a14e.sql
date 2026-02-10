-- Add end_date column for multi-day events
ALTER TABLE public.events ADD COLUMN end_date date NULL;

-- Set end_date = date for existing events (single-day default)
UPDATE public.events SET end_date = date WHERE end_date IS NULL;
