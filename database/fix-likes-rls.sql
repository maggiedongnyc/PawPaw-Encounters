-- Fix Likes Table RLS and Existence
-- This script ensures the Likes table exists and has proper RLS settings

-- ============================================
-- STEP 1: Check if Likes table exists
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Likes';

-- ============================================
-- STEP 2: Create Likes table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS "Likes" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES "Encounters"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(encounter_id, user_id)
);

-- ============================================
-- STEP 3: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_likes_encounter_id ON "Likes"(encounter_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON "Likes"(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_encounter_user ON "Likes"(encounter_id, user_id);

-- ============================================
-- STEP 4: Disable RLS for testing (or fix policies)
-- ============================================
ALTER TABLE "Likes" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create sync function and trigger (if not exists)
-- ============================================
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

DROP TRIGGER IF EXISTS trigger_sync_likes_count ON "Likes";
CREATE TRIGGER trigger_sync_likes_count
  AFTER INSERT OR DELETE ON "Likes"
  FOR EACH ROW
  EXECUTE FUNCTION sync_encounter_likes_count();

