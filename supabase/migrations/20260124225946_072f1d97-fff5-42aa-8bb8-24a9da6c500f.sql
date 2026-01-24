-- Fix RLS on app_roles table (read-only for authenticated users)
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view app roles" ON public.app_roles 
  FOR SELECT TO authenticated USING (true);

-- Fix search_path on functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;