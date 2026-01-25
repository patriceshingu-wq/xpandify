-- Create junction table for survey role visibility
CREATE TABLE public.survey_visible_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.pulse_surveys(id) ON DELETE CASCADE NOT NULL,
  role_name app_role_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (survey_id, role_name)
);

-- Enable RLS
ALTER TABLE public.survey_visible_roles ENABLE ROW LEVEL SECURITY;

-- Admins can manage survey role visibility
CREATE POLICY "Admins can manage survey roles" ON public.survey_visible_roles
  FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

-- Users can view roles for surveys they can access (needed for UI)
CREATE POLICY "Users can view survey roles" ON public.survey_visible_roles
  FOR SELECT TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_survey_visible_roles_survey ON public.survey_visible_roles(survey_id);
CREATE INDEX idx_survey_visible_roles_role ON public.survey_visible_roles(role_name);

-- Create helper function to check survey access
CREATE OR REPLACE FUNCTION public.can_view_survey(check_user_id UUID, check_survey_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins can always view
    public.is_admin_or_super(check_user_id)
    OR
    -- No role restrictions = visible to all authenticated
    NOT EXISTS (
      SELECT 1 FROM public.survey_visible_roles 
      WHERE survey_id = check_survey_id
    )
    OR
    -- User has one of the required roles
    EXISTS (
      SELECT 1 
      FROM public.survey_visible_roles svr
      JOIN public.user_roles ur ON ur.role_id = (
        SELECT id FROM public.app_roles WHERE name = svr.role_name
      )
      WHERE svr.survey_id = check_survey_id
        AND ur.user_id = check_user_id
    )
$$;

-- Drop existing policy and create new role-aware policy
DROP POLICY IF EXISTS "Authenticated users can view active surveys" ON public.pulse_surveys;

CREATE POLICY "Users can view surveys they have access to" ON public.pulse_surveys
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND public.can_view_survey(auth.uid(), id)
  );

-- Update response submission policy to check survey visibility
DROP POLICY IF EXISTS "Users can submit responses" ON public.pulse_responses;

CREATE POLICY "Users can submit responses to accessible surveys" ON public.pulse_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    person_id = public.get_person_id_for_user(auth.uid())
    AND public.can_view_survey(auth.uid(), pulse_survey_id)
  );