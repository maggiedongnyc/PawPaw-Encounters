-- User Profiles Database Schema
-- Run this in your Supabase SQL Editor to enable user profiles

-- ============================================
-- STEP 1: Create UserProfiles table
-- ============================================
CREATE TABLE IF NOT EXISTS "UserProfiles" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE, -- References auth.users.id (stored as TEXT to match existing schema)
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  favorite_breeds TEXT[], -- Array of favorite breeds
  location TEXT, -- User's location (city, neighborhood, etc.)
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON "UserProfiles"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON "UserProfiles"(username) WHERE username IS NOT NULL;

-- ============================================
-- STEP 3: Create UserStatistics view
-- ============================================
-- This view aggregates user statistics from Encounters, Comments, and Badges tables
CREATE OR REPLACE VIEW "UserStatistics" AS
WITH user_encounters AS (
  SELECT 
    user_id,
    COUNT(*) as total_encounters,
    COALESCE(SUM(likes), 0) as total_likes_received,
    MAX(created_at) as last_encounter_at,
    MIN(created_at) as first_encounter_at
  FROM "Encounters"
  WHERE user_id IS NOT NULL
  GROUP BY user_id
),
user_comments AS (
  SELECT 
    user_id,
    COUNT(*) as total_comments
  FROM "Comments"
  WHERE user_id IS NOT NULL
  GROUP BY user_id
),
user_badges AS (
  SELECT 
    user_id,
    COUNT(*) as total_badges
  FROM "Badges"
  WHERE user_id IS NOT NULL
  GROUP BY user_id
),
all_users AS (
  SELECT DISTINCT user_id FROM "Encounters" WHERE user_id IS NOT NULL
  UNION
  SELECT DISTINCT user_id FROM "Comments" WHERE user_id IS NOT NULL
  UNION
  SELECT DISTINCT user_id FROM "Badges" WHERE user_id IS NOT NULL
)
SELECT 
  u.user_id,
  COALESCE(e.total_encounters, 0) as total_encounters,
  COALESCE(c.total_comments, 0) as total_comments,
  COALESCE(e.total_likes_received, 0) as total_likes_received,
  COALESCE(b.total_badges, 0) as total_badges,
  e.last_encounter_at,
  e.first_encounter_at
FROM all_users u
LEFT JOIN user_encounters e ON e.user_id = u.user_id
LEFT JOIN user_comments c ON c.user_id = u.user_id
LEFT JOIN user_badges b ON b.user_id = u.user_id;

-- ============================================
-- STEP 4: Create function to get or create user profile
-- ============================================
CREATE OR REPLACE FUNCTION get_or_create_user_profile(p_user_id TEXT)
RETURNS "UserProfiles" AS $$
DECLARE
  profile "UserProfiles";
BEGIN
  -- Try to get existing profile
  SELECT * INTO profile
  FROM "UserProfiles"
  WHERE user_id = p_user_id;

  -- If no profile exists, create one
  IF profile IS NULL THEN
    INSERT INTO "UserProfiles" (user_id, display_name)
    VALUES (p_user_id, 'User ' || SUBSTRING(p_user_id, 1, 8))
    RETURNING * INTO profile;
  END IF;

  RETURN profile;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Create trigger to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON "UserProfiles"
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- ============================================
-- STEP 6: Enable RLS (Row-Level Security) - Optional
-- ============================================
-- Uncomment these if you want to enable RLS
-- ALTER TABLE "UserProfiles" ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read profiles
-- CREATE POLICY "Public profiles are viewable by everyone"
--   ON "UserProfiles" FOR SELECT
--   USING (true);

-- Policy: Users can update their own profile
-- CREATE POLICY "Users can update own profile"
--   ON "UserProfiles" FOR UPDATE
--   USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own profile
-- CREATE POLICY "Users can insert own profile"
--   ON "UserProfiles" FOR INSERT
--   WITH CHECK (auth.uid()::text = user_id);

-- ============================================
-- Notes:
-- ============================================
-- 1. user_id is stored as TEXT to match existing Encounters/Comments/Badges tables
-- 2. username is optional and unique (for custom usernames)
-- 3. display_name is the primary name shown (defaults to "User {user_id}")
-- 4. favorite_breeds is an array for multiple favorite breeds
-- 5. The UserStatistics view aggregates data from multiple tables
-- 6. The get_or_create_user_profile function ensures a profile exists for each user

