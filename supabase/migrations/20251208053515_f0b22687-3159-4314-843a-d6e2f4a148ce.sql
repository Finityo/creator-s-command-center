-- Add external_post_id column to track platform-specific post IDs
ALTER TABLE public.scheduled_posts
ADD COLUMN external_post_id text;