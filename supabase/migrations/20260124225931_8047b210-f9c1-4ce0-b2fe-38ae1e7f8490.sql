-- =============================================
-- EXPANDIFY DATABASE SCHEMA
-- Church Staff & Volunteer Management System
-- =============================================

-- 1. ENUMS
-- =============================================

CREATE TYPE public.language_code AS ENUM ('en', 'fr');
CREATE TYPE public.person_type AS ENUM ('staff', 'volunteer', 'congregant');
CREATE TYPE public.person_status AS ENUM ('active', 'inactive', 'on_leave');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE public.role_category AS ENUM ('pastoral', 'worship', 'children', 'youth', 'media', 'admin', 'other');
CREATE TYPE public.goal_level AS ENUM ('church', 'ministry', 'department', 'individual');
CREATE TYPE public.goal_status AS ENUM ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE public.goal_category AS ENUM ('discipleship', 'evangelism', 'operations', 'finance', 'training', 'other');
CREATE TYPE public.meeting_type AS ENUM ('one_on_one', 'team', 'ministry', 'board', 'other');
CREATE TYPE public.action_status AS ENUM ('open', 'in_progress', 'done', 'cancelled');
CREATE TYPE public.pdp_status AS ENUM ('active', 'completed', 'on_hold');
CREATE TYPE public.pdp_item_type AS ENUM ('course', 'mentoring', 'project', 'reading', 'other');
CREATE TYPE public.pdp_item_status AS ENUM ('not_started', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.course_category AS ENUM ('theology', 'character', 'pastoral_skills', 'ministry_skills', 'leadership', 'other');
CREATE TYPE public.delivery_type AS ENUM ('in_person', 'online', 'hybrid', 'reading_plan');
CREATE TYPE public.assignment_status AS ENUM ('not_started', 'in_progress', 'completed', 'dropped');
CREATE TYPE public.feedback_type AS ENUM ('encouragement', 'coaching', 'concern');
CREATE TYPE public.pulse_target AS ENUM ('all_staff', 'all_volunteers', 'custom');
CREATE TYPE public.app_role_type AS ENUM ('super_admin', 'admin', 'pastor_supervisor', 'staff', 'volunteer');

-- 2. PROFILES TABLE (linked to auth.users)
-- =============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  primary_language language_code DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. APP ROLES TABLE (for RBAC)
-- =============================================

CREATE TABLE public.app_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name app_role_type UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default roles
INSERT INTO public.app_roles (name, description) VALUES
  ('super_admin', 'Full system access including user management'),
  ('admin', 'Full CRUD on all entities except super admin functions'),
  ('pastor_supervisor', 'Manage supervised people and ministries'),
  ('staff', 'View and manage own data'),
  ('volunteer', 'View own data with limited updates');

-- 4. USER ROLES TABLE (junction table)
-- =============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.app_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. MINISTRIES TABLE
-- =============================================

CREATE TABLE public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  leader_id UUID,
  parent_ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;

-- 6. MINISTRY ROLES TABLE
-- =============================================

CREATE TABLE public.ministry_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  category role_category DEFAULT 'other',
  is_staff_role BOOLEAN DEFAULT false,
  is_volunteer_role BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ministry_roles ENABLE ROW LEVEL SECURITY;

-- 7. PEOPLE TABLE
-- =============================================

CREATE TABLE public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  preferred_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender gender_type,
  primary_language language_code DEFAULT 'en',
  other_languages language_code[] DEFAULT '{}',
  person_type person_type DEFAULT 'congregant',
  status person_status DEFAULT 'active',
  supervisor_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  campus TEXT,
  notes TEXT,
  calling_description TEXT,
  strengths TEXT,
  growth_areas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- Add foreign key for ministry leader after people table exists
ALTER TABLE public.ministries ADD CONSTRAINT fk_ministries_leader FOREIGN KEY (leader_id) REFERENCES public.people(id) ON DELETE SET NULL;

-- 8. PEOPLE-MINISTRIES JUNCTION TABLE
-- =============================================

CREATE TABLE public.people_ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  ministry_id UUID NOT NULL REFERENCES public.ministries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (person_id, ministry_id)
);

ALTER TABLE public.people_ministries ENABLE ROW LEVEL SECURITY;

-- 9. PEOPLE-ROLES JUNCTION TABLE
-- =============================================

CREATE TABLE public.people_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.ministry_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (person_id, role_id)
);

ALTER TABLE public.people_roles ENABLE ROW LEVEL SECURITY;

