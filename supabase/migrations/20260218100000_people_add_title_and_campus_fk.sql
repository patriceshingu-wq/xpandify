-- Migration: Add title field and change campus to campus_id FK for people table
-- Date: 2026-02-18
-- Purpose:
--   1. Add 'title' field for job title/position (e.g., 'Worship Pastor')
--   2. Add 'campus_id' FK to campuses table for proper relational data
--   3. Migrate existing 'campus' text data to campus_id where possible
--   4. Keep 'campus' temporarily for backward compatibility, then drop

-- Step 1: Add the new columns
ALTER TABLE public.people
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS campus_id uuid REFERENCES public.campuses(id);

-- Step 2: Create index for campus_id lookups
CREATE INDEX IF NOT EXISTS idx_people_campus_id ON public.people(campus_id);

-- Step 3: Migrate existing campus text values to campus_id
-- Match by campus name (case-insensitive)
UPDATE public.people p
SET campus_id = c.id
FROM public.campuses c
WHERE p.campus IS NOT NULL
  AND p.campus_id IS NULL
  AND LOWER(TRIM(p.campus)) = LOWER(TRIM(c.name));

-- Step 4: Also try matching by campus code
UPDATE public.people p
SET campus_id = c.id
FROM public.campuses c
WHERE p.campus IS NOT NULL
  AND p.campus_id IS NULL
  AND LOWER(TRIM(p.campus)) = LOWER(TRIM(c.code));

-- Step 5: Drop the old campus text column (data migrated to campus_id)
ALTER TABLE public.people DROP COLUMN IF EXISTS campus;

-- Step 6: Add comment for documentation
COMMENT ON COLUMN public.people.title IS 'Job title or position (e.g., Worship Pastor, Youth Coordinator)';
COMMENT ON COLUMN public.people.campus_id IS 'FK to campuses table - which campus this person belongs to';

-- Step 7: Grant appropriate permissions (RLS handles row-level access)
-- No additional grants needed as RLS policies already cover people table
