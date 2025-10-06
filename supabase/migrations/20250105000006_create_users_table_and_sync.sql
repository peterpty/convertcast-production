-- ============================================================================
-- Migration: Create Users Table and Auth Sync Trigger
-- Purpose: Fix "Key is not present in table users" error
-- Date: 2025-10-05
-- Issue: Users exist in auth.users but not in public.users, breaking FK constraints
-- ============================================================================

-- ============================================================================
-- STEP 1: Create or alter public.users table
-- ============================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
  -- Add email if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'email') THEN
    ALTER TABLE public.users ADD COLUMN email TEXT;
  END IF;

  -- Add full_name if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'full_name') THEN
    ALTER TABLE public.users ADD COLUMN full_name TEXT;
  END IF;

  -- Add avatar_url if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'avatar_url') THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;

  -- Add preferences if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'preferences') THEN
    ALTER TABLE public.users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add metadata if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'metadata') THEN
    ALTER TABLE public.users ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add created_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'created_at') THEN
    ALTER TABLE public.users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'users'
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Make email NOT NULL and UNIQUE (if it has data)
DO $$
BEGIN
  -- Update any NULL emails first
  UPDATE public.users SET email = id::text || '@placeholder.com' WHERE email IS NULL;

  -- Add NOT NULL constraint
  ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;

  -- Add unique constraint if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname = 'users_email_key'
                 AND conrelid = 'public.users'::regclass) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add email constraints: %', SQLERRM;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 2: Create trigger function to auto-create user on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Extract name from metadata
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert or update user record
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();

  -- Update 'name' column if it exists (for backward compatibility)
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
             AND table_name = 'users'
             AND column_name = 'name') THEN
    UPDATE public.users
    SET name = v_full_name
    WHERE id = NEW.id AND name IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Create trigger on auth.users
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: Fix existing constraints and backfill
-- ============================================================================

-- Drop NOT NULL constraint on 'name' if it exists
DO $$
BEGIN
  -- Check if 'name' column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
             AND table_name = 'users'
             AND column_name = 'name') THEN
    -- Drop NOT NULL constraint
    ALTER TABLE public.users ALTER COLUMN name DROP NOT NULL;
    RAISE NOTICE 'Dropped NOT NULL constraint on users.name';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not modify name column: %', SQLERRM;
END $$;

-- Backfill existing auth.users into public.users
-- Handle both 'name' and 'full_name' columns
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)  -- Fallback to email username
  ) as full_name,
  COALESCE(au.raw_user_meta_data->>'avatar_url', NULL) as avatar_url
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = au.id)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
  updated_at = NOW();

-- Sync 'name' column with 'full_name' if both exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public'
             AND table_name = 'users'
             AND column_name = 'name') THEN
    -- Update name from full_name where name is null
    UPDATE public.users
    SET name = COALESCE(full_name, split_part(email, '@', 1))
    WHERE name IS NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create updated_at trigger for users table
-- ============================================================================

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check users table exists and has data:
-- SELECT COUNT(*) FROM public.users;

-- Check auth.users count matches:
-- SELECT COUNT(*) FROM auth.users;

-- Test trigger works:
-- The trigger will fire automatically when new users sign up

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This creates a public.users table that mirrors auth.users
-- 2. Trigger automatically syncs new signups from auth.users → public.users
-- 3. Existing users are backfilled
-- 4. FK constraints in other tables (events, streams, etc.) now work
-- 5. Users can only see/modify their own profile via RLS

-- ============================================================================
