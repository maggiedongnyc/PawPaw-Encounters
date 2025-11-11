-- ============================================
-- Find Missing Components
-- Run this to see exactly what's missing
-- ============================================

-- Check which functions are missing
SELECT 
  'Missing Functions' as check_type,
  function_name as missing_item,
  'Run the schema file that contains this function' as action
FROM (
  VALUES 
    ('create_notification'),
    ('mark_notifications_read'),
    ('get_unread_notification_count'),
    ('sync_encounter_likes_count'),
    ('search_encounters')
) AS required(function_name)
WHERE NOT EXISTS (
  SELECT 1 
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name = required.function_name
);

-- Check which triggers are missing
SELECT 
  'Missing Triggers' as check_type,
  trigger_name as missing_item,
  CASE 
    WHEN trigger_name = 'trigger_notify_on_comment' THEN 'Run: database/notifications-schema.sql'
    WHEN trigger_name = 'trigger_notify_on_like' THEN 'Run: database/notifications-schema.sql'
    WHEN trigger_name = 'trigger_sync_likes_count' THEN 'Run: database/likes-schema.sql'
  END as action
FROM (
  VALUES 
    ('trigger_notify_on_comment'),
    ('trigger_notify_on_like'),
    ('trigger_sync_likes_count')
) AS required(trigger_name)
WHERE NOT EXISTS (
  SELECT 1 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public' 
    AND trigger_name = required.trigger_name
);

-- Show which functions DO exist (for comparison)
SELECT 
  'Existing Functions' as check_type,
  routine_name as existing_item,
  '✅ Present' as status
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

-- Show which triggers DO exist (for comparison)
SELECT 
  'Existing Triggers' as check_type,
  trigger_name as existing_item,
  event_object_table as table_name,
  '✅ Present' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_notify_on_comment',
    'trigger_notify_on_like',
    'trigger_sync_likes_count'
  )
ORDER BY trigger_name;

