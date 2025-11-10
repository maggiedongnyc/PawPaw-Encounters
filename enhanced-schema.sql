-- Enhanced Doggo Encounters Schema
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns to Encounters table
ALTER TABLE "Encounters" 
  ADD COLUMN IF NOT EXISTS breed TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS mood TEXT,
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Step 2: Create Comments table
CREATE TABLE IF NOT EXISTS "Comments" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES "Encounters"(id) ON DELETE CASCADE,
  user_id TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create Badges table
CREATE TABLE IF NOT EXISTS "Badges" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_encounters_user_id ON "Encounters"(user_id);
CREATE INDEX IF NOT EXISTS idx_encounters_breed ON "Encounters"(breed);
CREATE INDEX IF NOT EXISTS idx_encounters_size ON "Encounters"(size);
CREATE INDEX IF NOT EXISTS idx_encounters_mood ON "Encounters"(mood);
CREATE INDEX IF NOT EXISTS idx_comments_encounter_id ON "Comments"(encounter_id);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON "Badges"(user_id);

-- Step 5: Disable RLS for testing (or create policies)
ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Badges" DISABLE ROW LEVEL SECURITY;

-- Optional: If you want to enable RLS with public access:
-- ALTER TABLE "Encounters" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read on Encounters" ON "Encounters" FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert on Encounters" ON "Encounters" FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update on Encounters" ON "Encounters" FOR UPDATE USING (true);

