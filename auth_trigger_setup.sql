-- ============================================================================
-- ConvertCast Auth Trigger Setup
-- ============================================================================
-- This script creates a trigger to automatically create a user profile
-- in the public.users table when someone signs up via Supabase Auth.
--
-- IMPORTANT: Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Create function to handle new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert new user into public.users table
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Step 2: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Update the users table to use auth.uid() as primary key
-- First, make sure the users table's id column allows auth user IDs
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
ALTER TABLE public.users ADD PRIMARY KEY (id);

-- Step 4: Update RLS policies to work with auth.uid()
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Allow users to view their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to insert users (triggered by auth.users insert)
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id);

-- Step 5: Enable additional RLS policies for related tables
-- Events - users can manage their own events
DROP POLICY IF EXISTS "Users can view own events" ON events;
DROP POLICY IF EXISTS "Users can insert own events" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- Streams - users can manage streams for their own events
DROP POLICY IF EXISTS "Users can view own streams" ON streams;
DROP POLICY IF EXISTS "Users can insert own streams" ON streams;
DROP POLICY IF EXISTS "Users can update own streams" ON streams;

CREATE POLICY "Users can view own streams"
  ON streams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = streams.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own streams"
  ON streams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own streams"
  ON streams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = streams.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Chat messages - users can view messages from their streams
DROP POLICY IF EXISTS "Users can view stream chat" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON chat_messages;

CREATE POLICY "Users can view stream chat"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM streams
      JOIN events ON events.id = streams.event_id
      WHERE streams.id = chat_messages.stream_id
      AND events.user_id = auth.uid()
    )
  );

-- Allow viewers to send chat messages (they don't need to be authenticated)
CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- Viewer profiles - public read, anyone can create
DROP POLICY IF EXISTS "Viewer profiles are publicly readable" ON viewer_profiles;
DROP POLICY IF EXISTS "Anyone can create viewer profiles" ON viewer_profiles;

CREATE POLICY "Viewer profiles are publicly readable"
  ON viewer_profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create viewer profiles"
  ON viewer_profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this script, you can verify the setup with these queries:

-- 1. Check if the trigger exists:
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 2. Check if the function exists:
-- SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- 3. Check RLS policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'users';

-- ============================================================================
-- NOTES
-- ============================================================================
-- - This trigger runs AFTER INSERT on auth.users, so it's non-blocking
-- - The SECURITY DEFINER ensures the function runs with creator privileges
-- - ON CONFLICT DO NOTHING prevents errors if user already exists
-- - The name extraction tries multiple metadata fields for compatibility
-- ============================================================================
