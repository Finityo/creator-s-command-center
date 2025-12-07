-- Create notification_history table to track all sent notifications
CREATE TABLE public.notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.notification_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
ON public.notification_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
ON public.notification_history
FOR UPDATE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX idx_notification_history_created_at ON public.notification_history(created_at DESC);