-- Check what tables exist in your database
-- Run this first to see all your tables

-- 1. List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check if Encounters table exists (with different cases)
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename ILIKE '%encounter%';

