ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS feature_courses boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_pathways boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_mentorship boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_reviews boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_surveys boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_analytics boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_recurring_meetings boolean DEFAULT false;