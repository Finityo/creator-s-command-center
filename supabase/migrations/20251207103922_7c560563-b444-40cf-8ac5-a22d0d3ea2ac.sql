-- Create enum for platforms
CREATE TYPE public.platform AS ENUM ('X', 'INSTAGRAM', 'FACEBOOK', 'ONLYFANS');

-- Create enum for post status
CREATE TYPE public.post_status AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'FAILED');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  link_page_slug TEXT UNIQUE,
  link_page_bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create social_accounts table
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform public.platform NOT NULL,
  handle TEXT NOT NULL,
  external_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scheduled_posts table
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  platform public.platform NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status public.post_status NOT NULL DEFAULT 'DRAFT',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create analytics_snapshots table
CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform public.platform NOT NULL,
  account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  followers INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement DECIMAL(5,2) DEFAULT 0,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create link_items table for link-in-bio
CREATE TABLE public.link_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Public access to profiles for link pages (by slug only)
CREATE POLICY "Public can view profiles by slug"
  ON public.profiles FOR SELECT
  USING (link_page_slug IS NOT NULL);

-- RLS Policies for social_accounts
CREATE POLICY "Users can view their own social accounts"
  ON public.social_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts"
  ON public.social_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts"
  ON public.social_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts"
  ON public.social_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for scheduled_posts
CREATE POLICY "Users can view their own scheduled posts"
  ON public.scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled posts"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts"
  ON public.scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts"
  ON public.scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for analytics_snapshots
CREATE POLICY "Users can view their own analytics"
  ON public.analytics_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON public.analytics_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for link_items
CREATE POLICY "Users can manage their own link items"
  ON public.link_items FOR ALL
  USING (auth.uid() = user_id);

-- Public access to link items for public link pages
CREATE POLICY "Public can view active link items"
  ON public.link_items FOR SELECT
  USING (is_active = true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  slug_base TEXT;
  unique_slug TEXT;
BEGIN
  -- Generate slug from email
  slug_base := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  unique_slug := slug_base || '-' || FLOOR(RANDOM() * 9999)::TEXT;
  
  INSERT INTO public.profiles (id, email, display_name, link_page_slug)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1)),
    unique_slug
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_link_items_updated_at
  BEFORE UPDATE ON public.link_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_social_accounts_user_id ON public.social_accounts(user_id);
CREATE INDEX idx_scheduled_posts_user_id ON public.scheduled_posts(user_id);
CREATE INDEX idx_scheduled_posts_scheduled_at ON public.scheduled_posts(scheduled_at);
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX idx_analytics_snapshots_user_id ON public.analytics_snapshots(user_id);
CREATE INDEX idx_link_items_user_id ON public.link_items(user_id);
CREATE INDEX idx_profiles_link_page_slug ON public.profiles(link_page_slug);