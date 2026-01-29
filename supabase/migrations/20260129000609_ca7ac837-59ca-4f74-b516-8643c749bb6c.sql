-- Create enums for program language and event status
CREATE TYPE public.program_language AS ENUM ('EN', 'FR', 'Bilingual');
CREATE TYPE public.event_status AS ENUM ('Planned', 'Confirmed', 'Completed', 'Canceled');

-- Create quarters table
CREATE TABLE public.quarters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  quarter_number INTEGER NOT NULL CHECK (quarter_number >= 1 AND quarter_number <= 4),
  theme_en TEXT NOT NULL,
  theme_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (year, quarter_number)
);

-- Create activity_categories table
CREATE TABLE public.activity_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_fr TEXT,
  theme_en TEXT,
  theme_fr TEXT,
  primary_language program_language DEFAULT 'Bilingual',
  description_en TEXT,
  description_fr TEXT,
  quarter_id UUID REFERENCES public.quarters(id) ON DELETE SET NULL,
  primary_ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  title_en TEXT NOT NULL,
  title_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  quarter_id UUID REFERENCES public.quarters(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  activity_category_id UUID REFERENCES public.activity_categories(id) ON DELETE SET NULL,
  language program_language DEFAULT 'Bilingual',
  status event_status DEFAULT 'Planned',
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  notes_internal TEXT,
  related_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create event_roles table (who is assigned to each event)
CREATE TABLE public.event_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  from_country TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (event_id, person_id, role)
);

-- Create event_goals join table (many-to-many: events ↔ goals)
CREATE TABLE public.event_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (event_id, goal_id)
);

-- Create indexes for performance
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_quarter ON public.events(quarter_id);
CREATE INDEX idx_events_program ON public.events(program_id);
CREATE INDEX idx_events_ministry ON public.events(ministry_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_event_roles_event ON public.event_roles(event_id);
CREATE INDEX idx_event_roles_person ON public.event_roles(person_id);
CREATE INDEX idx_programs_quarter ON public.programs(quarter_id);

-- Enable RLS on all tables
ALTER TABLE public.quarters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_goals ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is ministry leader
CREATE OR REPLACE FUNCTION public.is_ministry_leader(check_user_id UUID, check_ministry_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ministries m
    WHERE m.id = check_ministry_id
      AND m.leader_id = public.get_person_id_for_user(check_user_id)
  )
$$;

-- RLS Policies for quarters (view: all authenticated, manage: admins)
CREATE POLICY "Authenticated users can view quarters"
  ON public.quarters FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quarters"
  ON public.quarters FOR ALL
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

-- RLS Policies for activity_categories (view: all authenticated, manage: admins)
CREATE POLICY "Authenticated users can view activity categories"
  ON public.activity_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage activity categories"
  ON public.activity_categories FOR ALL
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

-- RLS Policies for programs (view: all authenticated, manage: admins/ministry leaders)
CREATE POLICY "Authenticated users can view programs"
  ON public.programs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage programs"
  ON public.programs FOR ALL
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Ministry leaders can manage their programs"
  ON public.programs FOR ALL
  USING (public.is_ministry_leader(auth.uid(), primary_ministry_id))
  WITH CHECK (public.is_ministry_leader(auth.uid(), primary_ministry_id));

-- RLS Policies for events (view: all authenticated, manage: admins/ministry leaders)
CREATE POLICY "Authenticated users can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Ministry leaders can manage their events"
  ON public.events FOR ALL
  USING (public.is_ministry_leader(auth.uid(), ministry_id))
  WITH CHECK (public.is_ministry_leader(auth.uid(), ministry_id));

-- RLS Policies for event_roles (view: all authenticated, manage: admins/ministry leaders)
CREATE POLICY "Authenticated users can view event roles"
  ON public.event_roles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage event roles"
  ON public.event_roles FOR ALL
  USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Ministry leaders can manage event roles"
  ON public.event_roles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
      AND public.is_ministry_leader(auth.uid(), e.ministry_id)
  ));

-- RLS Policies for event_goals (view: all authenticated, manage: admins)
CREATE POLICY "Authenticated users can view event goals"
  ON public.event_goals FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage event goals"
  ON public.event_goals FOR ALL
  USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Ministry leaders can manage event goals"
  ON public.event_goals FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id
      AND public.is_ministry_leader(auth.uid(), e.ministry_id)
  ));

-- Add updated_at triggers
CREATE TRIGGER update_quarters_updated_at
  BEFORE UPDATE ON public.quarters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_categories_updated_at
  BEFORE UPDATE ON public.activity_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_roles_updated_at
  BEFORE UPDATE ON public.event_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();