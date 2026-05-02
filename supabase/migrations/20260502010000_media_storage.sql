-- Create storage buckets for media uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('social-media', 'social-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('story-media', 'story-media', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Row Level Security policies for storage buckets
-- Public read access for social media bucket
CREATE POLICY "Public read access for social media" ON storage.objects
FOR SELECT USING (bucket_id = 'social-media');

-- Users can only upload their own files
CREATE POLICY "Users can upload to social media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'social-media' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Users can only update their own files
CREATE POLICY "Users can update their own social media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'social-media' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Users can only delete their own files
CREATE POLICY "Users can delete their own social media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'social-media' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Public read access for avatars bucket
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Users can update their own avatar
CREATE POLICY "Users can update their avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Stories bucket - users can only read stories they have access to
CREATE POLICY "Users can read stories" ON storage.objects
FOR SELECT USING (
  bucket_id = 'story-media' AND 
  (
    -- Users can read their own stories
    (storage.foldername(name))[1] = auth.uid() OR
    -- Users can read stories from people they follow (would need to check follows table)
    -- For now, allow authenticated users to read all stories
    auth.role() = 'authenticated'
  )
);

-- Users can upload their own stories
CREATE POLICY "Users can upload stories" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'story-media' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Users can update their own stories
CREATE POLICY "Users can update their stories" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'story-media' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Users can delete their own stories
CREATE POLICY "Users can delete their stories" ON storage.objects
FOR DELETE USING (
  bucket_id = 'story-media' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()
);

-- Create function to generate storage path for user uploads
CREATE OR REPLACE FUNCTION generate_storage_path(user_id uuid, file_name text, bucket_name text)
RETURNS text AS $$
BEGIN
  RETURN bucket_name || '/' || user_id || '/' || file_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old story media (stories older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_story_media()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'story-media' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically clean up old story media
-- This would typically be run by a cron job, but we can create a function for it
CREATE OR REPLACE FUNCTION auto_cleanup_stories()
RETURNS trigger AS $$
BEGIN
  -- This function can be called by a scheduled job
  PERFORM cleanup_old_story_media();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
