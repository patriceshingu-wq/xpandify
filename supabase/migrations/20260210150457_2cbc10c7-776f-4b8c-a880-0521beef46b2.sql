-- Allow ministry leaders to manage members of their ministry
CREATE POLICY "Ministry leaders can manage their ministry members"
ON public.people_ministries
FOR ALL
USING (
  public.is_ministry_leader(auth.uid(), ministry_id)
)
WITH CHECK (
  public.is_ministry_leader(auth.uid(), ministry_id)
);