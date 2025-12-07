-- Drop existing foreign keys if present
ALTER TABLE public.scheduled_posts
DROP CONSTRAINT IF EXISTS scheduled_posts_user_id_fkey;

ALTER TABLE public.scheduled_posts
DROP CONSTRAINT IF EXISTS scheduled_posts_social_account_id_fkey;

-- Recreate foreign keys with correct ownership model
ALTER TABLE public.scheduled_posts
ADD CONSTRAINT scheduled_posts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

ALTER TABLE public.scheduled_posts
ADD CONSTRAINT scheduled_posts_social_account_id_fkey
FOREIGN KEY (social_account_id)
REFERENCES public.social_accounts(id)
ON DELETE CASCADE;