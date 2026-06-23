-- Storage bucket policies for public read access
-- Run this in Supabase SQL Editor

-- Allow public read for story-media bucket
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES 
  ('public_read_story_media', 'story-media', 'SELECT', 'true'),
  ('public_read_audio_tracks', 'audio-tracks', 'SELECT', 'true'),
  ('public_read_documents', 'documents', 'SELECT', 'true')
ON CONFLICT DO NOTHING;

-- Allow service role to upload to all buckets
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES
  ('service_upload_story_media', 'story-media', 'INSERT', 'auth.role() = ''service_role'''),
  ('service_upload_audio_tracks', 'audio-tracks', 'INSERT', 'auth.role() = ''service_role'''),
  ('service_upload_documents', 'documents', 'INSERT', 'auth.role() = ''service_role'''),
  ('service_delete_story_media', 'story-media', 'DELETE', 'auth.role() = ''service_role'''),
  ('service_delete_audio_tracks', 'audio-tracks', 'DELETE', 'auth.role() = ''service_role'''),
  ('service_delete_documents', 'documents', 'DELETE', 'auth.role() = ''service_role''')
ON CONFLICT DO NOTHING;
