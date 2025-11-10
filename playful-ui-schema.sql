-- Playful UI/UX Schema Update for Doggo Encounters
-- Run this in your Supabase SQL Editor to ensure all columns exist

-- ============================================
-- STEP 1: Update Encounters Table
-- ============================================

-- Ensure all required columns exist in Encounters table
DO $$
BEGIN
    -- Add breed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'breed') THEN
        ALTER TABLE "Encounters" ADD COLUMN breed TEXT;
    END IF;

    -- Add size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'size') THEN
        ALTER TABLE "Encounters" ADD COLUMN size TEXT;
    END IF;

    -- Add mood column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'mood') THEN
        ALTER TABLE "Encounters" ADD COLUMN mood TEXT;
    END IF;

    -- Add likes column if it doesn't exist (default to 0)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'likes') THEN
        ALTER TABLE "Encounters" ADD COLUMN likes INTEGER DEFAULT 0;
    ELSE
        -- Update existing rows to have 0 likes if null
        UPDATE "Encounters" SET likes = 0 WHERE likes IS NULL;
    END IF;

    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'user_id') THEN
        ALTER TABLE "Encounters" ADD COLUMN user_id TEXT;
    END IF;

    -- Ensure location column is TEXT (for JSON storage)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Encounters' AND column_name = 'location' 
               AND data_type <> 'text') THEN
        ALTER TABLE "Encounters" ALTER COLUMN location TYPE TEXT;
    END IF;

    -- Ensure created_at exists (should already exist, but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'created_at') THEN
        ALTER TABLE "Encounters" ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- STEP 2: Create Comments Table (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS "Comments" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES "Encounters"(id) ON DELETE CASCADE,
  user_id TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: Create Badges Table (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS "Badges" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- ============================================
-- STEP 4: Create Indexes for Performance
-- ============================================

-- Indexes for Encounters table
CREATE INDEX IF NOT EXISTS idx_encounters_user_id ON "Encounters"(user_id);
CREATE INDEX IF NOT EXISTS idx_encounters_breed ON "Encounters"(breed);
CREATE INDEX IF NOT EXISTS idx_encounters_size ON "Encounters"(size);
CREATE INDEX IF NOT EXISTS idx_encounters_mood ON "Encounters"(mood);
CREATE INDEX IF NOT EXISTS idx_encounters_likes ON "Encounters"(likes);
CREATE INDEX IF NOT EXISTS idx_encounters_created_at ON "Encounters"(created_at DESC);

-- Indexes for Comments table
CREATE INDEX IF NOT EXISTS idx_comments_encounter_id ON "Comments"(encounter_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON "Comments"(user_id);

-- Indexes for Badges table
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON "Badges"(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_badge_type ON "Badges"(badge_type);

-- ============================================
-- STEP 5: Set Default Values
-- ============================================

-- Ensure all existing encounters have likes = 0 if null
UPDATE "Encounters" SET likes = 0 WHERE likes IS NULL;

-- Set default user_id for existing encounters (if needed)
-- UPDATE "Encounters" SET user_id = 'anonymous' WHERE user_id IS NULL;

-- ============================================
-- STEP 6: RLS Policies (Optional - for testing)
-- ============================================

-- Disable RLS for testing (uncomment if you want to disable)
-- ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Comments" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Badges" DISABLE ROW LEVEL SECURITY;

-- OR Enable RLS with public access policies (uncomment if you want to enable)
/*
ALTER TABLE "Encounters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Badges" ENABLE ROW LEVEL SECURITY;

-- Encounters policies
DROP POLICY IF EXISTS "Allow public read on Encounters" ON "Encounters";
CREATE POLICY "Allow public read on Encounters" ON "Encounters" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on Encounters" ON "Encounters";
CREATE POLICY "Allow public insert on Encounters" ON "Encounters" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on Encounters" ON "Encounters";
CREATE POLICY "Allow public update on Encounters" ON "Encounters" FOR UPDATE USING (true);

-- Comments policies
DROP POLICY IF EXISTS "Allow public read on Comments" ON "Comments";
CREATE POLICY "Allow public read on Comments" ON "Comments" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on Comments" ON "Comments";
CREATE POLICY "Allow public insert on Comments" ON "Comments" FOR INSERT WITH CHECK (true);

-- Badges policies
DROP POLICY IF EXISTS "Allow public read on Badges" ON "Badges";
CREATE POLICY "Allow public read on Badges" ON "Badges" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on Badges" ON "Badges";
CREATE POLICY "Allow public insert on Badges" ON "Badges" FOR INSERT WITH CHECK (true);
*/

-- ============================================
-- STEP 7: Verify Schema
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

-- Check Comments table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'Comments'
) AS comments_table_exists;

-- Check Badges table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'Badges'
) AS badges_table_exists;

