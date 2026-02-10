
-- Add yearly theme fields to organization_settings
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS yearly_theme_en text,
  ADD COLUMN IF NOT EXISTS yearly_theme_fr text,
  ADD COLUMN IF NOT EXISTS yearly_vision_en text,
  ADD COLUMN IF NOT EXISTS yearly_vision_fr text,
  ADD COLUMN IF NOT EXISTS theme_year integer,
  ADD COLUMN IF NOT EXISTS theme_scripture text;
