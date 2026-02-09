
-- Phase 3: Migrate PDP Items into Goals module
-- Add pdp_id and item_type columns to goals table

ALTER TABLE public.goals 
ADD COLUMN pdp_id UUID REFERENCES public.personal_development_plans(id) ON DELETE CASCADE,
ADD COLUMN item_type TEXT CHECK (item_type IN ('course', 'mentoring', 'project', 'reading', 'other'));

-- Create index for efficient PDP-filtered queries
CREATE INDEX idx_goals_pdp_id ON public.goals(pdp_id) WHERE pdp_id IS NOT NULL;

-- Migrate existing pdp_items data into goals table
INSERT INTO public.goals (
  title_en, title_fr, description_en, description_fr, 
  due_date, status, goal_level, 
  owner_person_id, pdp_id, item_type,
  year, created_at, updated_at
)
SELECT 
  pi.title_en,
  pi.title_fr,
  pi.description_en,
  pi.description_fr,
  pi.due_date,
  CASE 
    WHEN pi.status = 'cancelled' THEN 'cancelled'::goal_status
    ELSE pi.status::text::goal_status 
  END,
  'individual'::goal_level,
  pdp.person_id,
  pi.pdp_id,
  pi.item_type::text,
  EXTRACT(YEAR FROM COALESCE(pi.due_date::date, pi.created_at::date, NOW()))::int,
  pi.created_at,
  pi.updated_at
FROM public.pdp_items pi
JOIN public.personal_development_plans pdp ON pdp.id = pi.pdp_id;

-- Update meeting_agenda_items: migrate linked_pdp_item_id references to linked_goal_id
-- For items that reference pdp_items, find the corresponding newly-created goal
UPDATE public.meeting_agenda_items mai
SET linked_goal_id = g.id,
    linked_pdp_item_id = NULL
FROM public.pdp_items pi
JOIN public.goals g ON g.pdp_id = pi.pdp_id AND g.title_en = pi.title_en AND g.item_type = pi.item_type::text
WHERE mai.linked_pdp_item_id = pi.id
  AND mai.linked_goal_id IS NULL;
