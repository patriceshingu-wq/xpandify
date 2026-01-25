-- Add new enum for agenda section types
CREATE TYPE public.agenda_section_type AS ENUM (
  'spiritual_life',
  'personal_family', 
  'ministry_updates',
  'goals_review',
  'development_training',
  'feedback_coaching',
  'other'
);

-- Add new fields to meetings table
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS spiritual_focus boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS person_focus_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS recurrence_pattern text;

-- Add new fields to meeting_agenda_items table
ALTER TABLE public.meeting_agenda_items
ADD COLUMN IF NOT EXISTS section_type public.agenda_section_type DEFAULT 'other',
ADD COLUMN IF NOT EXISTS linked_goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS linked_pdp_item_id uuid REFERENCES public.pdp_items(id) ON DELETE SET NULL;

-- Create meeting_templates table (admin-editable)
CREATE TABLE public.meeting_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_fr text,
  description_en text,
  description_fr text,
  meeting_type public.meeting_type NOT NULL DEFAULT 'one_on_one',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meeting_template_items table
CREATE TABLE public.meeting_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.meeting_templates(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  section_type public.agenda_section_type NOT NULL DEFAULT 'other',
  topic_en text NOT NULL,
  topic_fr text,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_template_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_templates
CREATE POLICY "Admins can manage templates"
ON public.meeting_templates FOR ALL
TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Authenticated users can view active templates"
ON public.meeting_templates FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS policies for meeting_template_items
CREATE POLICY "Admins can manage template items"
ON public.meeting_template_items FOR ALL
TO authenticated
USING (public.is_admin_or_super(auth.uid()))
WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Authenticated users can view template items"
ON public.meeting_template_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.meeting_templates mt 
  WHERE mt.id = template_id AND mt.is_active = true
));

-- Update meeting_agenda_items policies to allow participants to add items
DROP POLICY IF EXISTS "Users can view agenda for their meetings" ON public.meeting_agenda_items;

CREATE POLICY "Users can view agenda for their meetings"
ON public.meeting_agenda_items FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = meeting_agenda_items.meeting_id AND mp.person_id = public.get_person_id_for_user(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_agenda_items.meeting_id AND m.organizer_id = public.get_person_id_for_user(auth.uid()))
);

-- Allow participants to insert agenda items
CREATE POLICY "Participants can add agenda items"
ON public.meeting_agenda_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = meeting_agenda_items.meeting_id AND mp.person_id = public.get_person_id_for_user(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_agenda_items.meeting_id AND m.organizer_id = public.get_person_id_for_user(auth.uid()))
);

-- Allow participants to update agenda items
CREATE POLICY "Participants can update agenda items"
ON public.meeting_agenda_items FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.meeting_participants mp WHERE mp.meeting_id = meeting_agenda_items.meeting_id AND mp.person_id = public.get_person_id_for_user(auth.uid()))
  OR EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_agenda_items.meeting_id AND m.organizer_id = public.get_person_id_for_user(auth.uid()))
);

-- Update timestamp trigger for meeting_templates
CREATE TRIGGER update_meeting_templates_updated_at
BEFORE UPDATE ON public.meeting_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default 1:1 template
INSERT INTO public.meeting_templates (name_en, name_fr, description_en, description_fr, meeting_type, is_default)
VALUES (
  'Standard 1:1 Meeting',
  'Réunion 1:1 standard',
  'A comprehensive template for pastor/supervisor 1:1 meetings covering spiritual, personal, ministry, and development topics.',
  'Un modèle complet pour les réunions 1:1 pasteur/superviseur couvrant les sujets spirituels, personnels, ministériels et de développement.',
  'one_on_one',
  true
);

-- Insert template items for the default template
INSERT INTO public.meeting_template_items (template_id, order_index, section_type, topic_en, topic_fr, is_required)
SELECT 
  mt.id,
  items.order_index,
  items.section_type::public.agenda_section_type,
  items.topic_en,
  items.topic_fr,
  items.is_required
FROM public.meeting_templates mt,
(VALUES
  (1, 'spiritual_life', 'How is your walk with the Lord?', 'Comment va ta marche avec le Seigneur?', true),
  (2, 'spiritual_life', 'What has God been speaking to you recently?', 'Qu''est-ce que Dieu t''a dit récemment?', false),
  (3, 'personal_family', 'How is your family? Any pressures or needs I should know about?', 'Comment va ta famille? Des pressions ou besoins dont je devrais être au courant?', true),
  (4, 'ministry_updates', 'What is going well in your ministry area?', 'Qu''est-ce qui va bien dans ton domaine de ministère?', true),
  (5, 'ministry_updates', 'What challenges are you facing?', 'Quels défis rencontres-tu?', true),
  (6, 'goals_review', 'Review of current goals progress', 'Révision de la progression des objectifs actuels', true),
  (7, 'development_training', 'How are you progressing on your development plan and courses?', 'Comment progresses-tu sur ton plan de développement et tes formations?', true),
  (8, 'feedback_coaching', 'What feedback do you have for me?', 'Quels retours as-tu pour moi?', true),
  (9, 'feedback_coaching', 'Where do you need more support or clarity?', 'Où as-tu besoin de plus de soutien ou de clarté?', false)
) AS items(order_index, section_type, topic_en, topic_fr, is_required)
WHERE mt.is_default = true;