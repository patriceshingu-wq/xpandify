-- Fix the buggy policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view meetings they participate in" ON public.meetings;

CREATE POLICY "Users can view meetings they participate in"
ON public.meetings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM meeting_participants mp
    WHERE mp.meeting_id = meetings.id
      AND mp.person_id = get_person_id_for_user(auth.uid())
  )
);

-- Fix Supervisors can manage meetings - add WITH CHECK for INSERT
DROP POLICY IF EXISTS "Supervisors can manage meetings" ON public.meetings;

CREATE POLICY "Supervisors can manage meetings"
ON public.meetings
FOR ALL
TO authenticated
USING (has_app_role(auth.uid(), 'pastor_supervisor'::app_role_type) AND (organizer_id = get_person_id_for_user(auth.uid())))
WITH CHECK (has_app_role(auth.uid(), 'pastor_supervisor'::app_role_type) AND (organizer_id = get_person_id_for_user(auth.uid())));

-- Fix Admins can manage meetings - add WITH CHECK for INSERT
DROP POLICY IF EXISTS "Admins can manage meetings" ON public.meetings;

CREATE POLICY "Admins can manage meetings"
ON public.meetings
FOR ALL
TO authenticated
USING (is_admin_or_super(auth.uid()))
WITH CHECK (is_admin_or_super(auth.uid()));

-- Fix Organizers can manage participants - add WITH CHECK
DROP POLICY IF EXISTS "Organizers can manage participants" ON public.meeting_participants;

CREATE POLICY "Organizers can manage participants"
ON public.meeting_participants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_participants.meeting_id
      AND m.organizer_id = get_person_id_for_user(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_participants.meeting_id
      AND m.organizer_id = get_person_id_for_user(auth.uid())
  )
);

-- Fix Admins can manage participants - add WITH CHECK
DROP POLICY IF EXISTS "Admins can manage participants" ON public.meeting_participants;

CREATE POLICY "Admins can manage participants"
ON public.meeting_participants
FOR ALL
TO authenticated
USING (is_admin_or_super(auth.uid()))
WITH CHECK (is_admin_or_super(auth.uid()));