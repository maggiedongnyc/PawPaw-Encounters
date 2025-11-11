-- Search Functionality Database Schema
-- Run this in your Supabase SQL Editor to enable full-text search

-- ============================================
-- STEP 1: Add full-text search index
-- ============================================
-- This creates a GIN index for fast full-text search
-- It indexes description, breed, size, and mood columns

CREATE INDEX IF NOT EXISTS idx_encounters_search 
ON "Encounters" 
USING gin(
  to_tsvector(
    'english', 
    COALESCE(description, '') || ' ' || 
    COALESCE(breed, '') || ' ' || 
    COALESCE(size, '') || ' ' || 
    COALESCE(mood, '')
  )
);

-- ============================================
-- STEP 2: Create search function (optional, for advanced search)
-- ============================================
-- This function provides ranked search results
-- You can use this for more advanced search features later

CREATE OR REPLACE FUNCTION search_encounters(search_query TEXT)
RETURNS TABLE (
  id UUID,
  photo_url TEXT,
  description TEXT,
  location TEXT,
  breed TEXT,
  size TEXT,
  mood TEXT,
  likes INTEGER,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.photo_url,
    e.description,
    e.location,
    e.breed,
    e.size,
    e.mood,
    e.likes,
    e.user_id,
    e.created_at,
    ts_rank(
      to_tsvector('english', 
        COALESCE(e.description, '') || ' ' || 
        COALESCE(e.breed, '') || ' ' || 
        COALESCE(e.size, '') || ' ' || 
        COALESCE(e.mood, '')
      ),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM "Encounters" e
  WHERE 
    to_tsvector('english', 
      COALESCE(e.description, '') || ' ' || 
      COALESCE(e.breed, '') || ' ' || 
      COALESCE(e.size, '') || ' ' || 
      COALESCE(e.mood, '')
    ) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: Add index on created_at for faster sorting
-- ============================================
-- This index already exists, but ensuring it's there
CREATE INDEX IF NOT EXISTS idx_encounters_created_at ON "Encounters"(created_at DESC);

-- ============================================
-- STEP 4: Add index on likes for popularity sorting
-- ============================================
-- This index already exists, but ensuring it's there
CREATE INDEX IF NOT EXISTS idx_encounters_likes ON "Encounters"(likes DESC);

-- ============================================
-- Notes:
-- ============================================
-- 1. The GIN index (idx_encounters_search) enables fast full-text search
-- 2. The search_encounters function provides ranked results (optional)
-- 3. For now, the app uses ILIKE pattern matching which is simpler
-- 4. You can upgrade to use the search_encounters function later for better results
-- 5. The index will be automatically maintained as new encounters are added

