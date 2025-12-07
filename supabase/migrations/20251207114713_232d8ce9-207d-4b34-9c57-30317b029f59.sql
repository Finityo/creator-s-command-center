-- Add recurrence fields to scheduled_posts
ALTER TABLE public.scheduled_posts 
ADD COLUMN recurrence_type text CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly')) DEFAULT 'none',
ADD COLUMN recurrence_end_date timestamp with time zone,
ADD COLUMN parent_post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE SET NULL;

-- Create index for recurring posts
CREATE INDEX idx_scheduled_posts_recurrence ON public.scheduled_posts(user_id, recurrence_type) WHERE recurrence_type != 'none';

-- Create post_analytics table for detailed per-post metrics
CREATE TABLE public.post_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  impressions integer DEFAULT 0,
  engagements integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  clicks integer DEFAULT 0,
  reach integer DEFAULT 0,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on post_analytics
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_analytics
CREATE POLICY "Users can view their own post analytics"
ON public.post_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own post analytics"
ON public.post_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_post_analytics_post_id ON public.post_analytics(post_id);
CREATE INDEX idx_post_analytics_user_id ON public.post_analytics(user_id, recorded_at DESC);