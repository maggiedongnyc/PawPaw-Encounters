-- ============================================
-- Database Schema Verification Script
-- Run this in Supabase SQL Editor to check if all schemas are in place
-- ============================================

-- 1. Check Required Tables
SELECT 
  'Tables' as category,
  table_name as name,
  CASE 
    WHEN table_name IN ('Encounters', 'Comments', 'Likes', 'Notifications', 'UserProfiles')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('Encounters', 'Comments', 'Likes', 'Notifications', 'UserProfiles', 'Badges')
ORDER BY table_name;

-- 2. Check Required Columns in Encounters Table
SELECT 
  'Encounters Columns' as category,
  column_name as name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'photo_url', 'description', 'location', 'user_id', 'created_at', 'breed', 'size', 'mood', 'likes')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Encounters'
ORDER BY ordinal_position;

-- 3. Check Required Columns in Comments Table
SELECT 
  'Comments Columns' as category,
  column_name as name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'encounter_id', 'user_id', 'comment', 'created_at')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Comments'
ORDER BY ordinal_position;

-- 4. Check Required Columns in Likes Table
SELECT 
  'Likes Columns' as category,
  column_name as name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'encounter_id', 'created_at')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Likes'
ORDER BY ordinal_position;

-- 5. Check Required Columns in Notifications Table
SELECT 
  'Notifications Columns' as category,
  column_name as name,
  data_type,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'type', 'read', 'created_at')
    THEN '✅ Required'
    ELSE '⚠️ Optional'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Notifications'
ORDER BY ordinal_position;

-- 6. Check Required Functions (RPC)
SELECT 
  'Functions' as category,
  routine_name as name,
  routine_type,
  '✅ Found' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_notification',
    'mark_notifications_read',
    'get_unread_notification_count',
    'sync_encounter_likes_count',
    'search_encounters'
  )
ORDER BY routine_name;

-- 7. Check Required Triggers
SELECT 
  'Triggers' as category,
  trigger_name as name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  '✅ Found' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_notify_on_comment',
    'trigger_notify_on_like',
    'trigger_sync_likes_count'
  )
ORDER BY trigger_name;

-- 8. Check Required Views
SELECT 
  'Views' as category,
  table_name as name,
  '✅ Found' as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('UserStatistics')
ORDER BY table_name;

-- 9. Check Required Indexes
SELECT 
  'Indexes' as category,
  indexname as name,
  tablename as table_name,
  '✅ Found' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%encounter%' OR
    indexname LIKE '%comment%' OR
    indexname LIKE '%like%' OR
    indexname LIKE '%notification%' OR
    indexname LIKE '%search%' OR
    indexname LIKE '%user%'
  )
ORDER BY tablename, indexname;

-- 10. Summary Check - Quick Status
SELECT 
  'SUMMARY' as category,
  'Total Tables' as name,
  COUNT(*)::text as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('Encounters', 'Comments', 'Likes', 'Notifications', 'UserProfiles')

UNION ALL

SELECT 
  'SUMMARY' as category,
  'Total Functions' as name,
  COUNT(*)::text as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_notification',
    'mark_notifications_read',
    'get_unread_notification_count',
    'sync_encounter_likes_count',
    'search_encounters'
  )

UNION ALL

SELECT 
  'SUMMARY' as category,
  'Total Triggers' as name,
  COUNT(*)::text as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_notify_on_comment',
    'trigger_notify_on_like',
    'trigger_sync_likes_count'
  )

UNION ALL

SELECT 
  'SUMMARY' as category,
  'Total Views' as name,
  COUNT(*)::text as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'UserStatistics';

-- ============================================
-- Quick Verification Checklist
-- ============================================
-- Run the queries above and check:
-- 
-- ✅ REQUIRED TABLES (5):
--    - Encounters
--    - Comments
--    - Likes
--    - Notifications
--    - UserProfiles (or UserStatistics view)
--
-- ✅ REQUIRED FUNCTIONS (5):
--    - create_notification
--    - mark_notifications_read
--    - get_unread_notification_count
--    - update_encounter_likes_count
--    - search_encounters
--
-- ✅ REQUIRED TRIGGERS (3):
--    - trigger_notify_on_comment
--    - trigger_notify_on_like
--    - trigger_update_encounter_likes_count
--
-- ✅ REQUIRED VIEWS (1):
--    - UserStatistics
--
-- ============================================

