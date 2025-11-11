# Database Schema Verification Guide

This guide helps you verify that all required database schemas are properly set up in your Supabase project.

## Quick Start

### Option 1: Quick Check (Recommended First Step)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `database/quick-check.sql`
3. Click **Run**
4. Review the results:
   - ✅ Green checkmarks = Everything is set up
   - ❌ Red X marks = Missing components

### Option 2: Detailed Verification

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `database/verify-schemas.sql`
3. Click **Run**
4. Review each section to see what's present and what's missing

## What to Check

### ✅ Required Tables (5)

| Table Name | Purpose | Schema File |
|------------|---------|-------------|
| `Encounters` | Main dog encounter data | `enhanced-schema.sql` or base schema |
| `Comments` | User comments on encounters | `enhanced-schema.sql` or base schema |
| `Likes` | User likes on encounters | `database/likes-schema.sql` |
| `Notifications` | In-app notifications | `database/notifications-schema.sql` |
| `UserProfiles` | User profile information | `database/user-profiles-schema.sql` |

### ✅ Required Functions (5)

| Function Name | Purpose | Schema File |
|---------------|---------|-------------|
| `create_notification` | Creates a notification | `database/notifications-schema.sql` |
| `mark_notifications_read` | Marks notifications as read | `database/notifications-schema.sql` |
| `get_unread_notification_count` | Gets unread notification count | `database/notifications-schema.sql` |
| `update_encounter_likes_count` | Updates like count on encounters | `database/likes-schema.sql` |
| `search_encounters` | Full-text search | `database/search-schema.sql` |

### ✅ Required Triggers (3)

| Trigger Name | Table | Purpose | Schema File |
|--------------|-------|---------|-------------|
| `trigger_notify_on_comment` | `Comments` | Creates notification when comment is added | `database/notifications-schema.sql` |
| `trigger_notify_on_like` | `Likes` | Creates notification when like is added | `database/notifications-schema.sql` |
| `trigger_update_encounter_likes_count` | `Likes` | Updates encounter like count | `database/likes-schema.sql` |

### ✅ Required Views (1)

| View Name | Purpose | Schema File |
|-----------|---------|-------------|
| `UserStatistics` | Aggregated user stats (encounters, likes, comments) | `database/user-profiles-schema.sql` |

## Step-by-Step Setup

If verification shows missing components, run these SQL files in order:

1. **Base Schema** (if not already done):
   - Run your main `enhanced-schema.sql` or base schema file
   - This creates `Encounters` and `Comments` tables

2. **Likes System**:
   ```sql
   -- Run: database/likes-schema.sql
   ```
   - Creates `Likes` table
   - Creates `update_encounter_likes_count()` function
   - Creates `trigger_update_encounter_likes_count` trigger

3. **Notifications System**:
   ```sql
   -- Run: database/notifications-schema.sql
   ```
   - Creates `Notifications` table
   - Creates notification functions
   - Creates notification triggers

4. **Search System**:
   ```sql
   -- Run: database/search-schema.sql
   ```
   - Creates search index on `Encounters`
   - Creates `search_encounters()` function

5. **User Profiles**:
   ```sql
   -- Run: database/user-profiles-schema.sql
   ```
   - Creates `UserProfiles` table (if needed)
   - Creates `UserStatistics` view

## Common Issues

### Issue: "Table does not exist"
**Solution**: Run the corresponding schema file from the `database/` folder

### Issue: "Function does not exist"
**Solution**: The function might be in a schema file you haven't run yet. Check the table above for the correct file.

### Issue: "Trigger does not exist"
**Solution**: Triggers are created by the schema files. Make sure you've run:
- `notifications-schema.sql` for notification triggers
- `likes-schema.sql` for like count trigger

### Issue: "Permission denied"
**Solution**: Make sure you're running the SQL as a database admin or with proper permissions.

## Verification Checklist

After running the verification scripts, you should see:

- [ ] 5 tables exist (Encounters, Comments, Likes, Notifications, UserProfiles)
- [ ] 5 functions exist (create_notification, mark_notifications_read, get_unread_notification_count, update_encounter_likes_count, search_encounters)
- [ ] 3 triggers exist (trigger_notify_on_comment, trigger_notify_on_like, trigger_update_encounter_likes_count)
- [ ] 1 view exists (UserStatistics)

## Testing After Setup

Once all schemas are verified, test the functionality:

1. **Likes**: Like an encounter and verify the count updates
2. **Comments**: Add a comment and verify a notification is created
3. **Search**: Use the search bar and verify results appear
4. **Notifications**: Check that the notification bell shows unread count
5. **Profiles**: View a user profile and verify stats are displayed

## Need Help?

If verification shows missing components:
1. Check which schema files you've run
2. Run the missing schema files in the order listed above
3. Re-run the verification script
4. If issues persist, check the Supabase logs for error messages