-- 10. GOALS TABLE
-- =============================================

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  goal_level goal_level NOT NULL,
  owner_ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  owner_person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  year INTEGER DEFAULT EXTRACT(YEAR FROM now()),
  start_date DATE,
  due_date DATE,
  status goal_status DEFAULT 'not_started',
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  category goal_category DEFAULT 'other',
  parent_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 11. MEETINGS TABLE
-- =============================================

CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type meeting_type DEFAULT 'team',
  title_en TEXT NOT NULL,
  title_fr TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  organizer_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  ministry_id UUID REFERENCES public.ministries(id) ON DELETE SET NULL,
  recurring_series_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- 12. MEETING PARTICIPANTS JUNCTION TABLE
-- =============================================

CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (meeting_id, person_id)
);

ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- 13. MEETING AGENDA ITEMS TABLE
-- =============================================

CREATE TABLE public.meeting_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  topic_en TEXT NOT NULL,
  topic_fr TEXT,
  discussion_notes TEXT,
  action_required BOOLEAN DEFAULT false,
  action_owner_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  action_due_date DATE,
  action_status action_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meeting_agenda_items ENABLE ROW LEVEL SECURITY;

-- 14. PERSONAL DEVELOPMENT PLANS TABLE
-- =============================================

CREATE TABLE public.personal_development_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  plan_title_en TEXT NOT NULL,
  plan_title_fr TEXT,
  summary_en TEXT,
  summary_fr TEXT,
  start_date DATE,
  target_date DATE,
  status pdp_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.personal_development_plans ENABLE ROW LEVEL SECURITY;

-- 15. PDP ITEMS TABLE
-- =============================================

CREATE TABLE public.pdp_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdp_id UUID NOT NULL REFERENCES public.personal_development_plans(id) ON DELETE CASCADE,
  item_type pdp_item_type DEFAULT 'other',
  title_en TEXT NOT NULL,
  title_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  status pdp_item_status DEFAULT 'not_started',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pdp_items ENABLE ROW LEVEL SECURITY;

-- 16. COURSES TABLE
-- =============================================

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  title_en TEXT NOT NULL,
  title_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  category course_category DEFAULT 'other',
  delivery_type delivery_type DEFAULT 'in_person',
  estimated_duration_hours INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 17. COURSE ASSIGNMENTS TABLE
-- =============================================

CREATE TABLE public.course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_by_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  assigned_date DATE DEFAULT CURRENT_DATE,
  status assignment_status DEFAULT 'not_started',
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;

-- 18. FEEDBACK TABLE
-- =============================================

CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  given_by_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  feedback_type feedback_type DEFAULT 'encouragement',
  title_en TEXT,
  title_fr TEXT,
  content_en TEXT,
  content_fr TEXT,
  visible_to_person BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 19. PERFORMANCE REVIEWS TABLE
-- =============================================

CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  period_label TEXT,
  start_period_date DATE,
  end_period_date DATE,
  summary_en TEXT,
  summary_fr TEXT,
  spiritual_health_rating INTEGER CHECK (spiritual_health_rating >= 1 AND spiritual_health_rating <= 5),
  ministry_effectiveness_rating INTEGER CHECK (ministry_effectiveness_rating >= 1 AND ministry_effectiveness_rating <= 5),
  character_rating INTEGER CHECK (character_rating >= 1 AND character_rating <= 5),
  skills_rating INTEGER CHECK (skills_rating >= 1 AND skills_rating <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  submitted_at TIMESTAMPTZ,
  finalized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- 20. REVIEW GOAL SNAPSHOTS TABLE
-- =============================================

CREATE TABLE public.review_goal_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_review_id UUID NOT NULL REFERENCES public.performance_reviews(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  comment_en TEXT,
  comment_fr TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.review_goal_snapshots ENABLE ROW LEVEL SECURITY;

-- 21. PULSE SURVEYS TABLE
-- =============================================

CREATE TABLE public.pulse_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_group pulse_target DEFAULT 'all_staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pulse_surveys ENABLE ROW LEVEL SECURITY;

-- 22. PULSE RESPONSES TABLE
-- =============================================

CREATE TABLE public.pulse_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_survey_id UUID NOT NULL REFERENCES public.pulse_surveys(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pulse_responses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS FOR RBAC
-- =============================================

-- Function to check if user has a specific app role
CREATE OR REPLACE FUNCTION public.has_app_role(check_user_id UUID, check_role app_role_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.app_roles ar ON ur.role_id = ar.id
    WHERE ur.user_id = check_user_id
      AND ar.name = check_role
  )
$$;

-- Function to get user's person_id
CREATE OR REPLACE FUNCTION public.get_person_id_for_user(check_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.people WHERE user_id = check_user_id LIMIT 1
$$;

-- Function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_app_role(check_user_id, 'super_admin') OR public.has_app_role(check_user_id, 'admin')
$$;

-- Function to check if user supervises a person
CREATE OR REPLACE FUNCTION public.supervises_person(supervisor_user_id UUID, person_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.people p
    WHERE p.id = person_id
      AND p.supervisor_id = public.get_person_id_for_user(supervisor_user_id)
  )
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- USER ROLES POLICIES
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- MINISTRIES POLICIES
CREATE POLICY "Authenticated users can view ministries" ON public.ministries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ministries" ON public.ministries FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- MINISTRY ROLES POLICIES
CREATE POLICY "Authenticated users can view ministry roles" ON public.ministry_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage ministry roles" ON public.ministry_roles FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- PEOPLE POLICIES
CREATE POLICY "Users can view their own person record" ON public.people FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all people" ON public.people FOR SELECT USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Supervisors can view supervised people" ON public.people FOR SELECT USING (public.supervises_person(auth.uid(), id));
CREATE POLICY "Admins can manage all people" ON public.people FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Users can update their own profile fields" ON public.people FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Pastor supervisors can view ministry members" ON public.people FOR SELECT 
  USING (
    public.has_app_role(auth.uid(), 'pastor_supervisor') 
    AND EXISTS (
      SELECT 1 FROM public.people_ministries pm
      JOIN public.ministries m ON pm.ministry_id = m.id
      WHERE pm.person_id = public.people.id
        AND m.leader_id = public.get_person_id_for_user(auth.uid())
    )
  );

-- PEOPLE_MINISTRIES POLICIES
CREATE POLICY "Authenticated users can view people ministries" ON public.people_ministries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage people ministries" ON public.people_ministries FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- PEOPLE_ROLES POLICIES
CREATE POLICY "Authenticated users can view people roles" ON public.people_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage people roles" ON public.people_roles FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- GOALS POLICIES
CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING (owner_person_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Admins can view all goals" ON public.goals FOR SELECT USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins can manage all goals" ON public.goals FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING (owner_person_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Supervisors can view supervised people goals" ON public.goals FOR SELECT 
  USING (public.supervises_person(auth.uid(), owner_person_id));
CREATE POLICY "Supervisors can manage supervised people goals" ON public.goals FOR ALL 
  USING (
    public.has_app_role(auth.uid(), 'pastor_supervisor') 
    AND public.supervises_person(auth.uid(), owner_person_id)
  );

-- MEETINGS POLICIES
CREATE POLICY "Users can view meetings they organize" ON public.meetings FOR SELECT 
  USING (organizer_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Users can view meetings they participate in" ON public.meetings FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_participants mp 
      WHERE mp.meeting_id = id 
        AND mp.person_id = public.get_person_id_for_user(auth.uid())
    )
  );
CREATE POLICY "Admins can view all meetings" ON public.meetings FOR SELECT USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins can manage meetings" ON public.meetings FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Supervisors can manage meetings" ON public.meetings FOR ALL 
  USING (
    public.has_app_role(auth.uid(), 'pastor_supervisor') 
    AND organizer_id = public.get_person_id_for_user(auth.uid())
  );

-- MEETING PARTICIPANTS POLICIES
CREATE POLICY "Users can view their participation" ON public.meeting_participants FOR SELECT 
  USING (person_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Admins can manage participants" ON public.meeting_participants FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Organizers can manage participants" ON public.meeting_participants FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m 
      WHERE m.id = meeting_id 
        AND m.organizer_id = public.get_person_id_for_user(auth.uid())
    )
  );

-- MEETING AGENDA ITEMS POLICIES
CREATE POLICY "Users can view agenda for their meetings" ON public.meeting_agenda_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.meeting_participants mp 
      WHERE mp.meeting_id = meeting_agenda_items.meeting_id 
        AND mp.person_id = public.get_person_id_for_user(auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.meetings m 
      WHERE m.id = meeting_agenda_items.meeting_id 
        AND m.organizer_id = public.get_person_id_for_user(auth.uid())
    )
  );
CREATE POLICY "Admins can manage agenda items" ON public.meeting_agenda_items FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Action owners can update their items" ON public.meeting_agenda_items FOR UPDATE 
  USING (action_owner_id = public.get_person_id_for_user(auth.uid()));

-- PDP POLICIES
CREATE POLICY "Users can view their own PDPs" ON public.personal_development_plans FOR SELECT 
  USING (person_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Admins can view all PDPs" ON public.personal_development_plans FOR SELECT USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins can manage PDPs" ON public.personal_development_plans FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Supervisors can view supervised PDPs" ON public.personal_development_plans FOR SELECT 
  USING (public.supervises_person(auth.uid(), person_id));

-- PDP ITEMS POLICIES
CREATE POLICY "Users can view their own PDP items" ON public.pdp_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.personal_development_plans pdp 
      WHERE pdp.id = pdp_id 
        AND pdp.person_id = public.get_person_id_for_user(auth.uid())
    )
  );
CREATE POLICY "Admins can manage PDP items" ON public.pdp_items FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Users can update their own PDP items" ON public.pdp_items FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.personal_development_plans pdp 
      WHERE pdp.id = pdp_id 
        AND pdp.person_id = public.get_person_id_for_user(auth.uid())
    )
  );

