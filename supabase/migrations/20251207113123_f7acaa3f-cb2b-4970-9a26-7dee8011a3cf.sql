-- Create competitor_accounts table for tracking competitors
CREATE TABLE public.competitor_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, handle)
);

-- Enable RLS
ALTER TABLE public.competitor_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for competitor_accounts
CREATE POLICY "Users can view their own competitors"
ON public.competitor_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitors"
ON public.competitor_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitors"
ON public.competitor_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitors"
ON public.competitor_accounts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_competitor_accounts_updated_at
BEFORE UPDATE ON public.competitor_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create ab_tests table for A/B testing
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  variant_a_content TEXT NOT NULL,
  variant_b_content TEXT NOT NULL,
  variant_a_post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  variant_b_post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  winner TEXT CHECK (winner IN ('A', 'B', NULL)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

-- RLS policies for ab_tests
CREATE POLICY "Users can view their own ab tests"
ON public.ab_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ab tests"
ON public.ab_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ab tests"
ON public.ab_tests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ab tests"
ON public.ab_tests FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ab_tests_updated_at
BEFORE UPDATE ON public.ab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();