-- ============================================
-- Quick Schema Check - Run this first for a fast overview
-- ============================================

-- Check if all critical tables exist
SELECT 
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ All required tables exist'
    ELSE '❌ Missing tables: ' || (5 - COUNT(*))::text || ' table(s) missing'
  END as tables_status,
  string_agg(table_name, ', ' ORDER BY table_name) as found_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('Encounters', 'Comments', 'Likes', 'Notifications', 'UserProfiles');

-- Check if all critical functions exist
SELECT 
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Critical functions exist'
    ELSE '❌ Missing functions: ' || (4 - COUNT(*))::text || ' function(s) missing'
  END as functions_status,
  string_agg(routine_name, ', ' ORDER BY routine_name) as found_functions
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_notification',
    'mark_notifications_read',
    'get_unread_notification_count',
    'sync_encounter_likes_count',
    'search_encounters'
  );

-- Check if all critical triggers exist
SELECT 
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ Critical triggers exist'
    ELSE '❌ Missing triggers: ' || (2 - COUNT(*))::text || ' trigger(s) missing'
  END as triggers_status,
  string_agg(trigger_name, ', ' ORDER BY trigger_name) as found_triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_notify_on_comment',
    'trigger_notify_on_like',
    'trigger_sync_likes_count'
  );

-- Overall Status
SELECT 
  CASE 
    WHEN 
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Encounters', 'Comments', 'Likes', 'Notifications', 'UserProfiles')) = 5
      AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('create_notification', 'mark_notifications_read', 'get_unread_notification_count', 'sync_encounter_likes_count', 'search_encounters')) >= 4
      AND (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public' AND trigger_name IN ('trigger_notify_on_comment', 'trigger_notify_on_like', 'trigger_sync_likes_count')) >= 2
    THEN '✅ All schemas are in place!'
    ELSE '⚠️ Some schemas are missing. Run verify-schemas.sql for details.'
  END as overall_status;

