-- Fix Encounters table schema to match application code
-- Run this in your Supabase SQL Editor

-- 1. Add NOT NULL constraints to required columns
ALTER TABLE Encounters 
  ALTER COLUMN photo_url SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN location SET NOT NULL;

-- 2. Remove the unused user_name column
ALTER TABLE Encounters DROP COLUMN IF EXISTS user_name;

-- 3. Verify the schema matches
-- You can run this to check:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'Encounters'
-- ORDER BY ordinal_position;

