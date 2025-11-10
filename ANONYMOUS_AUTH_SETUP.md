# Anonymous Authentication Setup Guide

This guide explains how to set up anonymous authentication for the PawPaw Encounters app.

## Overview

The app uses Supabase anonymous authentication to:
- Identify users uniquely across sessions
- Associate uploads, likes, and comments with specific users
- Secure data with Row-Level Security (RLS) policies
- Provide instant access without login forms

## Setup Steps

### 1. Run Database Schema Migration

Run the SQL script in your Supabase SQL Editor:

```bash
# File: anonymous-auth-schema.sql
```

This script will:
- Update `user_id` columns to UUID type (references `auth.users.id`)
- Enable Row-Level Security (RLS) on all tables
- Create RLS policies for secure data access
- Update indexes for performance

### 2. Enable Anonymous Authentication in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Anonymous** authentication
4. Save changes

### 3. Verify Environment Variables

Ensure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. How It Works

#### Authentication Flow

1. **App Load**: When the app loads, `useAuth()` hook automatically:
   - Checks for existing session
   - If no session exists, signs in anonymously
   - Persists session in browser storage

2. **User Actions**: All user actions (uploads, comments, likes) use the authenticated `user.id`

3. **Session Persistence**: Sessions persist across browser sessions using Supabase's built-in storage

#### Code Structure

- **`lib/supabase.ts`**: Supabase client with auth configuration
- **`lib/auth.ts`**: `useAuth()` hook for anonymous authentication
- **`app/page.tsx`**: Uses `useAuth()` to get authenticated user
- **`app/upload/page.tsx`**: Uses authenticated `user.id` for uploads
- **`components/Comments.tsx`**: Uses authenticated `user.id` for comments

### 5. RLS Policies

The app uses Row-Level Security (RLS) to ensure:

- **View Access**: Anyone can view all encounters, comments, and badges
- **Insert Access**: Only authenticated users can insert, and only their own data
- **Update Access**: Users can only update their own data
- **Delete Access**: Users can only delete their own data

### 6. Testing

1. **Clear Browser Storage**: Clear localStorage to test anonymous sign-in
2. **Check Console**: Look for authentication logs
3. **Verify User ID**: Check that uploads/comments have valid UUID `user_id`
4. **Test RLS**: Try to update/delete another user's data (should fail)

## Troubleshooting

### Issue: "User not authenticated" errors

**Solution**: Ensure anonymous authentication is enabled in Supabase Dashboard

### Issue: RLS policies blocking access

**Solution**: Verify RLS policies are correctly set up in `anonymous-auth-schema.sql`

### Issue: user_id is still TEXT instead of UUID

**Solution**: Run the schema migration script again to update column types

### Issue: Session not persisting

**Solution**: Check that `persistSession: true` is set in `lib/supabase.ts`

## Security Notes

- Anonymous users are real Supabase users (in `auth.users` table)
- Each anonymous user gets a unique UUID
- Sessions are stored securely in browser storage
- RLS policies prevent users from modifying others' data
- Users can be upgraded to full accounts later if needed

