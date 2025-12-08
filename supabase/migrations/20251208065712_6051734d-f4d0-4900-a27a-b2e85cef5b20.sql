-- 1) Create a safe view that exposes only non-sensitive fields
CREATE OR REPLACE VIEW public.social_accounts_safe AS
SELECT
  id,
  user_id,
  platform,
  handle,
  is_connected,
  token_expires_at,
  created_at,
  updated_at
FROM public.social_accounts;

-- 2) Make sure RLS is still enforced via the base table
ALTER VIEW public.social_accounts_safe SET (security_barrier = true);

-- 3) Revoke direct SELECT on the base table from app roles
REVOKE SELECT ON TABLE public.social_accounts FROM anon, authenticated;

-- 4) Grant SELECT on the safe view instead
GRANT SELECT ON public.social_accounts_safe TO anon, authenticated;