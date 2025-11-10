-- Find your table name and disable RLS
-- Run this in your Supabase SQL Editor

-- Step 1: First, let's see what tables you have
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 2: Once you see your table name, use one of these:

-- If your table is called "Encounters" (with uppercase E and quotes):
ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;

-- OR if your table is called "encounters" (lowercase, no quotes):
-- ALTER TABLE encounters DISABLE ROW LEVEL SECURITY;

-- OR if your table has a different name, replace "Encounters" with your actual table name:
-- ALTER TABLE "YourActualTableName" DISABLE ROW LEVEL SECURITY;

