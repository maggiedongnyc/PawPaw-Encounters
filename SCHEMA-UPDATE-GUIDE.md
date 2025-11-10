# Supabase Schema Update Guide

## Overview

This guide will help you update your Supabase database schema to match the playful UI/UX updates. The UI updates don't require new database columns, but we need to ensure all existing columns are properly set up.

## Quick Update

Run the `playful-ui-schema.sql` file in your Supabase SQL Editor. This script will:

1. ✅ Add missing columns to the `Encounters` table
2. ✅ Create `Comments` table (if it doesn't exist)
3. ✅ Create `Badges` table (if it doesn't exist)
4. ✅ Add performance indexes
5. ✅ Set default values for existing data

## Required Columns

### Encounters Table

The `Encounters` table needs these columns:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `photo_url` | TEXT | No | - | Photo URL from storage |
| `description` | TEXT | No | - | Encounter description |
| `location` | TEXT | No | - | JSON string: `{"lat": number, "lng": number, "name": string}` |
| `breed` | TEXT | Yes | NULL | Dog breed (optional) |
| `size` | TEXT | Yes | NULL | Dog size: small, medium, large, extra-large |
| `mood` | TEXT | Yes | NULL | Dog mood: happy, playful, calm, energetic, sleepy, curious |
| `likes` | INTEGER | Yes | 0 | Number of likes |
| `user_id` | TEXT | Yes | NULL | User identifier (currently 'anonymous') |
| `created_at` | TIMESTAMP | Yes | NOW() | Upload timestamp |

### Comments Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `encounter_id` | UUID | No | - | Foreign key to Encounters |
| `user_id` | TEXT | Yes | NULL | User identifier |
| `comment` | TEXT | No | - | Comment text |
| `created_at` | TIMESTAMP | Yes | NOW() | Comment timestamp |

### Badges Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | TEXT | No | - | User identifier |
| `badge_type` | TEXT | No | - | Badge type: first_upload, five_uploads, ten_uploads, twenty_uploads, fifty_uploads |
| `earned_at` | TIMESTAMP | Yes | NOW() | Badge earned timestamp |

## Step-by-Step Instructions

### Option 1: Run the Complete Script (Recommended)

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `playful-ui-schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Verify the output shows no errors

### Option 2: Manual Updates

If you prefer to update manually, follow these steps:

#### 1. Update Encounters Table

```sql
-- Add missing columns
ALTER TABLE "Encounters" 
  ADD COLUMN IF NOT EXISTS breed TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS mood TEXT,
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Ensure location is TEXT
ALTER TABLE "Encounters" ALTER COLUMN location TYPE TEXT;

-- Set default likes for existing rows
UPDATE "Encounters" SET likes = 0 WHERE likes IS NULL;
```

#### 2. Create Comments Table

```sql
CREATE TABLE IF NOT EXISTS "Comments" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES "Encounters"(id) ON DELETE CASCADE,
  user_id TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Create Badges Table

```sql
CREATE TABLE IF NOT EXISTS "Badges" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);
```

#### 4. Create Indexes

```sql
-- Encounters indexes
CREATE INDEX IF NOT EXISTS idx_encounters_user_id ON "Encounters"(user_id);
CREATE INDEX IF NOT EXISTS idx_encounters_breed ON "Encounters"(breed);
CREATE INDEX IF NOT EXISTS idx_encounters_size ON "Encounters"(size);
CREATE INDEX IF NOT EXISTS idx_encounters_mood ON "Encounters"(mood);
CREATE INDEX IF NOT EXISTS idx_encounters_likes ON "Encounters"(likes);
CREATE INDEX IF NOT EXISTS idx_encounters_created_at ON "Encounters"(created_at DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_encounter_id ON "Comments"(encounter_id);

-- Badges indexes
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON "Badges"(user_id);
```

## Verify Your Schema

After running the script, verify your schema with this query:

```sql
-- Check Encounters columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Encounters'
ORDER BY ordinal_position;

-- Check if Comments table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'Comments'
) AS comments_exists;

-- Check if Badges table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'Badges'
) AS badges_exists;
```

## RLS (Row Level Security)

The script includes options for RLS:

- **For Testing**: RLS is disabled by default (commented out)
- **For Production**: Uncomment the RLS policies section to enable public read/insert/update

### To Enable RLS (Production)

Uncomment the RLS section in `playful-ui-schema.sql` or run:

```sql
ALTER TABLE "Encounters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Badges" ENABLE ROW LEVEL SECURITY;

-- Then create policies (see the script for full policies)
```

## Storage Bucket

Make sure your storage bucket is set up:

1. Go to **Storage** in Supabase Dashboard
2. Ensure `dog-photos` bucket exists
3. Set bucket to **Public** (or configure policies)
4. Run `fix-storage-policies.sql` if needed

## Troubleshooting

### Error: "column already exists"
- This is fine! The script uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`
- The script will skip existing columns

### Error: "relation does not exist"
- Make sure you're using the correct table name: `"Encounters"` (with quotes, capital E)
- PostgreSQL is case-sensitive with quoted identifiers

### Error: "permission denied"
- Check your database user permissions
- Make sure you're running as a database admin

### Existing Data
- The script preserves all existing data
- It only adds missing columns and sets defaults
- No data will be deleted

## What Changed?

The UI updates are **frontend-only** - no new database columns were needed. However, the schema update ensures:

1. ✅ All columns exist (breed, size, mood, likes, user_id)
2. ✅ Default values are set (likes = 0)
3. ✅ Indexes are created for performance
4. ✅ Tables are created (Comments, Badges)
5. ✅ Data types are correct (location as TEXT for JSON)

## Next Steps

After running the schema update:

1. ✅ Test uploading a new encounter
2. ✅ Test liking an encounter
3. ✅ Test adding comments
4. ✅ Test badge earning
5. ✅ Verify leaderboard works

## Support

If you encounter any issues:

1. Check the Supabase SQL Editor for error messages
2. Verify table names match exactly (case-sensitive)
3. Check RLS policies if you're getting permission errors
4. Ensure storage bucket policies are set correctly

