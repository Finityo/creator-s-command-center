-- Fix 1: Recreate public_profiles view with security_invoker to properly enforce RLS
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  avatar_url,
  link_page_bio,
  link_page_slug,
  timezone
FROM public.profiles
WHERE link_page_slug IS NOT NULL;

-- Grant access to the view for public access via anon role
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Fix 2: Update user_roles SELECT policy to only allow users to view their own role
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);