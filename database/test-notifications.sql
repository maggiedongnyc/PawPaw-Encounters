-- Test Notifications Setup
-- Run this to verify notifications are working

-- ============================================
-- STEP 1: Check if Notifications table exists
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'Notifications';

-- ============================================
-- STEP 2: Check if functions exist
-- ============================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_notification', 'get_unread_notification_count', 'mark_notifications_read');

-- ============================================
-- STEP 3: Check if triggers exist
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trigger_notify_on_comment', 'trigger_notify_on_like');

-- ============================================
-- STEP 4: Check RLS status on Comments and Likes
-- ============================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('Comments', 'Likes');

-- ============================================
-- STEP 5: Test notification creation manually
-- ============================================
-- Replace 'YOUR_USER_ID' with an actual user ID from your auth.users table
-- SELECT create_notification(
--   'YOUR_USER_ID'::TEXT,
--   'like',
--   'YOUR_ENCOUNTER_ID'::UUID,
--   NULL,
--   'ANOTHER_USER_ID'::TEXT
-- );

-- ============================================
-- STEP 6: Check recent notifications
-- ============================================
SELECT 
  id,
  user_id,
  type,
  encounter_id,
  from_user_id,
  read,
  created_at
FROM "Notifications"
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 7: Check unread count for a user
-- ============================================
-- Replace 'YOUR_USER_ID' with an actual user ID
-- SELECT get_unread_notification_count('YOUR_USER_ID');