-- COURSES POLICIES
CREATE POLICY "Authenticated users can view active courses" ON public.courses FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can view all courses" ON public.courses FOR SELECT USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- COURSE ASSIGNMENTS POLICIES
CREATE POLICY "Users can view their own assignments" ON public.course_assignments FOR SELECT 
  USING (person_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Users can update their own assignment status" ON public.course_assignments FOR UPDATE 
  USING (person_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Admins can manage assignments" ON public.course_assignments FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Supervisors can view supervised assignments" ON public.course_assignments FOR SELECT 
  USING (public.supervises_person(auth.uid(), person_id));

-- FEEDBACK POLICIES
CREATE POLICY "Users can view visible feedback about them" ON public.feedback FOR SELECT 
  USING (person_id = public.get_person_id_for_user(auth.uid()) AND visible_to_person = true);
CREATE POLICY "Users can view feedback they gave" ON public.feedback FOR SELECT 
  USING (given_by_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Authenticated users can create feedback" ON public.feedback FOR INSERT TO authenticated 
  WITH CHECK (given_by_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Admins can manage feedback" ON public.feedback FOR ALL USING (public.is_admin_or_super(auth.uid()));
CREATE POLICY "Supervisors can view supervised feedback" ON public.feedback FOR SELECT 
  USING (public.supervises_person(auth.uid(), person_id));

-- PERFORMANCE REVIEWS POLICIES
CREATE POLICY "Users can view their own reviews" ON public.performance_reviews FOR SELECT 
  USING (person_id = public.get_person_id_for_user(auth.uid()) AND finalized = true);
CREATE POLICY "Reviewers can view and manage their reviews" ON public.performance_reviews FOR ALL 
  USING (reviewer_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Admins can manage reviews" ON public.performance_reviews FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- REVIEW GOAL SNAPSHOTS POLICIES
CREATE POLICY "Users can view their review snapshots" ON public.review_goal_snapshots FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.performance_reviews pr 
      WHERE pr.id = performance_review_id 
        AND pr.person_id = public.get_person_id_for_user(auth.uid())
        AND pr.finalized = true
    )
  );
CREATE POLICY "Admins can manage snapshots" ON public.review_goal_snapshots FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- PULSE SURVEYS POLICIES
CREATE POLICY "Authenticated users can view active surveys" ON public.pulse_surveys FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage surveys" ON public.pulse_surveys FOR ALL USING (public.is_admin_or_super(auth.uid()));

-- PULSE RESPONSES POLICIES
CREATE POLICY "Users can view their own responses" ON public.pulse_responses FOR SELECT 
  USING (person_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Users can submit responses" ON public.pulse_responses FOR INSERT TO authenticated 
  WITH CHECK (person_id = public.get_person_id_for_user(auth.uid()));
CREATE POLICY "Admins can view all responses" ON public.pulse_responses FOR SELECT USING (public.is_admin_or_super(auth.uid()));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ministries_updated_at BEFORE UPDATE ON public.ministries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ministry_roles_updated_at BEFORE UPDATE ON public.ministry_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agenda_items_updated_at BEFORE UPDATE ON public.meeting_agenda_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pdp_updated_at BEFORE UPDATE ON public.personal_development_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pdp_items_updated_at BEFORE UPDATE ON public.pdp_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_course_assignments_updated_at BEFORE UPDATE ON public.course_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.pulse_surveys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PROFILE CREATION TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();