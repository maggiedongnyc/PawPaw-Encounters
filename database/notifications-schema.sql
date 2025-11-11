-- Notifications Database Schema
-- Run this in your Supabase SQL Editor to enable notifications

-- ============================================
-- STEP 1: Create Notifications table
-- ============================================
-- Drop table if you want to start fresh (uncomment if needed)
-- DROP TABLE IF EXISTS "Notifications" CASCADE;

CREATE TABLE IF NOT EXISTS "Notifications" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- The user who receives the notification
  type TEXT NOT NULL, -- 'comment', 'like', 'follow', 'mention', etc.
  encounter_id UUID REFERENCES "Encounters"(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES "Comments"(id) ON DELETE CASCADE,
  from_user_id TEXT, -- The user who triggered the notification (e.g., who commented/liked)
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "Notifications"(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON "Notifications"(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "Notifications"(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_encounter_id ON "Notifications"(encounter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_from_user_id ON "Notifications"(from_user_id);

-- ============================================
-- STEP 3: Create function to create notification
-- ============================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id TEXT,
  p_type TEXT,
  p_encounter_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_from_user_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't create notification if user is notifying themselves
  IF p_user_id = p_from_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO "Notifications" (
    user_id,
    type,
    encounter_id,
    comment_id,
    from_user_id
  ) VALUES (
    p_user_id,
    p_type,
    p_encounter_id,
    p_comment_id,
    p_from_user_id
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: Create function to mark notifications as read
-- ============================================
-- Drop function if it exists (will be recreated with CREATE OR REPLACE)
-- DROP FUNCTION IF EXISTS mark_notifications_read(TEXT, UUID[]);

CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id TEXT,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL OR array_length(p_notification_ids, 1) IS NULL THEN
    -- Mark all notifications as read for user
    UPDATE "Notifications"
    SET read = TRUE
    WHERE user_id = p_user_id AND read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    -- Mark specific notifications as read
    UPDATE "Notifications"
    SET read = TRUE
    WHERE user_id = p_user_id 
      AND id = ANY(p_notification_ids)
      AND read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Create function to get unread count
-- ============================================
-- Drop function if it exists (will be recreated with CREATE OR REPLACE)
-- DROP FUNCTION IF EXISTS get_unread_notification_count(TEXT);

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM "Notifications"
  WHERE user_id = p_user_id AND read = FALSE;

  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Enable Row Level Security (optional)
-- ============================================
-- Uncomment if you want to enable RLS
-- ALTER TABLE "Notifications" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own notifications
-- CREATE POLICY "Users can read own notifications" ON "Notifications"
--   FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: System can create notifications (adjust based on your auth setup)
-- CREATE POLICY "Allow notification creation" ON "Notifications"
--   FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read)
-- CREATE POLICY "Users can update own notifications" ON "Notifications"
--   FOR UPDATE USING (auth.uid()::text = user_id);

-- ============================================
-- STEP 7: Create trigger to auto-create notification on comment
-- ============================================
-- This trigger will automatically create a notification when someone comments on an encounter
-- Note: This trigger will NOT fail the comment insert if notification creation fails
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  encounter_owner_id TEXT;
  comment_user_id TEXT;
BEGIN
  -- Ensure both user_ids are TEXT for comparison
  comment_user_id := NEW.user_id::TEXT;
  
  -- Get the encounter owner's user_id
  SELECT user_id::TEXT INTO encounter_owner_id
  FROM "Encounters"
  WHERE id = NEW.encounter_id;

  -- Create notification for encounter owner (if they exist and it's not their own comment)
  -- Use exception handling to prevent trigger from failing the comment insert
  IF encounter_owner_id IS NOT NULL AND encounter_owner_id != comment_user_id THEN
    BEGIN
      PERFORM create_notification(
        encounter_owner_id,
        'comment',
        NEW.encounter_id,
        NEW.id,
        comment_user_id
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the comment insert
        -- You can check Supabase logs for these errors
        RAISE WARNING 'Failed to create notification for comment %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_notify_on_comment ON "Comments";
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON "Comments"
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- ============================================
-- STEP 8: Create trigger to auto-create notification on like
-- ============================================
-- This trigger will automatically create a notification when someone likes an encounter
-- Note: This requires the "Likes" table (from likes-schema.sql)

CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  encounter_owner_id TEXT;
  like_user_id TEXT;
BEGIN
  -- Ensure both user_ids are TEXT for comparison
  like_user_id := NEW.user_id::TEXT;
  
  -- Get the encounter owner's user_id
  SELECT user_id::TEXT INTO encounter_owner_id
  FROM "Encounters"
  WHERE id = NEW.encounter_id;

  -- Create notification for encounter owner (if they exist and it's not their own like)
  -- Use exception handling to prevent trigger from failing the like insert
  IF encounter_owner_id IS NOT NULL AND encounter_owner_id != like_user_id THEN
    BEGIN
      PERFORM create_notification(
        encounter_owner_id,
        'like',
        NEW.encounter_id,
        NULL,
        like_user_id
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the like insert
        RAISE WARNING 'Failed to create notification for like %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
-- Note: This will only work if the Likes table exists (from likes-schema.sql)
DROP TRIGGER IF EXISTS trigger_notify_on_like ON "Likes";
CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON "Likes"
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_like();

