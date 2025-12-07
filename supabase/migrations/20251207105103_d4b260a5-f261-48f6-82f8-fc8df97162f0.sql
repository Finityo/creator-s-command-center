-- Drop the view and recreate without security definer issues
DROP VIEW IF EXISTS public.public_profiles;

-- Create view with SECURITY INVOKER (the default and safe option)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  avatar_url,
  link_page_bio,
  link_page_slug,
  timezone
FROM public.profiles
WHERE link_page_slug IS NOT NULL;

-- Grant select access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;