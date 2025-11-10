-- COMPLETE RLS FIX - Run this entire script
-- Copy and paste everything below into Supabase SQL Editor

-- Step 1: Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Encounters';

-- Step 2: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Allow public read access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow public insert access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow authenticated users to read Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow authenticated users to insert Encounters" ON "Encounters";

-- Step 3: Disable RLS completely
ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify RLS is disabled (should show rowsecurity = false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Encounters';

-- If you see rowsecurity = false, RLS is disabled!
-- Now restart your Next.js server and try again.

