-- Create organization_settings table (singleton pattern - only one row)
CREATE TABLE public.organization_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic info
  organization_name text NOT NULL DEFAULT 'My Organization',
  organization_logo_url text,
  address_line1 text,
  address_line2 text,
  city text,
  state_province text,
  postal_code text,
  country text DEFAULT 'Canada',
  phone text,
  email text,
  website text,
  
  -- Email preferences
  email_sender_name text DEFAULT 'Expandify',
  email_sender_address text,
  email_reply_to text,
  email_footer_text text,
  
  -- Branding/theme
  primary_color text DEFAULT '#1e3a5f',
  secondary_color text DEFAULT '#6b7280',
  accent_color text DEFAULT '#f59e0b',
  font_family text DEFAULT 'Inter',
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view settings
CREATE POLICY "Authenticated users can view organization settings"
ON public.organization_settings
FOR SELECT
TO authenticated
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update organization settings"
ON public.organization_settings
FOR UPDATE
TO authenticated
USING (is_admin_or_super(auth.uid()))
WITH CHECK (is_admin_or_super(auth.uid()));

-- Only admins can insert (for initial setup)
CREATE POLICY "Admins can insert organization settings"
ON public.organization_settings
FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_super(auth.uid()));

-- Create campuses table
CREATE TABLE public.campuses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE,
  address_line1 text,
  address_line2 text,
  city text,
  state_province text,
  postal_code text,
  country text DEFAULT 'Canada',
  phone text,
  email text,
  is_main_campus boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on campuses
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view campuses
CREATE POLICY "Authenticated users can view campuses"
ON public.campuses
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage campuses
CREATE POLICY "Admins can manage campuses"
ON public.campuses
FOR ALL
TO authenticated
USING (is_admin_or_super(auth.uid()))
WITH CHECK (is_admin_or_super(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campuses_updated_at
  BEFORE UPDATE ON public.campuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default organization settings row
INSERT INTO public.organization_settings (organization_name) VALUES ('Expandify Church');