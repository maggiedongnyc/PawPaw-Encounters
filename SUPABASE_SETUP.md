# Supabase Setup Guide

Follow these steps to set up your Supabase backend for Doggo Encounters.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `doggo-encounters` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest region
5. Wait for the project to be created (takes a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Set Up Environment Variables

1. In your project root, create `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Open `.env.local` and add your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

This will create:
- The `Encounters` table with all required columns
- Row Level Security (RLS) policies for public read/insert access
- An index on `created_at` for faster sorting

## Step 5: Create the Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `photos`
   - **Public bucket**: ✅ **Enable this** (so images can be accessed publicly)
   - **File size limit**: Leave default or set your preferred limit
   - **Allowed MIME types**: Leave empty (allows all types) or specify `image/*`
4. Click **Create bucket**

## Step 6: Set Up Storage Policies (Optional but Recommended)

1. Go to **Storage** → **policies** (or click on the `photos` bucket → **Policies**)
2. Create a policy for public read access:
   - Click **New Policy**
   - Policy name: `Public read access`
   - Allowed operation: `SELECT`
   - Policy definition: `true`
   - Click **Save**

3. Create a policy for public upload access:
   - Click **New Policy**
   - Policy name: `Public upload access`
   - Allowed operation: `INSERT`
   - Policy definition: `true`
   - Click **Save**

Alternatively, you can use the SQL Editor to create these policies:

```sql
-- Allow public read access to photos
CREATE POLICY "Public read access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'photos');

-- Allow public upload access to photos
CREATE POLICY "Public upload access"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'photos');
```

## Step 7: Verify Setup

1. **Test the database**:
   - Go to **Table Editor** → `Encounters`
   - You should see an empty table with columns: `id`, `photo_url`, `description`, `location`, `created_at`

2. **Test the storage**:
   - Go to **Storage** → `photos`
   - The bucket should be empty and ready for uploads

## Step 8: Install Dependencies and Run

1. Install npm packages:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000/upload` and try uploading an encounter!

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` exists and has the correct variable names
- Restart your Next.js dev server after creating/updating `.env.local`

### "new row violates row-level security policy" error
- Make sure you've run the RLS policies from `supabase-setup.sql`
- Check that the policies allow the operation you're trying to perform

### "The resource already exists" error
- The table or bucket already exists - this is fine, you can skip that step

### Images not displaying
- Make sure the `photos` bucket is set to **Public**
- Check that storage policies allow public read access

## Security Notes

The current setup allows **public read and insert** access. This is fine for a personal project or demo, but for production:

- Consider adding authentication (Supabase Auth)
- Restrict RLS policies to authenticated users only
- Add file size and type validation
- Consider adding rate limiting

