-- FINAL FIX: Disable RLS on Encounters table
-- Run this in your Supabase SQL Editor

-- Step 1: First, let's verify the exact table name
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename ILIKE '%encounter%';

-- Step 2: Disable RLS (try with quotes first - this is the correct way for case-sensitive names)
ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Encounters';

-- If the above query shows rowsecurity = false, RLS is disabled!
-- If you get an error, try without quotes:
-- ALTER TABLE Encounters DISABLE ROW LEVEL SECURITY;

