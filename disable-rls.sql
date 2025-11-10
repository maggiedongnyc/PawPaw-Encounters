-- Disable RLS on Encounters table
-- Run this in your Supabase SQL Editor

-- IMPORTANT: PostgreSQL is case-sensitive with quoted names
-- Try these options one by one until one works:

-- Option 1: If table name is "Encounters" (with quotes, uppercase E)
ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;

-- Option 2: If table name is "encounters" (lowercase, no quotes)
-- Uncomment this if Option 1 doesn't work:
-- ALTER TABLE encounters DISABLE ROW LEVEL SECURITY;

-- Option 3: If table name is "Encounters" (no quotes, PostgreSQL converts to lowercase)
-- Uncomment this if Options 1 and 2 don't work:
-- ALTER TABLE Encounters DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies (optional, but recommended for clean state)
DROP POLICY IF EXISTS "Allow public read access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow public insert access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow authenticated users to read Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow authenticated users to insert Encounters" ON "Encounters";

-- 3. Verify RLS is disabled
-- Run this query to check:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'Encounters';
-- 
-- If rowsecurity is false, RLS is disabled

