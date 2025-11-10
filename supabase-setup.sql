-- Doggo Encounters - Supabase Setup SQL
-- Run this in your Supabase SQL Editor

-- 1. Create the Encounters table
CREATE TABLE IF NOT EXISTS Encounters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_url TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE Encounters ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow anyone to read encounters (public read)
CREATE POLICY "Allow public read access on Encounters"
  ON Encounters
  FOR SELECT
  USING (true);

-- 4. Create a policy to allow anyone to insert encounters (public insert)
CREATE POLICY "Allow public insert access on Encounters"
  ON Encounters
  FOR INSERT
  WITH CHECK (true);

-- Optional: If you want to restrict to authenticated users only, use this instead:
-- CREATE POLICY "Allow authenticated users to read Encounters"
--   ON Encounters
--   FOR SELECT
--   USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Allow authenticated users to insert Encounters"
--   ON Encounters
--   FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');

-- 5. Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_encounters_created_at ON Encounters(created_at DESC);

