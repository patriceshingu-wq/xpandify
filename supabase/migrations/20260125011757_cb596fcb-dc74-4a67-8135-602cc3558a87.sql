-- Drop the existing incomplete ALL policy
DROP POLICY IF EXISTS "Admins can manage all people" ON public.people;

-- Create proper INSERT policy for admins
CREATE POLICY "Admins can insert people" 
ON public.people 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin_or_super(auth.uid()));

-- Create proper UPDATE policy for admins  
CREATE POLICY "Admins can update all people"
ON public.people
FOR UPDATE
TO authenticated
USING (is_admin_or_super(auth.uid()))
WITH CHECK (is_admin_or_super(auth.uid()));

-- Create proper DELETE policy for admins
CREATE POLICY "Admins can delete people"
ON public.people
FOR DELETE
TO authenticated
USING (is_admin_or_super(auth.uid()));