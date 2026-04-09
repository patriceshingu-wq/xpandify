
ALTER TABLE public.performance_reviews 
  ADD COLUMN IF NOT EXISTS self_overall_rating integer,
  ADD COLUMN IF NOT EXISTS self_spiritual_health_rating integer,
  ADD COLUMN IF NOT EXISTS self_ministry_effectiveness_rating integer,
  ADD COLUMN IF NOT EXISTS self_character_rating integer,
  ADD COLUMN IF NOT EXISTS self_skills_rating integer,
  ADD COLUMN IF NOT EXISTS self_summary_en text,
  ADD COLUMN IF NOT EXISTS self_summary_fr text,
  ADD COLUMN IF NOT EXISTS self_submitted_at timestamp with time zone;
