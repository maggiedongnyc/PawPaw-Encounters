# User Profiles Implementation

## Overview
User Profiles feature has been successfully implemented, allowing users to view and edit their profiles, see statistics, and navigate to other users' profiles from encounters and comments.

## Files Created

### 1. Database Schema
**File:** `database/user-profiles-schema.sql`
- Creates `UserProfiles` table with fields: username, display_name, bio, avatar_url, favorite_breeds, location, website
- Creates `UserStatistics` view that aggregates data from Encounters, Comments, and Badges tables
- Includes helper function `get_or_create_user_profile()` to auto-create profiles
- Includes trigger to update `updated_at` timestamp

### 2. API Functions
**File:** `lib/profiles.ts`
- `getUserProfile(userId)` - Get or create user profile
- `getUserProfileByUsername(username)` - Get profile by username
- `getUserStatistics(userId)` - Get user statistics
- `getUserProfileWithStats(userId)` - Get profile with statistics combined
- `updateUserProfile(userId, updates)` - Update profile fields
- `isUsernameAvailable(username)` - Check username availability
- `uploadAvatar(userId, file)` - Upload avatar image
- `getDisplayName(profile, userId)` - Get display name with fallbacks
- `getAvatarUrl(profile)` - Get avatar URL or default emoji

### 3. Profile Page
**File:** `app/profile/[userId]/page.tsx`
- Dynamic route for viewing user profiles
- Shows profile header with avatar, display name, bio, location, website
- Displays statistics: total encounters, likes received, comments, badges
- Shows user's encounters in a grid
- Edit mode for own profile (username, display name, bio, location, website)
- Avatar upload functionality
- Favorite breeds display

### 4. User Profile Link Component
**File:** `components/UserProfileLink.tsx`
- Reusable component for linking to user profiles
- Shows avatar and display name
- Handles loading states
- Used in comments and throughout the app

## Files Modified

### 1. Comments Component
**File:** `components/Comments.tsx`
- Added `UserProfileLink` component to show user info in comments
- Each comment now shows the user's profile link with avatar

### 2. Home Page
**File:** `app/page.tsx`
- Added "Posted by" link to encounter cards
- Added profile links to comments in encounter previews
- Links navigate to `/profile/[userId]`

## Database Setup

**IMPORTANT:** Before using profiles, run the SQL schema in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/user-profiles-schema.sql`
4. Run the script

This will create:
- `UserProfiles` table
- `UserStatistics` view
- Helper functions and triggers
- Indexes for performance

## Features

### Profile Viewing
- Public profiles accessible at `/profile/[userId]`
- Shows user statistics (encounters, likes, comments, badges)
- Displays user's encounters in a grid
- Shows favorite breeds if set

### Profile Editing
- Users can edit their own profile
- Edit fields: username, display_name, bio, location, website
- Avatar upload support
- Username uniqueness validation

### Profile Links
- Clickable user links in:
  - Encounter cards ("Posted by User...")
  - Comments (user name with avatar)
- Links navigate to user profile pages

### Statistics
- Total encounters posted
- Total likes received
- Total comments made
- Total badges earned
- First and last encounter dates

## Usage Examples

### Viewing a Profile
```typescript
// Navigate to profile
router.push(`/profile/${userId}`)

// Or use Link component
<Link href={`/profile/${userId}`}>View Profile</Link>
```

### Getting Profile Data
```typescript
import { getUserProfileWithStats } from '@/lib/profiles'

const profile = await getUserProfileWithStats(userId)
// Returns: { ...profile, statistics: { total_encounters, ... } }
```

### Updating Profile
```typescript
import { updateUserProfile } from '@/lib/profiles'

await updateUserProfile(userId, {
  display_name: 'New Name',
  bio: 'My bio',
  location: 'New York, NY'
})
```

### Using UserProfileLink Component
```typescript
import UserProfileLink from '@/components/UserProfileLink'

<UserProfileLink 
  userId={comment.user_id} 
  showAvatar={true} 
  className="text-sm"
/>
```

## Next Steps (Optional Enhancements)

1. **Username System**: Implement unique username validation and search
2. **Avatar System**: Add image upload to Supabase Storage
3. **Profile Completion**: Add progress indicator for profile completion
4. **Social Features**: Add follow/unfollow functionality
5. **Activity Feed**: Show recent activity on profile page
6. **Privacy Settings**: Allow users to control profile visibility

## Testing Checklist

- [ ] Run database schema in Supabase
- [ ] View own profile at `/profile/[your-user-id]`
- [ ] Edit own profile (username, bio, etc.)
- [ ] Upload avatar image
- [ ] View other users' profiles from encounter cards
- [ ] View user profiles from comments
- [ ] Check statistics are accurate
- [ ] Verify profile links work correctly

## Notes

- Profiles are auto-created when first accessed
- Default display name is "User {first-8-chars-of-id}"
- Avatar defaults to emoji based on user ID
- Username is optional but must be unique if set
- All profile data is public (can be restricted with RLS if needed)

