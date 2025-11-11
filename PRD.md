# Product Requirements Document (PRD)
## PawPaw Encounters

**Version:** 1.0  
**Date:** November 2025  
**Status:** Production

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Personas](#user-personas)
4. [Features & Functionality](#features--functionality)
5. [User Flows](#user-flows)
6. [Technical Architecture](#technical-architecture)
7. [Data Models](#data-models)
8. [UI/UX Requirements](#uiux-requirements)
9. [Performance Requirements](#performance-requirements)
10. [Security & Privacy](#security--privacy)
11. [Success Metrics](#success-metrics)
12. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**PawPaw Encounters** is a social platform that enables dog lovers to share, discover, and celebrate their encounters with dogs in their community. Users can upload photos of dogs they meet, tag them with metadata (breed, size, mood), add location data, and interact with other users through likes and comments.

### Key Value Propositions
- **Community Building**: Connect dog lovers through shared experiences
- **Discovery**: Find dogs and dog-friendly locations in your area
- **Memories**: Create a personal collection of dog encounters
- **Gamification**: Leaderboards and engagement metrics encourage participation

### Target Audience
- Dog lovers and pet enthusiasts
- Urban residents who encounter dogs regularly
- Social media users interested in pet content
- Community-oriented individuals

---

## Product Overview

### Vision Statement
To create a joyful, community-driven platform where every dog encounter becomes a shared moment of connection and discovery.

### Mission
Enable dog lovers to document, share, and celebrate their encounters with dogs while building a vibrant, location-aware community.

### Product Goals
1. **User Engagement**: Encourage daily usage through gamification and social features
2. **Content Quality**: Maintain high-quality, authentic dog encounter content
3. **Community Growth**: Build an active, engaged user base
4. **Location Discovery**: Help users discover dog-friendly areas and popular dog spots

---

## User Personas

### Primary Persona: "The Dog Enthusiast" - Sarah
- **Age**: 28-45
- **Occupation**: Professional, urban dweller
- **Tech Savviness**: High
- **Goals**: 
  - Document memorable dog encounters
  - Discover dogs in her neighborhood
  - Connect with other dog lovers
- **Pain Points**:
  - No easy way to remember all the dogs she meets
  - Wants to share but not on generic social media
  - Interested in location-based discovery

### Secondary Persona: "The Neighborhood Explorer" - Mike
- **Age**: 25-40
- **Occupation**: Active lifestyle, frequent walker
- **Tech Savviness**: Medium
- **Goals**:
  - Find popular dog-walking routes
  - See what dogs are in the area
  - Contribute to community knowledge
- **Pain Points**:
  - Wants location-based information
  - Prefers simple, intuitive interfaces
  - Values community insights

### Tertiary Persona: "The Social Sharer" - Emma
- **Age**: 18-30
- **Occupation**: Student or young professional
- **Tech Savviness**: Very High
- **Goals**:
  - Share cute dog photos
  - Engage with community
  - Compete on leaderboards
- **Pain Points**:
  - Wants instant gratification
  - Values social recognition
  - Prefers mobile-first experiences

---

## Features & Functionality

### 1. Core Features

#### 1.1 Encounter Upload
**Description**: Multi-step form for uploading dog encounters with photo, description, location, and metadata.

**User Stories**:
- As a user, I want to upload a photo of a dog I encountered
- As a user, I want to add a description of the encounter
- As a user, I want to tag the dog with breed, size, and mood
- As a user, I want to set the location of the encounter
- As a user, I want to preview my encounter before submitting

**Requirements**:
- **Step 1 - Photo Upload**:
  - Accept image files (JPG, PNG, WebP)
  - Image preview before upload
  - File size validation (max 10MB)
  - Image compression/optimization
  - Optional in edit mode (photo can be updated or kept)
  
- **Step 2 - Description**:
  - Text input field (max 500 characters)
  - Character counter
  - Optional field
  
- **Step 3 - Location**:
  - Two methods:
    1. **Current Location**: Use browser Geolocation API
    2. **Map Selection**: Interactive map (Leaflet) to select location
  - Reverse geocoding to get neighborhood name
  - Location stored as JSON: `{lat: number, lng: number, name?: string}`
  - Required field
  
- **Step 4 - Tags**:
  - **Breed**: Free text input (optional)
  - **Size**: Dropdown (Small, Medium, Large, Extra-Large) (optional)
  - **Mood**: Dropdown (Happy, Playful, Calm, Energetic, Sleepy, Curious) (optional)
  
- **Step 5 - Review**:
  - Preview of all entered information
  - Edit capability for each section
  - Submit button with loading states
  - Success feedback with redirect

**Edit Mode**:
- Access via double-click on own encounters
- Pre-populate all fields with existing data
- Photo is optional (can keep existing or upload new)
- Update button instead of Submit
- Success message: "Updated!" with 5-second countdown redirect

**Validation**:
- Photo required in create mode
- Location required in both modes
- Description, breed, size, mood are optional

**Error Handling**:
- Geolocation permission denied: Show user-friendly message with map alternative
- Geolocation timeout: Show timeout message with map alternative
- Geolocation unavailable: Show error message with map alternative
- Upload failures: Show error toast with retry option

#### 1.2 Encounter Feed (Home Page)
**Description**: Grid view of all encounters with filtering, sorting, and interaction capabilities.

**User Stories**:
- As a user, I want to see all dog encounters in a grid
- As a user, I want to filter encounters by breed, size, mood, date, and location
- As a user, I want to like encounters
- As a user, I want to view and add comments
- As a user, I want to see which encounters are mine
- As a user, I want to edit or delete my own encounters

**Requirements**:
- **Grid Layout**:
  - Responsive grid (1 column mobile, 2-3 columns tablet, 3-4 columns desktop)
  - Card-based design with photo, description, tags, location
  - Lazy loading for performance
  - Infinite scroll or pagination
  
- **Encounter Cards**:
  - Photo thumbnail (clickable to view full size)
  - Description (truncated with "read more")
  - Tags with emojis:
    - Breed: 🐶
    - Size: 🐕 (small), 🐕‍🦺 (medium), 🦮 (large), 🐩 (extra-large)
    - Mood: 😊 (happy), 🎾 (playful), 😌 (calm), ⚡ (energetic), 😴 (sleepy), 🤔 (curious)
  - Location display (neighborhood name or coordinates)
  - Like button with count
  - Comment count
  - Timestamp (relative: "2 hours ago")
  - "Your encounter" badge for owned encounters
  - Delete button (trash icon) for owned encounters
  - Double-click on photo to edit (owned encounters only)
  
- **Filtering**:
  - **Breed Filter**: Dropdown with unique breeds from all encounters
  - **Size Filter**: Dropdown (Small, Medium, Large, Extra-Large)
  - **Mood Filter**: Dropdown (Happy, Playful, Calm, Energetic, Sleepy, Curious)
  - **Date Filter**: Dropdown (Today, This Week, This Month, All Time)
  - **Location Radius**: Slider (1km, 5km, 10km, 25km, 50km, All) - requires user location
  - **Active Filter Chips**: Display active filters above grid with remove buttons
  - Filters are combinable (AND logic)
  - Real-time filtering (no submit button)
  
- **Sorting**:
  - Default: Most recent first
  - Options: Most liked, Most commented, Oldest first
  
- **Interactions**:
  - **Like**: Click heart icon to like (one-time, no unlike)
  - **Comments**: Click comment icon to view/add comments
  - **Edit**: Double-click photo on owned encounters
  - **Delete**: Click trash icon on owned encounters (with confirmation)

#### 1.3 Map View
**Description**: Interactive map showing all encounters with custom markers and popups.

**User Stories**:
- As a user, I want to see all encounters on a map
- As a user, I want to click markers to see encounter details
- As a user, I want to see custom dog icons on markers
- As a user, I want the map to auto-fit to show all encounters

**Requirements**:
- **Map Component**:
  - Leaflet-based interactive map
  - Stamen Watercolor basemap (playful, subtle style)
  - Fallback to OpenStreetMap if Stamen fails
  - Custom dog icons (40-60px) based on mood:
    - Happy: 😊
    - Playful: 🎾
    - Calm: 😌
    - Energetic: ⚡
    - Sleepy: 😴
    - Curious: 🤔
    - Default: 🐕
  - Optional animations: pulse, bounce, wiggle on hover/click
  - Auto-fit bounds to show all markers
  - Zoom controls
  
- **Markers**:
  - Custom divIcon with emoji and styling
  - Hover effects (scale, shadow)
  - Click to open popup
  
- **Popups**:
  - Dog photo (thumbnail)
  - Description
  - Tags (breed, size, mood) with emojis and gradient backgrounds
  - Neighborhood name (or coordinates)
  - "NEW!" badge for recent encounters (< 24 hours)
  - Like button
  - Comment count
  
- **Performance**:
  - Reverse geocoding with caching
  - Batch geocoding requests
  - Debounced map updates
  - Lazy marker loading for large datasets

#### 1.4 Comments System
**Description**: Users can view and add comments on encounters.

**User Stories**:
- As a user, I want to view comments on encounters
- As a user, I want to add comments on encounters
- As a user, I want to edit my own comments
- As a user, I want to delete my own comments
- As a user, I want to see comment timestamps

**Requirements**:
- **Comment Display**:
  - Show first 2 comments by default
  - "View all X comments" link to expand
  - Comment author (user ID or "Anonymous")
  - Comment text
  - Timestamp (relative: "5 minutes ago")
  - Edit/Delete buttons (only for own comments)
  - Inline editing (click Edit to edit in place)
  
- **Comment Input**:
  - Text input field
  - Character limit (500 characters)
  - Submit button
  - Loading state during submission
  - Success feedback (toast notification)
  
- **Comment Actions**:
  - **Add**: Submit new comment
  - **Edit**: Click Edit button, modify text, click Save
  - **Delete**: Click Delete button, confirm, remove comment
  - Real-time updates via Supabase subscriptions
  
- **Permissions**:
  - Anyone can read comments
  - Anyone can add comments (requires authentication)
  - Only comment author can edit/delete

#### 1.5 Likes System
**Description**: Simple one-time like system for encounters.

**User Stories**:
- As a user, I want to like encounters
- As a user, I want to see like counts
- As a user, I want to see visual feedback when I like

**Requirements**:
- **Like Button**:
  - Heart icon (outline when not liked, filled red when liked)
  - Like count displayed next to icon
  - One-time like (no unlike functionality)
  - Disabled state after liking
  - Animation on click (pulse, bounce)
  - Optimistic UI updates
  
- **Like Storage**:
  - Stored in `likes` column on `Encounters` table
  - Incremented on like action
  - Real-time updates via Supabase subscriptions
  
- **Visual Feedback**:
  - Heart fills red on click
  - Count increments immediately
  - Pulse animation on click
  - Toast notification (optional)

#### 1.6 My PawPaws Page
**Description**: Personal page showing only the user's own encounters.

**User Stories**:
- As a user, I want to see all my encounters in one place
- As a user, I want to edit my encounters
- As a user, I want to delete my encounters
- As a user, I want to see my encounter statistics

**Requirements**:
- **Page Layout**:
  - Similar to home page grid layout
  - Filtered to show only user's encounters
  - "Back to Home" link in top-right
  - Empty state if no encounters
  
- **Encounter Cards**:
  - Same card design as home page
  - All interactions available (like, comment, edit, delete)
  - Double-click photo to edit
  - Delete button visible
  
- **Statistics** (Future):
  - Total encounters
  - Total likes received
  - Most liked encounter
  - Most commented encounter

#### 1.7 Leaderboard
**Description**: Rankings of top users by uploads and likes.

**User Stories**:
- As a user, I want to see top contributors
- As a user, I want to compete on leaderboards
- As a user, I want to see my ranking

**Requirements**:
- **Leaderboard Display**:
  - Top 10 users
  - Toggle between "Uploads" and "Likes" views
  - Rank emoji: 🥇 (1st), 🥈 (2nd), 🥉 (3rd), #N (others)
  - Dog avatar emoji based on user ID
  - User identifier (user ID or "Anonymous")
  - Upload count
  - Total likes received
  - Expandable/collapsible section (expanded by default)
  
- **Ranking Logic**:
  - **Uploads View**: Ranked by number of encounters uploaded
  - **Likes View**: Ranked by total likes received across all encounters
  - Tie-breaking: Secondary sort by other metric
  
- **Updates**:
  - Real-time updates via Supabase subscriptions
  - Refresh on new encounters/likes

### 2. Authentication & User Management

#### 2.1 Authentication System
**Description**: Magic link authentication via Supabase.

**User Stories**:
- As a user, I want to sign in easily
- As a user, I want my session to persist
- As a user, I want to sign out

**Requirements**:
- **Sign In Flow**:
  - Email input field
  - "Send Magic Link" button
  - Magic link sent to email
  - Click link in email to sign in
  - Redirect to home page after sign in
  
- **Session Management**:
  - Auto-sign-in if logged in within 24 hours
  - Session persistence across browser sessions
  - Automatic sign-out after 24 hours of inactivity
  - Loading state during auth initialization (max 5 seconds)
  
- **Sign Out**:
  - "Sign Out" button in top-right navigation
  - Confirmation (optional)
  - Clear session and redirect to home
  
- **Auth States**:
  - **Loading**: Show loading spinner
  - **Authenticated**: Show user-specific features
  - **Unauthenticated**: Show sign-in prompt for protected actions

#### 2.2 User Profile (Future)
**Description**: User profile page with statistics and badges.

**Requirements** (Future):
- User statistics (total encounters, total likes, etc.)
- Badge collection
- Recent encounters
- Favorite encounters

### 3. UI/UX Features

#### 3.1 Hero Section
**Description**: Eye-catching hero section on home page.

**Requirements**:
- **Content**:
  - Main title: "PawPaw Encounters" with dog 🐕 and paw 🐾 emojis
  - Tagline: "Share your dog encounters with the community! 🎾"
  - Fredoka font for playful, friendly feel
  - Responsive sizing (text-5xl sm:text-6xl lg:text-7xl)
  - Fade-in/slide-up animation
  
- **Layout**:
  - Centered content
  - Adequate spacing from navigation
  - Responsive padding (py-8 sm:py-12 lg:py-16)
  - Height: 45vh, min 320px, max 450px

#### 3.2 Background Design
**Description**: Animated paw print background overlay.

**Requirements**:
- **Paw Prints**:
  - Black paw prints (no transparency)
  - 30-40 total prints
  - Varied sizes (30-80px)
  - Natural walking paths (diagonal, S-curve, arc, horizontal)
  - Constrained to edges (center clear for content)
  - Strategic overlapping (15-30%)
  - Rotation based on path direction (5-15°)
  
- **Animations**:
  - Fade-in: 1-1.5 seconds, 0% to 30-50% opacity, staggered over 3-5 seconds
  - Float: Gentle vertical bob (15-25px), 4-6 seconds per cycle, ease-in-out, infinite loop
  - Fade-out: Slowly fade out at end of cycle
  - All movements 3x slower for subtlety
  - CSS keyframe animations (transform, opacity)
  
- **Performance**:
  - CSS-only animations (no JavaScript)
  - Optimized for 60fps
  - No impact on scroll performance

#### 3.3 Toast Notifications
**Description**: User feedback for actions.

**Requirements**:
- **Success Toasts**:
  - Green background
  - Checkmark icon
  - Messages: "Encounter uploaded successfully!", "Updated!", "Comment added!", etc.
  - Auto-dismiss after 3 seconds
  
- **Error Toasts**:
  - Red background
  - Error icon
  - Messages: "Failed to upload encounter", "Failed to add comment", etc.
  - Auto-dismiss after 5 seconds
  
- **Position**: Top-right corner
- **Stacking**: Multiple toasts stack vertically
- **Dismissible**: Click to dismiss

#### 3.4 Visual Indicators
**Description**: Visual cues for user actions and states.

**Requirements**:
- **Editable Encounters**:
  - "✏️ Your encounter (double-click to edit)" badge
  - Positioned top-left on photo
  - Only visible on owned encounters
  
- **Filter Chips**:
  - Display active filters above grid
  - Emoji + label (e.g., "🐶 Golden Retriever")
  - Remove button (X) on each chip
  - Gradient background
  
- **Loading States**:
  - Skeleton loaders for cards
  - Spinner for buttons
  - "Loading..." text where appropriate
  
- **Empty States**:
  - Friendly message with emoji
  - Call-to-action (e.g., "Upload your first encounter!")

#### 3.5 Responsive Design
**Description**: Mobile-first responsive design.

**Requirements**:
- **Breakpoints**:
  - Mobile: < 640px (1 column grid)
  - Tablet: 640px - 1024px (2-3 column grid)
  - Desktop: > 1024px (3-4 column grid)
  
- **Mobile Optimizations**:
  - Touch-friendly buttons (min 44x44px)
  - Swipe gestures for navigation
  - Bottom navigation (future)
  - Optimized image sizes
  
- **Tablet Optimizations**:
  - Side-by-side layouts
  - Larger touch targets
  - Optimized grid layouts
  
- **Desktop Optimizations**:
  - Hover states
  - Keyboard navigation
  - Larger viewport utilization

---

## User Flows

### Flow 1: Upload New Encounter
1. User clicks "📸 Upload Your PawPaw Encounter" button
2. If not authenticated, show sign-in prompt
3. If authenticated, navigate to `/upload`
4. **Step 1**: User selects/upload photo → Preview shown → Click "Next"
5. **Step 2**: User enters description (optional) → Click "Next"
6. **Step 3**: User selects location:
   - Option A: Click "Use Current Location" → Grant permission → Location set
   - Option B: Click "Select on Map" → Click map → Location set
   - Click "Next"
7. **Step 4**: User selects tags (breed, size, mood) → Click "Next"
8. **Step 5**: User reviews all information → Click "✓ Submit Encounter"
9. Upload in progress → "Uploading..." button state
10. Success → "Submitted!" button state → Toast notification → Redirect to home (5 seconds)

### Flow 2: Edit Encounter
1. User double-clicks photo on own encounter card
2. Navigate to `/upload?edit={encounterId}`
3. Form pre-populated with existing data
4. User modifies fields (photo optional)
5. User clicks "Update" button
6. Update in progress → "Updating..." button state
7. Success → "Updated!" button state → Toast notification → Countdown "Back to home page in 5 seconds" → Redirect

### Flow 3: Filter Encounters
1. User on home page sees filter section
2. User selects breed from dropdown → Filter applied → Grid updates
3. User selects size from dropdown → Filter applied → Grid updates
4. User selects mood from dropdown → Filter applied → Grid updates
5. User selects date range → Filter applied → Grid updates
6. User grants location permission → Location radius slider enabled
7. User selects radius → Filter applied → Grid updates
8. Active filters shown as chips above grid
9. User clicks X on chip → Filter removed → Grid updates

### Flow 4: Like Encounter
1. User sees encounter card with like button
2. User clicks heart icon
3. Heart fills red, count increments
4. Pulse animation plays
5. Like saved to database
6. Real-time update to all users

### Flow 5: Add Comment
1. User clicks comment icon on encounter card
2. Comments section expands
3. User types comment in input field
4. User clicks "Post Comment" (or presses Enter)
5. Comment appears in list
6. Toast notification: "Comment added!"
7. Real-time update to all users

### Flow 6: View Map
1. User scrolls to "Map View" section on home page
2. Map loads with all encounters as markers
3. Markers show custom dog emoji icons
4. User clicks marker → Popup opens with encounter details
5. User can like/comment from popup
6. Map auto-fits to show all markers

### Flow 7: Sign In
1. User clicks "Sign In" button (if not authenticated)
2. Navigate to `/signin`
3. User enters email address
4. User clicks "Send Magic Link"
5. Toast notification: "Magic link sent to your email!"
6. User checks email, clicks magic link
7. Redirect to home page, authenticated

---

## Technical Architecture

### 3.1 Technology Stack

#### Frontend
- **Framework**: Next.js 16.0.1 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **Fonts**: 
  - Fredoka (Google Fonts) - Primary font
  - Inter (Google Fonts) - Fallback
- **Maps**: 
  - Leaflet 1.9.4
  - React-Leaflet 5.0.0
- **Notifications**: react-hot-toast 2.6.0
- **Build Tool**: Next.js Turbopack

#### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Link)
- **Storage**: Supabase Storage (dog-photos bucket)
- **Real-time**: Supabase Realtime (PostgreSQL changes)

#### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Environment**: Node.js 20+

### 3.2 Project Structure

```
/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page (feed)
│   ├── globals.css         # Global styles and animations
│   ├── upload/
│   │   └── page.tsx        # Upload/edit page
│   ├── my-pawpaws/
│   │   └── page.tsx        # User's encounters page
│   └── signin/
│       └── page.tsx         # Sign in page
├── components/
│   ├── Hero.tsx            # Hero section
│   ├── Background.tsx       # Animated paw print background
│   ├── MapView.tsx         # Map view component
│   ├── MapComponent.tsx    # Map for upload page
│   ├── Comments.tsx         # Comments component
│   ├── LikeButton.tsx       # Like button component
│   ├── Leaderboard.tsx     # Leaderboard component
│   └── ...
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── geocoding.ts        # Reverse geocoding utilities
├── public/                  # Static assets
└── package.json            # Dependencies
```

### 3.3 Data Flow

#### Client-Side State Management
- **React Hooks**: useState, useEffect, useRef, useCallback, useMemo
- **Context API**: AuthContext for authentication state
- **Local State**: Component-level state for UI interactions
- **Real-time Subscriptions**: Supabase Realtime for live updates

#### Server-Side Rendering
- **Static Generation**: Home page, sign-in page
- **Client Components**: All interactive components marked with 'use client'
- **Dynamic Imports**: Map components loaded client-side only (SSR: false)

### 3.4 API Integration

#### Supabase Client
- **Initialization**: Singleton client in `lib/supabase.ts`
- **Environment Variables**: 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Database Operations
- **Read**: `.from('Encounters').select()`
- **Create**: `.from('Encounters').insert()`
- **Update**: `.from('Encounters').update().eq('id', id)`
- **Delete**: `.from('Encounters').delete().eq('id', id)`

#### Storage Operations
- **Upload**: `.storage.from('dog-photos').upload(path, file)`
- **Get URL**: `.storage.from('dog-photos').getPublicUrl(path)`

#### Real-time Subscriptions
- **Encounters**: `.channel('encounters-changes').on('postgres_changes', ...)`
- **Comments**: `.channel('comments-changes').on('postgres_changes', ...)`

### 3.5 External APIs

#### OpenStreetMap Nominatim
- **Purpose**: Reverse geocoding (coordinates → neighborhood name)
- **Endpoint**: `https://nominatim.openstreetmap.org/reverse`
- **Rate Limiting**: 1 request per second (cached)
- **User-Agent**: Required header
- **Caching**: Client-side cache to reduce API calls

#### Browser Geolocation API
- **Purpose**: Get user's current location
- **Permissions**: Request location permission
- **Error Handling**: Graceful fallback to map selection
- **Privacy**: Only used when user explicitly requests

---

## Data Models

### 4.1 Database Schema

#### Encounters Table
```sql
CREATE TABLE "Encounters" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL, -- JSON: {"lat": number, "lng": number, "name": string}
  breed TEXT,
  size TEXT, -- 'small', 'medium', 'large', 'extra-large'
  mood TEXT, -- 'happy', 'playful', 'calm', 'energetic', 'sleepy', 'curious'
  likes INTEGER DEFAULT 0,
  user_id TEXT, -- References auth.users.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_encounters_user_id ON "Encounters"(user_id);
CREATE INDEX idx_encounters_created_at ON "Encounters"(created_at DESC);
CREATE INDEX idx_encounters_likes ON "Encounters"(likes DESC);
```

#### Comments Table
```sql
CREATE TABLE "Comments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES "Encounters"(id) ON DELETE CASCADE,
  user_id TEXT, -- References auth.users.id
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_encounter_id ON "Comments"(encounter_id);
CREATE INDEX idx_comments_user_id ON "Comments"(user_id);
CREATE INDEX idx_comments_created_at ON "Comments"(created_at DESC);
```

#### Badges Table (Future)
```sql
CREATE TABLE "Badges" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- References auth.users.id
  badge_type TEXT NOT NULL, -- 'first_encounter', 'dog_lover', etc.
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX idx_badges_user_id ON "Badges"(user_id);
```

### 4.2 Data Types

#### Encounter Interface
```typescript
interface Encounter {
  id: string
  photo_url: string
  description: string
  location: string | LocationData // JSON string or parsed object
  breed?: string | null
  size?: string | null // 'small' | 'medium' | 'large' | 'extra-large'
  mood?: string | null // 'happy' | 'playful' | 'calm' | 'energetic' | 'sleepy' | 'curious'
  likes: number
  created_at: string
  user_id?: string | null
}
```

#### LocationData Interface
```typescript
interface LocationData {
  lat: number
  lng: number
  name?: string // Neighborhood name from reverse geocoding
}
```

#### Comment Interface
```typescript
interface Comment {
  id: string
  encounter_id: string
  user_id?: string | null
  comment: string
  created_at: string
}
```

### 4.3 Storage Structure

#### Supabase Storage Bucket: `dog-photos`
- **Public**: Yes (public read access)
- **File Naming**: `{user_id}/{timestamp}-{random}.{ext}`
- **Allowed Types**: image/jpeg, image/png, image/webp
- **Max Size**: 10MB per file
- **Optimization**: Client-side compression before upload

---

## UI/UX Requirements

### 5.1 Design System

#### Color Palette
- **Primary**: Warm yellows and oranges (gradient: #FEF3C7 → #FDE68A → #DBEAFE → #BFDBFE)
- **Accent**: Dog-themed browns (#5C3D2E, #7C4A3E)
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)
- **Neutral**: Grays (#F3F4F6, #6B7280, #111827)
- **Background**: White with gradient overlay

#### Typography
- **Primary Font**: Fredoka (Google Fonts)
  - Weights: 300, 400, 500, 600, 700
  - Usage: Headings, titles, playful text
- **Secondary Font**: Inter (Google Fonts)
  - Usage: Body text, UI elements
- **Sizes**:
  - Hero Title: text-5xl sm:text-6xl lg:text-7xl
  - Section Title: text-3xl md:text-4xl lg:text-5xl
  - Body: text-base (16px)
  - Small: text-sm (14px)

#### Spacing
- **Base Unit**: 4px (Tailwind default)
- **Section Spacing**: mb-16 sm:mb-20 lg:mb-24
- **Card Padding**: p-4 sm:p-6
- **Grid Gap**: gap-4 sm:gap-6

#### Shadows & Borders
- **Cards**: border border-gray-100 shadow-sm hover:shadow-md
- **Buttons**: shadow-lg hover:shadow-xl
- **Modals**: shadow-2xl

#### Animations
- **Fade-in**: 0.3s ease-in
- **Slide-up**: 0.5s ease-out
- **Pulse**: 2s ease-in-out infinite
- **Bounce**: 0.6s ease-in-out
- **Float**: 4-6s ease-in-out infinite

### 5.2 Component Specifications

#### Buttons
- **Primary**: Gradient background (yellow to orange), white text, rounded-full, shadow
- **Secondary**: Gray background, dark text, rounded-lg
- **Icon**: Icon-only, minimal styling
- **States**: Default, Hover, Active, Disabled, Loading

#### Cards
- **Layout**: Rounded corners (rounded-xl), border, shadow
- **Hover**: Scale transform (hover:scale-105), increased shadow
- **Content**: Photo, text, tags, actions
- **Spacing**: Consistent padding, gap between elements

#### Forms
- **Inputs**: Rounded borders, focus ring, placeholder text
- **Labels**: Above inputs, bold text
- **Validation**: Error messages below inputs, red border on error
- **Submit**: Primary button style, disabled state during submission

#### Modals/Dialogs
- **Overlay**: Semi-transparent black background
- **Content**: White background, rounded corners, shadow
- **Close**: X button in top-right
- **Actions**: Buttons at bottom, primary action on right

### 5.3 Accessibility

#### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 for text
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Focus Indicators**: Visible focus rings on all focusable elements
- **Alt Text**: All images have descriptive alt text
- **ARIA Labels**: Buttons and icons have aria-labels
- **Screen Readers**: Semantic HTML, proper heading hierarchy

#### Keyboard Shortcuts
- **Tab**: Navigate between elements
- **Enter/Space**: Activate buttons
- **Escape**: Close modals/dialogs
- **Arrow Keys**: Navigate maps (future)

#### Responsive Images
- **Srcset**: Multiple sizes for different viewports
- **Lazy Loading**: Images load as user scrolls
- **Placeholders**: Blur-up placeholders during load

---

## Performance Requirements

### 6.1 Load Times
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Time to Interactive (TTI)**: < 3.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1

### 6.2 Optimization Strategies

#### Images
- **Format**: WebP with JPEG fallback
- **Compression**: Client-side compression before upload
- **Sizing**: Responsive images with srcset
- **Lazy Loading**: Intersection Observer API
- **CDN**: Vercel Image Optimization

#### Code Splitting
- **Route-based**: Each page loads only necessary code
- **Component-based**: Dynamic imports for heavy components (maps)
- **Bundle Size**: Target < 250KB initial bundle

#### Caching
- **Static Assets**: Long-term caching (1 year)
- **API Responses**: Client-side caching for geocoding
- **Service Worker**: Future implementation for offline support

#### Database
- **Indexes**: All foreign keys and frequently queried columns indexed
- **Query Optimization**: Limit results, use select() to fetch only needed columns
- **Pagination**: Implement pagination for large datasets (future)

### 6.3 Real-time Performance
- **Subscription Limits**: Max 10 concurrent subscriptions per user
- **Debouncing**: Debounce map updates and filter changes
- **Throttling**: Throttle scroll events and resize handlers

---

## Security & Privacy

### 7.1 Authentication Security
- **Magic Links**: Time-limited, single-use tokens
- **Session Management**: Secure HTTP-only cookies (handled by Supabase)
- **Auto-sign-out**: 24-hour inactivity timeout
- **CSRF Protection**: Built into Supabase Auth

### 7.2 Data Security

#### Row-Level Security (RLS)
- **Encounters**: 
  - Read: Public (anyone can read)
  - Create: Authenticated users only
  - Update: Only encounter owner
  - Delete: Only encounter owner
  
- **Comments**:
  - Read: Public (anyone can read)
  - Create: Authenticated users only
  - Update: Only comment owner
  - Delete: Only comment owner

#### Data Validation
- **Client-side**: Input validation, file type/size checks
- **Server-side**: Supabase RLS policies enforce data integrity
- **Sanitization**: XSS prevention via React's built-in escaping

### 7.3 Privacy

#### User Data
- **Minimal Collection**: Only email for authentication
- **No Tracking**: No third-party analytics (future: privacy-respecting analytics)
- **Data Retention**: User data retained until account deletion
- **GDPR Compliance**: Future implementation of data export/deletion

#### Location Data
- **Explicit Consent**: User must grant location permission
- **Optional**: Users can select location on map instead
- **Storage**: Location data stored in database, not shared with third parties
- **Anonymization**: User IDs are UUIDs, not personally identifiable

#### Image Privacy
- **Public Access**: All uploaded images are publicly accessible
- **User Awareness**: Users informed that images are public
- **Deletion**: Users can delete their images (cascade delete from storage)

### 7.4 Content Moderation (Future)
- **Report System**: Users can report inappropriate content
- **Auto-moderation**: AI-based content filtering (future)
- **Manual Review**: Admin review queue for reported content
- **Blocking**: Users can block other users (future)

---

## Success Metrics

### 8.1 User Engagement
- **Daily Active Users (DAU)**: Target 100+ within 3 months
- **Monthly Active Users (MAU)**: Target 500+ within 6 months
- **Session Duration**: Average 5+ minutes per session
- **Pages per Session**: Average 3+ pages per session
- **Return Rate**: 30%+ users return within 7 days

### 8.2 Content Metrics
- **Encounters Uploaded**: Target 1,000+ encounters within 3 months
- **Average Encounters per User**: Target 5+ encounters per active user
- **Comments per Encounter**: Average 2+ comments per encounter
- **Likes per Encounter**: Average 5+ likes per encounter
- **Content Quality**: 90%+ of encounters have photos and descriptions

### 8.3 Feature Adoption
- **Map Usage**: 40%+ of users interact with map view
- **Filter Usage**: 60%+ of users use at least one filter
- **Comment Rate**: 20%+ of encounters receive comments
- **Like Rate**: 50%+ of encounters receive likes
- **Edit Rate**: 10%+ of users edit their encounters

### 8.4 Technical Metrics
- **Uptime**: 99.9%+ availability
- **Error Rate**: < 0.1% of requests result in errors
- **Load Time**: 95%+ of pages load in < 3 seconds
- **API Response Time**: 95%+ of API calls complete in < 500ms

### 8.5 Business Metrics (Future)
- **User Growth**: 20%+ month-over-month growth
- **Retention**: 40%+ of users return within 30 days
- **Viral Coefficient**: 1.2+ (each user brings 1.2 new users)
- **Net Promoter Score (NPS)**: 50+ (future survey implementation)

---

## Future Enhancements

### 9.1 Short-term (1-3 months)

#### User Profiles
- **Profile Pages**: Public user profiles with statistics
- **Avatar System**: Custom avatars or emoji selection
- **Bio**: User bio and favorite dog breeds
- **Achievements**: Badge collection display

#### Enhanced Filtering
- **Search**: Text search for descriptions and breeds
- **Advanced Filters**: Date range picker, multiple breed selection
- **Saved Filters**: Save favorite filter combinations
- **Filter Presets**: Quick filter buttons (e.g., "Near Me", "Recent")

#### Notifications
- **In-app Notifications**: New comments, likes, follows
- **Email Notifications**: Weekly digest, new followers
- **Push Notifications**: Real-time updates (future)

#### Social Features
- **Follow System**: Follow other users
- **Feed Customization**: See only followed users' encounters
- **Sharing**: Share encounters to external social media
- **Collections**: Save favorite encounters to collections

### 9.2 Medium-term (3-6 months)

#### Mobile App
- **Native iOS App**: Swift/SwiftUI
- **Native Android App**: Kotlin/Jetpack Compose
- **Offline Support**: Cache encounters for offline viewing
- **Push Notifications**: Native push notifications

#### Advanced Map Features
- **Heat Maps**: Show popular dog encounter locations
- **Routes**: Create and share dog-walking routes
- **Clusters**: Cluster markers at high zoom levels
- **Custom Basemaps**: Multiple map style options

#### Content Features
- **Video Support**: Upload short videos of encounters
- **Multiple Photos**: Upload multiple photos per encounter
- **Photo Editing**: Basic filters and editing tools
- **Stories**: 24-hour story feature (like Instagram)

#### Gamification
- **Badges System**: Earn badges for milestones
- **Streaks**: Daily upload streaks
- **Challenges**: Weekly/monthly challenges
- **Leaderboards**: Expanded leaderboard categories

### 9.3 Long-term (6-12 months)

#### AI Features
- **Breed Detection**: Auto-detect dog breed from photo
- **Mood Detection**: Auto-detect dog mood from photo
- **Content Moderation**: AI-based inappropriate content detection
- **Recommendations**: Personalized encounter recommendations

#### Community Features
- **Groups**: Create and join dog-related groups
- **Events**: Organize and attend dog meetups
- **Forums**: Discussion forums for dog topics
- **Marketplace**: Buy/sell dog-related items (future)

#### Analytics
- **User Analytics**: Personal statistics dashboard
- **Community Insights**: Popular breeds, locations, trends
- **Heat Maps**: Visualize encounter patterns
- **Export Data**: Export personal encounter data

#### Monetization (Future)
- **Premium Features**: Ad-free experience, advanced filters
- **Sponsorships**: Local business sponsorships
- **Merchandise**: Branded merchandise store
- **Donations**: Support platform development

---

## Appendix

### A. Glossary
- **Encounter**: A single instance of meeting/interacting with a dog, documented with photo, description, location, and metadata
- **PawPaw**: Playful term for a dog (used in app branding)
- **Magic Link**: Passwordless authentication method using email links
- **Reverse Geocoding**: Converting coordinates (lat/lng) to human-readable location names
- **RLS**: Row-Level Security (Supabase feature for database access control)

### B. Acronyms
- **PRD**: Product Requirements Document
- **UI/UX**: User Interface/User Experience
- **API**: Application Programming Interface
- **CDN**: Content Delivery Network
- **FCP**: First Contentful Paint
- **LCP**: Largest Contentful Paint
- **TTI**: Time to Interactive
- **CLS**: Cumulative Layout Shift
- **DAU**: Daily Active Users
- **MAU**: Monthly Active Users
- **NPS**: Net Promoter Score
- **GDPR**: General Data Protection Regulation
- **WCAG**: Web Content Accessibility Guidelines

### C. References
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- Leaflet Documentation: https://leafletjs.com/
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- React Documentation: https://react.dev/

### D. Change Log
- **v1.0** (November 2025): Initial PRD creation

---

**Document Status**: ✅ Complete  
**Last Updated**: November 2025  
**Next Review**: December 2025

