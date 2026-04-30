-- Migration: Fix recruiter access to CVs and candidate profiles
-- Created: 2026-02-17 17:55:00

BEGIN;

-- 1. Allow recruiters to view files in the 'cv-uploads' bucket
-- This is necessary so recruiters can download candidate CVs
CREATE POLICY "Recruiters can view CVs" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cv-uploads'
  AND (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE email = (auth.jwt() ->> 'email')
      AND role = 'recruiter'
    )
  )
);

-- 2. Allow recruiters to view candidate user data
-- This is necessary so they can see candidate pictures and CV file paths in the results section
CREATE POLICY "Recruiters can view candidate profiles" ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE email = (auth.jwt() ->> 'email')
    AND role = 'recruiter'
  )
);

COMMIT;
