-- Create a public_profiles view that excludes sensitive columns
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  link_page_bio,
  link_page_slug,
  timezone
FROM public.profiles
WHERE link_page_slug IS NOT NULL;

-- Grant select access to the view for anonymous and authenticated users
GRANT SELECT ON public.public_profiles TO anon, authenticated;