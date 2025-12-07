-- Update social_accounts foreign key to reference profiles
ALTER TABLE public.social_accounts
DROP CONSTRAINT IF EXISTS social_accounts_user_id_fkey;

ALTER TABLE public.social_accounts
ADD CONSTRAINT social_accounts_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;