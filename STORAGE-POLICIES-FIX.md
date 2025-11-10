# Storage Policies Fix - RLS Error Still Happening

## The Problem

You're getting "new row violates row-level security policy" error even though:
- ✅ Table RLS is disabled (`rowsecurity = false`)
- ✅ Table name matches (`Encounters`)
- ✅ Bucket name matches (`dog-photos`)

## The Real Issue

The error is likely coming from **Storage Bucket Policies**, not the table RLS!

When you upload a photo, Supabase Storage also has policies that control who can upload files. If these policies aren't set up correctly, you'll get an RLS error even though the table RLS is disabled.

## Solution: Set Up Storage Bucket Policies

### Option 1: Via SQL (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Drop any existing policies
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Create policy to allow public uploads
CREATE POLICY "Allow public uploads to dog-photos"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'dog-photos');

-- Create policy to allow public reads
CREATE POLICY "Allow public reads from dog-photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'dog-photos');
```

### Option 2: Via Supabase Dashboard

1. Go to **Storage** in Supabase Dashboard
2. Click on **`dog-photos`** bucket
3. Click on **Policies** tab
4. Click **New Policy**
5. Create two policies:

**Policy 1: Public Upload**
- Policy name: `Allow public uploads`
- Allowed operation: `INSERT`
- Policy definition: `bucket_id = 'dog-photos'`
- Target roles: `public`

**Policy 2: Public Read**
- Policy name: `Allow public reads`
- Allowed operation: `SELECT`
- Policy definition: `bucket_id = 'dog-photos'`
- Target roles: `public`

## Verify It Worked

After creating the policies, try uploading again. The error should be gone!

## Why This Happens

Supabase Storage uses the same RLS system as tables. Even though your table RLS is disabled, storage buckets have their own policies that need to be configured separately.

## Complete Fix Checklist

- [ ] Table RLS is disabled ✅ (you confirmed this)
- [ ] Storage bucket policies are set up (do this now!)
- [ ] Bucket is set to public ✅ (you confirmed this)
- [ ] Restart Next.js server
- [ ] Try uploading again

