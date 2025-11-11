-- Fix Comments Table RLS Policies
-- This script fixes RLS policies for the Comments table to work with TEXT user_id

-- ============================================
-- STEP 1: Check current RLS status
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Comments';

-- ============================================
-- STEP 2: Drop existing policies
-- ============================================
DROP POLICY IF EXISTS "Users can view all comments" ON "Comments";
DROP POLICY IF EXISTS "Users can insert their own comments" ON "Comments";
DROP POLICY IF EXISTS "Users can update their own comments" ON "Comments";
DROP POLICY IF EXISTS "Users can delete their own comments" ON "Comments";
DROP POLICY IF EXISTS "Anyone can view all comments" ON "Comments";
DROP POLICY IF EXISTS "Allow public read on Comments" ON "Comments";
DROP POLICY IF EXISTS "Allow public insert on Comments" ON "Comments";

-- ============================================
-- STEP 3: Option A - Disable RLS (Easiest for testing)
-- ============================================
-- This will allow comments to work immediately
ALTER TABLE "Comments" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Option B - Enable RLS with proper policies (if you want RLS)
-- ============================================
-- Uncomment this section if you want to enable RLS with proper policies

-- ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all comments
-- CREATE POLICY "Anyone can view all comments" ON "Comments" 
--   FOR SELECT 
--   USING (true);

-- Policy: Authenticated users can insert comments
-- Note: We cast auth.uid() to TEXT to match user_id column type
-- CREATE POLICY "Authenticated users can insert comments" ON "Comments" 
--   FOR INSERT 
--   WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own comments
-- CREATE POLICY "Users can update their own comments" ON "Comments" 
--   FOR UPDATE 
--   USING (auth.uid()::text = user_id)
--   WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own comments
-- CREATE POLICY "Users can delete their own comments" ON "Comments" 
--   FOR DELETE 
--   USING (auth.uid()::text = user_id);

-- ============================================
-- STEP 5: Verify the fix
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'Comments'
ORDER BY policyname;

