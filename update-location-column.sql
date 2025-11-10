-- Update Encounters table to store location as JSON
-- Run this in your Supabase SQL Editor

-- Step 1: Check current location column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Encounters' AND column_name = 'location';

-- Step 2: If location is TEXT, we can keep it (JSON will be stored as text)
-- If you want to change it to JSONB for better querying, run:
-- ALTER TABLE "Encounters" ALTER COLUMN location TYPE JSONB USING location::JSONB;

-- Note: The current setup stores location as TEXT (JSON string), which works fine.
-- If you want to use JSONB for better querying capabilities, uncomment the line above.

-- Step 3: Verify the column can store JSON
-- The location column should accept JSON strings like:
-- '{"lat": 37.7749, "lng": -122.4194, "name": "San Francisco"}'

