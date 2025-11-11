# Like/Unlike Functionality Implementation

## Overview
The like/unlike functionality has been successfully implemented! Users can now like and unlike encounters, and the system tracks individual likes per user.

## What Was Implemented

### 1. Database Schema
**File:** `database/likes-schema.sql`

- Created `Likes` table with:
  - `id`, `encounter_id`, `user_id`, `created_at`
  - `UNIQUE(encounter_id, user_id)` constraint to prevent duplicate likes
- Created `sync_encounter_likes_count()` function to automatically update the likes count on the `Encounters` table
- Created trigger `trigger_sync_likes_count` to auto-update counts when likes are added/removed
- Added indexes for performance

### 2. API Functions
**File:** `lib/likes.ts`

- `hasUserLiked(encounterId, userId)` - Check if user has liked an encounter
- `likeEncounter(encounterId, userId)` - Like an encounter
- `unlikeEncounter(encounterId, userId)` - Unlike an encounter
- `getLikeCount(encounterId)` - Get like count (with fallback to Encounters.likes column)

### 3. LikeButton Component
**File:** `components/LikeButton.tsx`

- **Like/Unlike Toggle**: Button now toggles between liked/unliked states
- **Visual Feedback**: 
  - Red filled heart when liked
  - Gray outline heart when not liked
  - Pulse animation on click
- **State Management**: 
  - Checks if user has already liked on component mount
  - Optimistic UI updates
  - Reverts on error
- **User Experience**:
  - Disabled when not logged in
  - Shows loading state
  - Updates count immediately

### 4. Integration Updates

#### Home Page (`app/page.tsx`)
- Updated `handleLike` to accept new likes count
- Only creates notification when count increases (like, not unlike)
- Updates local state with new count

#### Encounter Detail Page (`app/encounter/[id]/page.tsx`)
- Updated `handleLike` to accept new likes count
- Only creates notification when count increases (like, not unlike)
- Updates encounter state with new count

## Setup Instructions

### Step 1: Run Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/likes-schema.sql`
4. Copy and paste the entire SQL script
5. Click **Run** to execute

This will:
- Create the `Likes` table
- Create the sync function and trigger
- Set up indexes

### Step 2: Verify Setup

After running the SQL:

1. Check that the `Likes` table exists
2. Check that the `sync_encounter_likes_count` function exists
3. Check that the `trigger_sync_likes_count` trigger exists

### Step 3: Test the Feature

1. **Sign in** to your app
2. **Like an encounter** - Heart should fill red, count should increase
3. **Click again** - Heart should become outline, count should decrease
4. **Refresh page** - Like state should persist (heart should be red if you liked it)
5. **Sign in as different user** - Should see different like states

## Features

### Like/Unlike Toggle
- Click once to like (heart fills red, count increases)
- Click again to unlike (heart becomes outline, count decreases)
- State persists across page refreshes

### Visual Feedback
- Red filled heart = liked
- Gray outline heart = not liked
- Pulse animation on click
- Smooth transitions

### Automatic Count Sync
- Database trigger automatically updates `Encounters.likes` count
- No manual count updates needed
- Count is always accurate

### Notification Integration
- Notifications are only created when liking (not unliking)
- Notification sent to encounter owner (if not the liker)

## Technical Notes

### Database Design
- `Likes` table tracks individual likes
- `UNIQUE(encounter_id, user_id)` prevents duplicate likes
- Trigger automatically syncs count to `Encounters.likes` column
- This allows for future features like "who liked this"

### Performance
- Indexes on `encounter_id`, `user_id`, and composite index
- Optimistic UI updates for instant feedback
- Efficient queries with single row checks

### Backward Compatibility
- Falls back to `Encounters.likes` column if `Likes` table doesn't exist
- Graceful error handling
- Works even if schema isn't set up yet

## Troubleshooting

### Likes not working?
1. Check that the SQL schema was run successfully
2. Check browser console for errors
3. Verify that `Likes` table exists in Supabase
4. Check that the trigger exists

### Count not updating?
1. Check that the trigger `trigger_sync_likes_count` exists
2. Verify the function `sync_encounter_likes_count` exists
3. Check browser console for errors

### Like state not persisting?
1. Check that `hasUserLiked` is working correctly
2. Verify user is logged in
3. Check browser console for errors

## Files Created/Modified

### Created:
- `database/likes-schema.sql`
- `lib/likes.ts`
- `LIKES-UNLIKE-IMPLEMENTATION.md` (this file)

### Modified:
- `components/LikeButton.tsx` - Complete rewrite for like/unlike
- `app/page.tsx` - Updated handleLike function
- `app/encounter/[id]/page.tsx` - Updated handleLike function

## Next Steps

1. **Run the SQL schema** in Supabase (see Step 1 above)
2. **Test the feature** with multiple users
3. **Consider adding** a "Who liked this" feature (show list of users who liked)
4. **Consider adding** like notifications for the liker (optional)

---

**Status**: ✅ Complete and ready for testing
**Last Updated**: December 2024

