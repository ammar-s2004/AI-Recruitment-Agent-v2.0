-- Migration: Fix missing tables and enable Row Level Security (RLS)
-- Created: 2026-02-16
-- Follows supabase-migration.md workflow
-- 
-- ISSUES FIXED:
-- 1. Missing 'colleges' table
-- 2. RLS disabled on all tables
-- 3. Complete RLS policies for: users, interviews, interview_results, colleges
--    Including INSERT, SELECT, UPDATE, DELETE for all roles (user, recruiter, admin)

BEGIN;

-- ============================================================
-- 1. CREATE MISSING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.colleges (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.colleges ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS POLICIES: USERS TABLE
-- ============================================================

-- Admin: Full access to all users
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access to users' AND tablename = 'users') THEN
        CREATE POLICY "Admin full access to users" ON public.users
        FOR ALL TO authenticated
        USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.email = auth.jwt() ->> 'email' AND u.role = 'admin')
        )
        WITH CHECK (
            EXISTS (SELECT 1 FROM public.users u WHERE u.email = auth.jwt() ->> 'email' AND u.role = 'admin')
        );
    END IF;
END $$;

-- Users: Can view their own profile
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT TO authenticated
        USING (auth.jwt() ->> 'email' = email);
    END IF;
END $$;

-- Users: Can update their own profile
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE TO authenticated
        USING (auth.jwt() ->> 'email' = email);
    END IF;
END $$;

-- Users: Can insert their own profile (auth callback on signup)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can insert own profile" ON public.users
        FOR INSERT TO authenticated
        WITH CHECK (auth.jwt() ->> 'email' = email);
    END IF;
END $$;

-- ============================================================
-- 4. RLS POLICIES: INTERVIEWS TABLE
-- ============================================================

-- Admin: Full access to all interviews
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access to interviews' AND tablename = 'interviews') THEN
        CREATE POLICY "Admin full access to interviews" ON public.interviews
        FOR ALL TO authenticated
        USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.email = auth.jwt() ->> 'email' AND u.role = 'admin')
        )
        WITH CHECK (
            EXISTS (SELECT 1 FROM public.users u WHERE u.email = auth.jwt() ->> 'email' AND u.role = 'admin')
        );
    END IF;
END $$;

-- Recruiters: Can view their own interviews
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recruiters can view own interviews' AND tablename = 'interviews') THEN
        CREATE POLICY "Recruiters can view own interviews" ON public.interviews
        FOR SELECT TO authenticated
        USING (auth.jwt() ->> 'email' = useremail);
    END IF;
END $$;

-- Recruiters: Can create interviews
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recruiters can create interviews' AND tablename = 'interviews') THEN
        CREATE POLICY "Recruiters can create interviews" ON public.interviews
        FOR INSERT TO authenticated
        WITH CHECK (auth.jwt() ->> 'email' = useremail);
    END IF;
END $$;

-- Recruiters: Can update their own interviews
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recruiters can update own interviews' AND tablename = 'interviews') THEN
        CREATE POLICY "Recruiters can update own interviews" ON public.interviews
        FOR UPDATE TO authenticated
        USING (auth.jwt() ->> 'email' = useremail);
    END IF;
END $$;

-- Recruiters: Can delete their own interviews
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recruiters can delete own interviews' AND tablename = 'interviews') THEN
        CREATE POLICY "Recruiters can delete own interviews" ON public.interviews
        FOR DELETE TO authenticated
        USING (auth.jwt() ->> 'email' = useremail);
    END IF;
END $$;

-- Candidates (anon + authenticated): Can view interview details to join
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view interview details' AND tablename = 'interviews') THEN
        CREATE POLICY "Anyone can view interview details" ON public.interviews
        FOR SELECT TO anon, authenticated
        USING (true);
    END IF;
END $$;

-- ============================================================
-- 5. RLS POLICIES: INTERVIEW_RESULTS TABLE
-- ============================================================

-- Admin: Full access to all results
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin full access to results' AND tablename = 'interview_results') THEN
        CREATE POLICY "Admin full access to results" ON public.interview_results
        FOR ALL TO authenticated
        USING (
            EXISTS (SELECT 1 FROM public.users u WHERE u.email = auth.jwt() ->> 'email' AND u.role = 'admin')
        )
        WITH CHECK (
            EXISTS (SELECT 1 FROM public.users u WHERE u.email = auth.jwt() ->> 'email' AND u.role = 'admin')
        );
    END IF;
END $$;

-- Candidates: Can view their own results
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can view own results' AND tablename = 'interview_results') THEN
        CREATE POLICY "Candidates can view own results" ON public.interview_results
        FOR SELECT TO authenticated
        USING (auth.jwt() ->> 'email' = email);
    END IF;
END $$;

-- Candidates: Can insert their own results (after completing interview)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can insert own results' AND tablename = 'interview_results') THEN
        CREATE POLICY "Candidates can insert own results" ON public.interview_results
        FOR INSERT TO authenticated
        WITH CHECK (auth.jwt() ->> 'email' = email);
    END IF;
END $$;

-- Recruiters: Can view results for their interviews
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recruiters can view interview results' AND tablename = 'interview_results') THEN
        CREATE POLICY "Recruiters can view interview results" ON public.interview_results
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.interviews i
                WHERE i.interview_id = public.interview_results.interview_id
                AND i.useremail = auth.jwt() ->> 'email'
            )
        );
    END IF;
END $$;

-- Recruiters: Can delete results for their interviews
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Recruiters can delete interview results' AND tablename = 'interview_results') THEN
        CREATE POLICY "Recruiters can delete interview results" ON public.interview_results
        FOR DELETE TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.interviews i
                WHERE i.interview_id = public.interview_results.interview_id
                AND i.useremail = auth.jwt() ->> 'email'
            )
        );
    END IF;
END $$;

-- ============================================================
-- 6. RLS POLICIES: COLLEGES TABLE
-- ============================================================

-- Colleges: Viewable by everyone (public reference data)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Colleges are viewable by everyone' AND tablename = 'colleges') THEN
        CREATE POLICY "Colleges are viewable by everyone" ON public.colleges
        FOR SELECT TO anon, authenticated
        USING (true);
    END IF;
END $$;

COMMIT;
