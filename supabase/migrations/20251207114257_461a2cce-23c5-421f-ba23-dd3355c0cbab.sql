-- Add queue_order column to scheduled_posts for prioritization
ALTER TABLE public.scheduled_posts 
ADD COLUMN queue_order integer DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX idx_scheduled_posts_queue_order ON public.scheduled_posts(user_id, queue_order);
