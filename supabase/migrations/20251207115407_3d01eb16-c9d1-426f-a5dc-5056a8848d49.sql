-- Add approval workflow fields to scheduled_posts
ALTER TABLE public.scheduled_posts 
ADD COLUMN approval_status text CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')) DEFAULT 'not_required',
ADD COLUMN approved_by uuid,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Create index for approval queue
CREATE INDEX idx_scheduled_posts_approval ON public.scheduled_posts(user_id, approval_status) WHERE approval_status = 'pending';