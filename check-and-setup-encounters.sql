-- ============================================
-- CHECK AND SETUP ENCOUNTERS TABLE
-- ============================================
-- This script will:
-- 1. Check if the Encounters table exists
-- 2. Create it if it doesn't exist
-- 3. Add all required columns
-- 4. Set up RLS policies for public read access
-- 5. Show you all existing data
-- ============================================

-- ============================================
-- STEP 1: Check if table exists
-- ============================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'Encounters'
        ) THEN 'Table EXISTS'
        ELSE 'Table DOES NOT EXIST - will create it'
    END AS table_status;

-- ============================================
-- STEP 2: Create table if it doesn't exist
-- ============================================

CREATE TABLE IF NOT EXISTS "Encounters" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_url TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  breed TEXT,
  size TEXT,
  mood TEXT,
  likes INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: Add missing columns if table exists
-- ============================================

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

    -- Add likes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'likes') THEN
        ALTER TABLE "Encounters" ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;

    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'user_id') THEN
        ALTER TABLE "Encounters" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Ensure location column is TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Encounters' AND column_name = 'location' 
               AND data_type <> 'text') THEN
        ALTER TABLE "Encounters" ALTER COLUMN location TYPE TEXT;
    END IF;

    -- Ensure created_at exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Encounters' AND column_name = 'created_at') THEN
        ALTER TABLE "Encounters" ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- STEP 4: Set up RLS policies for public read
-- ============================================

-- Enable RLS
ALTER TABLE "Encounters" ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view all encounters" ON "Encounters";
DROP POLICY IF EXISTS "Anyone can view all encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow public read access on Encounters" ON "Encounters";

-- Create new SELECT policy that allows anyone (including unauthenticated) to read
CREATE POLICY "Anyone can view all encounters" ON "Encounters" 
  FOR SELECT 
  USING (true);

-- Keep INSERT, UPDATE, DELETE policies (they require auth)
-- If they don't exist, create them
DO $$
BEGIN
    -- INSERT policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Encounters' 
        AND policyname = 'Users can insert their own encounters'
    ) THEN
        CREATE POLICY "Users can insert their own encounters" ON "Encounters" 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
    END IF;

    -- UPDATE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Encounters' 
        AND policyname = 'Users can update their own encounters'
    ) THEN
        CREATE POLICY "Users can update their own encounters" ON "Encounters" 
          FOR UPDATE 
          USING (auth.uid() = user_id);
    END IF;

    -- DELETE policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Encounters' 
        AND policyname = 'Users can delete their own encounters'
    ) THEN
        CREATE POLICY "Users can delete their own encounters" ON "Encounters" 
          FOR DELETE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_encounters_user_id ON "Encounters"(user_id);
CREATE INDEX IF NOT EXISTS idx_encounters_breed ON "Encounters"(breed);
CREATE INDEX IF NOT EXISTS idx_encounters_size ON "Encounters"(size);
CREATE INDEX IF NOT EXISTS idx_encounters_mood ON "Encounters"(mood);
CREATE INDEX IF NOT EXISTS idx_encounters_likes ON "Encounters"(likes);
CREATE INDEX IF NOT EXISTS idx_encounters_created_at ON "Encounters"(created_at DESC);

-- ============================================
-- STEP 6: Show table structure
-- ============================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'Encounters'
ORDER BY ordinal_position;

-- ============================================
-- STEP 7: Count existing records
-- ============================================

SELECT COUNT(*) AS total_encounters FROM "Encounters";

-- ============================================
-- STEP 8: Show all existing encounters (if any)
-- ============================================

SELECT 
    id,
    description,
    breed,
    size,
    mood,
    likes,
    created_at,
    CASE 
        WHEN user_id IS NOT NULL THEN 'Has user_id'
        ELSE 'No user_id'
    END AS user_status
FROM "Encounters"
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 9: Show RLS policies
-- ============================================

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'Encounters'
ORDER BY policyname;

-- ============================================
-- NOTES:
-- ============================================
-- After running this script:
-- 1. The Encounters table will exist with all required columns
-- 2. RLS will be enabled with public read access
-- 3. You'll see how many encounters exist (if any)
-- 4. You can now test uploading an encounter from the app
-- ============================================

