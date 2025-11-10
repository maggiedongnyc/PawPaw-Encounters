-- ============================================
-- PUBLIC READ ACCESS RLS POLICIES
-- ============================================
-- This script updates RLS policies to allow:
-- - Anyone (including unauthenticated users) can READ encounters and comments
-- - Only authenticated users can INSERT, UPDATE, DELETE their own data
-- ============================================

-- ============================================
-- STEP 1: Update Encounters Policies
-- ============================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view all encounters" ON "Encounters";

-- Create new SELECT policy that allows anyone (including unauthenticated) to read
CREATE POLICY "Anyone can view all encounters" ON "Encounters" 
  FOR SELECT 
  USING (true);

-- Keep existing INSERT, UPDATE, DELETE policies (they already require auth)
-- These policies ensure only authenticated users can modify data

-- ============================================
-- STEP 2: Update Comments Policies
-- ============================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view all comments" ON "Comments";

-- Create new SELECT policy that allows anyone (including unauthenticated) to read
CREATE POLICY "Anyone can view all comments" ON "Comments" 
  FOR SELECT 
  USING (true);

-- Keep existing INSERT, UPDATE, DELETE policies (they already require auth)
-- These policies ensure only authenticated users can modify data

-- ============================================
-- STEP 3: Update Badges Policies (if needed)
-- ============================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view all badges" ON "Badges";

-- Create new SELECT policy that allows anyone (including unauthenticated) to read
CREATE POLICY "Anyone can view all badges" ON "Badges" 
  FOR SELECT 
  USING (true);

-- Keep existing INSERT, UPDATE, DELETE policies (they already require auth)

-- ============================================
-- STEP 4: Verify Policies
-- ============================================

-- Check Encounters policies
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
WHERE tablename = 'Encounters'
ORDER BY policyname;

-- Check Comments policies
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

-- ============================================
-- NOTES:
-- ============================================
-- 1. The SELECT policies now use `USING (true)` which allows anyone to read
-- 2. INSERT, UPDATE, DELETE policies still require authentication via `auth.uid()`
-- 3. Users can only modify their own data (enforced by `auth.uid() = user_id`)
-- 4. Unauthenticated users can:
--    - View all encounters
--    - View all comments
--    - Like encounters (if your app allows anonymous likes)
-- 5. Authenticated users can:
--    - Do everything unauthenticated users can do
--    - Upload encounters
--    - Add comments
--    - Update/delete their own encounters and comments
-- ============================================

