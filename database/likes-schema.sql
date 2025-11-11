-- Likes Table Schema
-- Run this in your Supabase SQL Editor to enable like/unlike functionality

-- ============================================
-- STEP 1: Create Likes table
-- ============================================
CREATE TABLE IF NOT EXISTS "Likes" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES "Encounters"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(encounter_id, user_id) -- Prevent duplicate likes
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_likes_encounter_id ON "Likes"(encounter_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON "Likes"(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_encounter_user ON "Likes"(encounter_id, user_id);

-- ============================================
-- STEP 3: Create function to sync likes count
-- ============================================
-- This function updates the likes count on Encounters table
CREATE OR REPLACE FUNCTION sync_encounter_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Encounters"
    SET likes = (
      SELECT COUNT(*) FROM "Likes" WHERE encounter_id = NEW.encounter_id
    )
    WHERE id = NEW.encounter_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Encounters"
    SET likes = (
      SELECT COUNT(*) FROM "Likes" WHERE encounter_id = OLD.encounter_id
    )
    WHERE id = OLD.encounter_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: Create trigger to auto-update likes count
-- ============================================
DROP TRIGGER IF EXISTS trigger_sync_likes_count ON "Likes";
CREATE TRIGGER trigger_sync_likes_count
  AFTER INSERT OR DELETE ON "Likes"
  FOR EACH ROW
  EXECUTE FUNCTION sync_encounter_likes_count();

-- ============================================
-- STEP 5: Migrate existing likes (optional)
-- ============================================
-- If you have existing encounters with likes > 0, you can create placeholder likes
-- This is optional and can be skipped if you want to start fresh
-- Note: This won't create actual user likes, just maintains the count

-- ============================================
-- STEP 6: Enable Row Level Security (optional)
-- ============================================
-- Uncomment if you want to enable RLS
-- ALTER TABLE "Likes" ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read likes
-- CREATE POLICY "Allow public read on Likes" ON "Likes" FOR SELECT USING (true);

-- Policy: Authenticated users can like/unlike
-- CREATE POLICY "Allow authenticated users to like" ON "Likes" FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow users to unlike" ON "Likes" FOR DELETE USING (true);

