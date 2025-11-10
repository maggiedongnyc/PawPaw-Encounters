-- Anonymous Authentication Schema Update for PawPaw Encounters
-- Run this in your Supabase SQL Editor to set up anonymous auth with RLS

-- ============================================
-- STEP 1: Update Encounters Table
-- ============================================

-- Ensure user_id column exists and is UUID type (references auth.users.id)
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'user_id') THEN
        ALTER TABLE "Encounters" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ELSE
        -- Update existing user_id column to UUID if it's TEXT
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'user_id' 
                   AND data_type = 'text') THEN
            -- First, set existing anonymous user_ids to NULL (they'll be updated on next upload)
            UPDATE "Encounters" SET user_id = NULL WHERE user_id = 'anonymous' OR user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
            
            -- Drop the old column
            ALTER TABLE "Encounters" DROP COLUMN user_id;
            
            -- Add new UUID column
            ALTER TABLE "Encounters" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 2: Update Comments Table
-- ============================================

-- Ensure user_id column exists and is UUID type
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Comments' AND column_name = 'user_id') THEN
        ALTER TABLE "Comments" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    ELSE
        -- Update existing user_id column to UUID if it's TEXT
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Comments' AND column_name = 'user_id' 
                   AND data_type = 'text') THEN
            -- First, set existing anonymous user_ids to NULL
            UPDATE "Comments" SET user_id = NULL WHERE user_id = 'anonymous' OR user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
            
            -- Drop the old column
            ALTER TABLE "Comments" DROP COLUMN user_id;
            
            -- Add new UUID column
            ALTER TABLE "Comments" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 3: Update Badges Table
-- ============================================

-- Ensure user_id column exists and is UUID type
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Badges' AND column_name = 'user_id') THEN
        ALTER TABLE "Badges" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    ELSE
        -- Update existing user_id column to UUID if it's TEXT
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Badges' AND column_name = 'user_id' 
                   AND data_type = 'text') THEN
            -- First, delete badges with invalid user_ids
            DELETE FROM "Badges" WHERE user_id = 'anonymous' OR user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
            
            -- Drop the old column
            ALTER TABLE "Badges" DROP COLUMN user_id;
            
            -- Add new UUID column
            ALTER TABLE "Badges" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ============================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE "Encounters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Badges" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: RLS Policies for Encounters
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all encounters" ON "Encounters";
DROP POLICY IF EXISTS "Users can insert their own encounters" ON "Encounters";
DROP POLICY IF EXISTS "Users can update their own encounters" ON "Encounters";
DROP POLICY IF EXISTS "Users can delete their own encounters" ON "Encounters";

-- Policy: Anyone can view all encounters
CREATE POLICY "Users can view all encounters"
ON "Encounters" FOR SELECT
USING (true);

-- Policy: Authenticated users can insert their own encounters
CREATE POLICY "Users can insert their own encounters"
ON "Encounters" FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own encounters
CREATE POLICY "Users can update their own encounters"
ON "Encounters" FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own encounters
CREATE POLICY "Users can delete their own encounters"
ON "Encounters" FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 6: RLS Policies for Comments
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all comments" ON "Comments";
DROP POLICY IF EXISTS "Users can insert their own comments" ON "Comments";
DROP POLICY IF EXISTS "Users can update their own comments" ON "Comments";
DROP POLICY IF EXISTS "Users can delete their own comments" ON "Comments";

-- Policy: Anyone can view all comments
CREATE POLICY "Users can view all comments"
ON "Comments" FOR SELECT
USING (true);

-- Policy: Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments"
ON "Comments" FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON "Comments" FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON "Comments" FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 7: RLS Policies for Badges
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all badges" ON "Badges";
DROP POLICY IF EXISTS "Users can insert their own badges" ON "Badges";
DROP POLICY IF EXISTS "Users can update their own badges" ON "Badges";
DROP POLICY IF EXISTS "Users can delete their own badges" ON "Badges";

-- Policy: Anyone can view all badges
CREATE POLICY "Users can view all badges"
ON "Badges" FOR SELECT
USING (true);

-- Policy: Authenticated users can insert their own badges
CREATE POLICY "Users can insert their own badges"
ON "Badges" FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own badges
CREATE POLICY "Users can update their own badges"
ON "Badges" FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own badges
CREATE POLICY "Users can delete their own badges"
ON "Badges" FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 8: Update Indexes
-- ============================================

-- Drop old indexes if they exist
DROP INDEX IF EXISTS idx_encounters_user_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_badges_user_id;

-- Create new indexes with UUID type
CREATE INDEX IF NOT EXISTS idx_encounters_user_id ON "Encounters"(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON "Comments"(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON "Badges"(user_id);

-- ============================================
-- STEP 9: Verify Schema
-- ============================================

-- Check Encounters table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Encounters'
ORDER BY ordinal_position;

-- Check Comments table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Comments'
ORDER BY ordinal_position;

-- Check Badges table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Badges'
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('Encounters', 'Comments', 'Badges');

