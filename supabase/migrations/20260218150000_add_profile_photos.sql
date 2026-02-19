-- Add photo_url column to people table
ALTER TABLE people ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for profile photos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos

-- Anyone can view profile photos (public bucket)
CREATE POLICY "Public can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Users can upload their own profile photo
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own profile photo
CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile photo
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage any profile photo
CREATE POLICY "Admins can manage profile photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'profile-photos'
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN app_roles ar ON ur.role_id = ar.id
    WHERE ur.user_id = auth.uid()
    AND ar.name IN ('super_admin', 'admin')
  )
);
