-- Create pathways table (multi-course learning tracks)
CREATE TABLE public.pathways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  estimated_duration_weeks INTEGER DEFAULT 12,
  difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Junction table for pathway courses with ordering
CREATE TABLE public.pathway_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pathway_id UUID NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pathway_id, course_id)
);

-- Course progress tracking per person
CREATE TABLE public.course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  pathway_id UUID REFERENCES public.pathways(id) ON DELETE SET NULL,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(person_id, course_id, pathway_id)
);

-- Assessments (quizzes, reflections) for courses
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_fr TEXT,
  description_en TEXT,
  description_fr TEXT,
  assessment_type TEXT NOT NULL DEFAULT 'quiz' CHECK (assessment_type IN ('quiz', 'reflection', 'assignment', 'practical')),
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment results (individual submissions)
CREATE TABLE public.assessment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN DEFAULT false,
  attempt_number INTEGER DEFAULT 1,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  feedback_en TEXT,
  feedback_fr TEXT,
  answers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mentorship relationships
CREATE TABLE public.mentorship (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
  focus_area TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  meeting_frequency TEXT DEFAULT 'bi-weekly' CHECK (meeting_frequency IN ('weekly', 'bi-weekly', 'monthly')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mentor_id, mentee_id),
  CHECK (mentor_id != mentee_id)
);

-- Mentorship check-ins
CREATE TABLE public.mentorship_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_id UUID NOT NULL REFERENCES public.mentorship(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  discussion_notes TEXT,
  prayer_points TEXT,
  next_steps TEXT,
  action_items JSONB DEFAULT '[]',
  mentee_mood TEXT CHECK (mentee_mood IN ('struggling', 'okay', 'growing', 'thriving')),
  created_by_id UUID REFERENCES public.people(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pathways
CREATE POLICY "Authenticated users can view active pathways" ON public.pathways
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all pathways" ON public.pathways
  FOR SELECT USING (is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can manage pathways" ON public.pathways
  FOR ALL USING (is_admin_or_super(auth.uid())) WITH CHECK (is_admin_or_super(auth.uid()));

-- RLS Policies for pathway_courses
CREATE POLICY "Authenticated users can view pathway courses" ON public.pathway_courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage pathway courses" ON public.pathway_courses
  FOR ALL USING (is_admin_or_super(auth.uid())) WITH CHECK (is_admin_or_super(auth.uid()));

-- RLS Policies for course_progress
CREATE POLICY "Users can view their own progress" ON public.course_progress
  FOR SELECT USING (person_id = get_person_id_for_user(auth.uid()));

CREATE POLICY "Users can manage their own progress" ON public.course_progress
  FOR ALL USING (person_id = get_person_id_for_user(auth.uid())) 
  WITH CHECK (person_id = get_person_id_for_user(auth.uid()));

CREATE POLICY "Supervisors can view supervised progress" ON public.course_progress
  FOR SELECT USING (supervises_person(auth.uid(), person_id));

CREATE POLICY "Admins can manage all progress" ON public.course_progress
  FOR ALL USING (is_admin_or_super(auth.uid())) WITH CHECK (is_admin_or_super(auth.uid()));

-- RLS Policies for assessments
CREATE POLICY "Authenticated users can view active assessments" ON public.assessments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage assessments" ON public.assessments
  FOR ALL USING (is_admin_or_super(auth.uid())) WITH CHECK (is_admin_or_super(auth.uid()));

-- RLS Policies for assessment_results
CREATE POLICY "Users can view their own results" ON public.assessment_results
  FOR SELECT USING (person_id = get_person_id_for_user(auth.uid()));

CREATE POLICY "Users can submit their own results" ON public.assessment_results
  FOR INSERT WITH CHECK (person_id = get_person_id_for_user(auth.uid()));

CREATE POLICY "Supervisors can view supervised results" ON public.assessment_results
  FOR SELECT USING (supervises_person(auth.uid(), person_id));

CREATE POLICY "Admins can manage all results" ON public.assessment_results
  FOR ALL USING (is_admin_or_super(auth.uid())) WITH CHECK (is_admin_or_super(auth.uid()));

-- RLS Policies for mentorship
CREATE POLICY "Users can view their mentorships" ON public.mentorship
  FOR SELECT USING (
    mentor_id = get_person_id_for_user(auth.uid()) OR 
    mentee_id = get_person_id_for_user(auth.uid())
  );

CREATE POLICY "Mentors can update their mentorships" ON public.mentorship
  FOR UPDATE USING (mentor_id = get_person_id_for_user(auth.uid()));

CREATE POLICY "Admins can manage all mentorships" ON public.mentorship
  FOR ALL USING (is_admin_or_super(auth.uid())) WITH CHECK (is_admin_or_super(auth.uid()));

-- RLS Policies for mentorship_check_ins
CREATE POLICY "Participants can view their check-ins" ON public.mentorship_check_ins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mentorship m
      WHERE m.id = mentorship_check_ins.mentorship_id
      AND (m.mentor_id = get_person_id_for_user(auth.uid()) OR m.mentee_id = get_person_id_for_user(auth.uid()))
    )
  );

CREATE POLICY "Participants can create check-ins" ON public.mentorship_check_ins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mentorship m
      WHERE m.id = mentorship_check_ins.mentorship_id
      AND (m.mentor_id = get_person_id_for_user(auth.uid()) OR m.mentee_id = get_person_id_for_user(auth.uid()))
    )
  );

CREATE POLICY "Participants can update their check-ins" ON public.mentorship_check_ins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mentorship m
      WHERE m.id = mentorship_check_ins.mentorship_id
      AND (m.mentor_id = get_person_id_for_user(auth.uid()) OR m.mentee_id = get_person_id_for_user(auth.uid()))
    )
  );

CREATE POLICY "Admins can manage all check-ins" ON public.mentorship_check_ins
  FOR ALL USING (is_admin_or_super(auth.uid())) WITH CHECK (is_admin_or_super(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_pathway_courses_pathway ON public.pathway_courses(pathway_id);
CREATE INDEX idx_pathway_courses_course ON public.pathway_courses(course_id);
CREATE INDEX idx_course_progress_person ON public.course_progress(person_id);
CREATE INDEX idx_course_progress_course ON public.course_progress(course_id);
CREATE INDEX idx_assessments_course ON public.assessments(course_id);
CREATE INDEX idx_assessment_results_person ON public.assessment_results(person_id);
CREATE INDEX idx_assessment_results_assessment ON public.assessment_results(assessment_id);
CREATE INDEX idx_mentorship_mentor ON public.mentorship(mentor_id);
CREATE INDEX idx_mentorship_mentee ON public.mentorship(mentee_id);
CREATE INDEX idx_mentorship_check_ins_mentorship ON public.mentorship_check_ins(mentorship_id);

-- Add updated_at triggers
CREATE TRIGGER update_pathways_updated_at BEFORE UPDATE ON public.pathways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at BEFORE UPDATE ON public.course_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_updated_at BEFORE UPDATE ON public.mentorship
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_check_ins_updated_at BEFORE UPDATE ON public.mentorship_check_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();