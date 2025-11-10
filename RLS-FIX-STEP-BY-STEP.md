# How to Fix RLS Error - Step by Step

## What is RLS?
RLS (Row Level Security) is a feature in Supabase that controls who can read/write data. When it's enabled, you need special "policies" (rules) to allow access.

## The Problem
You're getting: **"new row violates row-level security policy"**

This means RLS is **enabled** on your `Encounters` table, but there's no policy allowing you to insert data.

## Solution: Disable RLS (Easiest for Testing)

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Log in and select your project

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

### Step 3: Run This SQL
Copy and paste this EXACT code:

```sql
ALTER TABLE Encounters DISABLE ROW LEVEL SECURITY;
```

### Step 4: Execute
1. Click the **"Run"** button (or press Cmd/Ctrl + Enter)
2. You should see: "Success. No rows returned"

### Step 5: Verify It Worked
Run this query to check:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Encounters';
```

Look at the `rowsecurity` column:
- If it says `false` → ✅ RLS is disabled (good!)
- If it says `true` → ❌ RLS is still enabled (try again)

### Step 6: Restart Your App
1. Stop your Next.js server (press Ctrl+C in terminal)
2. Start it again: `npm run dev`
3. Try uploading an encounter again

## Alternative: Enable RLS But Add Policies

If you want to keep RLS enabled (for security), you need to add policies:

```sql
-- Make sure RLS is enabled
ALTER TABLE Encounters ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Allow public read access on Encounters"
  ON Encounters FOR SELECT
  USING (true);

-- Allow anyone to insert
CREATE POLICY "Allow public insert access on Encounters"
  ON Encounters FOR INSERT
  WITH CHECK (true);
```

## Still Not Working?

1. **Check the Supabase Dashboard:**
   - Go to **Table Editor** → **Encounters**
   - Click the **"..."** menu → **"View Policies"**
   - See if any policies exist

2. **Clear Browser Cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

3. **Check Your Code:**
   - Make sure you're using the correct table name: `Encounters` (capital E)

4. **Try a Different Browser:**
   - Sometimes browser cache can cause issues

## Quick Checklist

- [ ] Ran `ALTER TABLE Encounters DISABLE ROW LEVEL SECURITY;` in SQL Editor
- [ ] Verified `rowsecurity` is `false`
- [ ] Restarted Next.js dev server
- [ ] Cleared browser cache
- [ ] Tried uploading again

If you've done all these and it still doesn't work, the issue might be something else!

