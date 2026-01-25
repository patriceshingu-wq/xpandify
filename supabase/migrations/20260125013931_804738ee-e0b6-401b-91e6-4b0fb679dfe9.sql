-- Create a security definer function to check if a user participates in a meeting
-- This avoids the infinite recursion between meetings and meeting_participants RLS
CREATE OR REPLACE FUNCTION public.user_participates_in_meeting(check_user_id uuid, check_meeting_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.meeting_participants mp
    WHERE mp.meeting_id = check_meeting_id
      AND mp.person_id = public.get_person_id_for_user(check_user_id)
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view meetings they participate in" ON public.meetings;

-- Recreate using the security definer function
CREATE POLICY "Users can view meetings they participate in"
ON public.meetings
FOR SELECT
TO authenticated
USING (public.user_participates_in_meeting(auth.uid(), id));