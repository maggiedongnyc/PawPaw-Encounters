# RLS Error Troubleshooting - Complete Guide

You're still getting "new row violates row-level security policy" error. Let's fix this step by step.

## Step 1: Verify RLS Status in Supabase

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Run this query:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Encounters';
```

**What to look for:**
- If `rowsecurity` = `true` → RLS is ENABLED (this is the problem!)
- If `rowsecurity` = `false` → RLS is disabled (but you're still getting error, see Step 3)

## Step 2: Disable RLS (if still enabled)

If Step 1 shows `rowsecurity` = `true`, run this:

```sql
ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;
```

**Important:** Use double quotes around `"Encounters"` because PostgreSQL is case-sensitive!

After running, verify again with Step 1 query. `rowsecurity` should now be `false`.

## Step 3: Check for Active Policies

Even if RLS is disabled, sometimes policies can cause issues. Run this to check:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'Encounters';
```

If you see any policies listed, drop them:

```sql
DROP POLICY IF EXISTS "Allow public read access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow public insert access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow authenticated users to read Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow authenticated users to insert Encounters" ON "Encounters";
```

## Step 4: Check Table Name Case Sensitivity

PostgreSQL is case-sensitive with quoted names. Check the exact table name:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%encounter%';
```

This will show you the EXACT case of your table name. Then use that exact name (with quotes) in the ALTER TABLE command.

## Step 5: Complete RLS Disable Script

Run this complete script to ensure everything is disabled:

```sql
-- Step 1: Drop all policies
DROP POLICY IF EXISTS "Allow public read access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow public insert access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow authenticated users to read Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow authenticated users to insert Encounters" ON "Encounters";

-- Step 2: Disable RLS
ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Encounters';
```

## Step 6: Restart Everything

After making changes in Supabase:

1. **Stop your Next.js server** (Ctrl+C in terminal)
2. **Restart it:**
   ```bash
   npm run dev
   ```
3. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or use incognito/private browsing mode
4. **Try uploading again**

## Step 7: Alternative - Enable RLS with Proper Policies

If disabling RLS doesn't work, try enabling it WITH proper policies:

```sql
-- Enable RLS
ALTER TABLE "Encounters" ENABLE ROW LEVEL SECURITY;

-- Drop old policies first
DROP POLICY IF EXISTS "Allow public read access on Encounters" ON "Encounters";
DROP POLICY IF EXISTS "Allow public insert access on Encounters" ON "Encounters";

-- Create new policies
CREATE POLICY "Allow public read access on Encounters"
  ON "Encounters" FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on Encounters"
  ON "Encounters" FOR INSERT
  WITH CHECK (true);
```

## Common Issues

### Issue 1: Wrong Table Name Case
- **Problem:** Table is `"Encounters"` but you used `Encounters` (no quotes)
- **Solution:** Always use `"Encounters"` with double quotes in SQL

### Issue 2: Policies Still Active
- **Problem:** RLS disabled but policies still exist
- **Solution:** Drop all policies first, then disable RLS

### Issue 3: Browser/Server Cache
- **Problem:** Old RLS state cached
- **Solution:** Restart server, clear browser cache, try incognito mode

### Issue 4: Multiple Supabase Projects
- **Problem:** You're checking one project but app connects to another
- **Solution:** Verify `.env.local` has correct Supabase URL

## Final Checklist

- [ ] Verified `rowsecurity` = `false` in pg_tables query
- [ ] Dropped all existing policies
- [ ] Ran `ALTER TABLE "Encounters" DISABLE ROW LEVEL SECURITY;`
- [ ] Restarted Next.js dev server
- [ ] Cleared browser cache / tried incognito mode
- [ ] Verified `.env.local` has correct Supabase credentials
- [ ] Tried uploading again

If you've done ALL of these and still get the error, the issue might be something else entirely!

