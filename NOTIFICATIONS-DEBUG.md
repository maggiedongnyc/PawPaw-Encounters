# Notifications Debugging Guide

## Issue: Notifications not showing in bell

### Step 1: Verify Database Setup

Run `database/test-notifications.sql` in Supabase SQL Editor to check:
- ✅ Notifications table exists
- ✅ Functions exist (`create_notification`, `get_unread_notification_count`)
- ✅ Triggers exist (`trigger_notify_on_comment`, `trigger_notify_on_like`)
- ✅ RLS is disabled on Comments and Likes tables

### Step 2: Check Console Logs

Open browser console and look for:

1. **Subscription Status**: Should see `"Notification subscription status: SUBSCRIBED"`
   - If you see `CLOSED`, the real-time connection isn't working
   - Check Supabase project settings for real-time enabled

2. **Notification Creation**: When you like/comment, look for:
   - `"Notification created successfully: ..."`
   - If you see errors, check the error details

3. **Unread Count**: Should see:
   - `"Notification unread count: X for user: ..."`
   - If it's always 0, notifications aren't being created

### Step 3: Test Notification Creation Manually

Run this in Supabase SQL Editor (replace with your user IDs):

```sql
-- Get your user ID
SELECT id, email FROM auth.users LIMIT 5;

-- Get an encounter ID
SELECT id, user_id FROM "Encounters" LIMIT 5;

-- Create a test notification
SELECT create_notification(
  'YOUR_ENCOUNTER_OWNER_USER_ID'::TEXT,
  'like',
  'YOUR_ENCOUNTER_ID'::UUID,
  NULL,
  'YOUR_LIKER_USER_ID'::TEXT
);

-- Check if notification was created
SELECT * FROM "Notifications" ORDER BY created_at DESC LIMIT 5;

-- Check unread count
SELECT get_unread_notification_count('YOUR_ENCOUNTER_OWNER_USER_ID');
```

### Step 4: Check Real-Time Subscription

The subscription might be failing. Check:

1. **Supabase Dashboard** → Settings → API → Realtime
   - Ensure "Realtime" is enabled
   - Check if there are any connection limits

2. **Browser Console**:
   - Look for `"Successfully subscribed to notifications for user: ..."`
   - If you see `"Notification subscription closed"`, there's a connection issue

### Step 5: Verify Triggers Are Working

Test if triggers fire when you insert a comment:

```sql
-- Insert a test comment (replace with real IDs)
INSERT INTO "Comments" (encounter_id, user_id, comment)
VALUES (
  'YOUR_ENCOUNTER_ID'::UUID,
  'YOUR_USER_ID'::TEXT,
  'Test comment'
);

-- Check if notification was created
SELECT * FROM "Notifications" WHERE type = 'comment' ORDER BY created_at DESC LIMIT 1;
```

### Step 6: Check RLS Policies

If RLS is enabled, it might be blocking inserts. Run:

```sql
-- Disable RLS on Notifications (if needed)
ALTER TABLE "Notifications" DISABLE ROW LEVEL SECURITY;

-- Or check current policies
SELECT * FROM pg_policies WHERE tablename = 'Notifications';
```

### Common Issues:

1. **Triggers not firing**: 
   - Check if triggers exist: `SELECT * FROM information_schema.triggers WHERE trigger_name LIKE '%notify%';`
   - Re-run `database/notifications-schema.sql` Steps 7-8

2. **RLS blocking inserts**:
   - Disable RLS: `ALTER TABLE "Notifications" DISABLE ROW LEVEL SECURITY;`

3. **Real-time not working**:
   - Check Supabase project settings
   - Try refreshing the page
   - Check browser console for WebSocket errors

4. **Type mismatch errors**:
   - Ensure `user_id` columns are TEXT (not UUID)
   - Re-run the fixed trigger functions from `database/notifications-schema.sql`

### Quick Fix Script

Run this to reset everything:

```sql
-- 1. Disable RLS
ALTER TABLE "Notifications" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Likes" DISABLE ROW LEVEL SECURITY;

-- 2. Re-create triggers (from notifications-schema.sql Steps 7-8)
-- (Copy the trigger functions from notifications-schema.sql)
```

