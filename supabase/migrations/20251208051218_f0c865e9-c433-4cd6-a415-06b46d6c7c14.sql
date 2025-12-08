-- Fix #1: Remove the overly permissive public profile policy that exposes emails
-- The public_profiles view already exists and excludes email, so we just need to 
-- restrict the profiles table policy to only allow authenticated users to view their own profile

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can view profiles by slug" ON public.profiles;

-- Create a new policy that only allows authenticated users to view their own profile
-- Public access should go through the public_profiles view which excludes email
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);