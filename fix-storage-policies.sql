-- Fix Storage Bucket Policies for 'dog-photos' bucket
-- Run this in your Supabase SQL Editor

-- Step 1: Drop any existing policies on storage.objects
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;

-- Step 2: Create policy to allow public uploads to 'dog-photos' bucket
CREATE POLICY "Allow public uploads to dog-photos"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'dog-photos');

-- Step 3: Create policy to allow public reads from 'dog-photos' bucket
CREATE POLICY "Allow public reads from dog-photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'dog-photos');

-- Step 4: Verify the policies were created
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%dog-photos%';

