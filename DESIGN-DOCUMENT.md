# PawPaw Encounters - Design Document

## 1. Design System Overview

### 1.1 Design Philosophy
- **Friendly & Playful**: Warm, approachable design that reflects the community nature of the app
- **Clean & Modern**: Contemporary interface with clear visual hierarchy
- **Mobile-First**: Responsive design optimized for mobile devices
- **Accessible**: Touch-friendly targets and readable typography

### 1.2 Visual Style
- **Rounded Corners**: Soft, friendly aesthetic with `rounded-xl` and `rounded-full`
- **Soft Shadows**: Layered shadows for depth (`shadow-sm` to `shadow-xl`)
- **Gradient Accents**: Warm yellow-to-orange gradients for primary actions
- **Emoji Integration**: Playful use of emojis for visual interest
- **Animated Background**: Subtle paw print animations for brand personality
- **Card-Based Layout**: Clean, organized content presentation

---

## 2. Color Palette

### 2.1 Primary Colors
- **Primary Yellow/Orange Gradient**: `#FFB500` → `#FFC845` → `#FFD166`
  - Used for: Primary buttons, active states, accent highlights
- **Brand Brown**: `#5C3D2E`
  - Used for: Primary text, headings, main content color

### 2.2 Accent Colors
- **Yellow Tags** (Breed): 
  - Background: `#FEF3C7` → `#FDE68A` (gradient)
  - Text: `#92400E` (yellow-800)
- **Blue Tags** (Size): 
  - Background: `#DBEAFE` → `#BFDBFE` (gradient)
  - Text: `#1E40AF` (blue-800)
- **Green Tags** (Mood): 
  - Background: `#D1FAE5` → `#A7F3D0` (gradient)
  - Text: `#065F46` (green-800)
- **Purple Tags** (Date): 
  - Background: `#E9D5FF` → `#DDD6FE` (gradient)
  - Text: `#6B21A8` (purple-800)

### 2.3 Neutral Colors
- **Background**: `#FFFFFF` (white)
- **Card Background**: `#FFFFFF` (white)
- **Borders**: 
  - Light: `#F3F4F6` (gray-100)
  - Medium: `#E5E7EB` (gray-200)
  - Yellow accent: `#FEF3C7` (yellow-100)
- **Text Colors**:
  - Primary: `#5C3D2E` (brand brown)
  - Secondary: `#374151` (gray-700)
  - Muted: `#6B7280` (gray-500)
  - Placeholder: `#374151` (gray-700) - darker for visibility

### 2.4 State Colors
- **Success**: `#10B981` (green-500)
- **Error**: `#EF4444` (red-500)
- **Warning**: `#F59E0B` (amber-500)
- **Active/Selected**: `#FFB500` (gold)

---

## 3. Typography

### 3.1 Font Families
- **Headings**: Poppins (weights: 300, 400, 500, 600, 700, 800)
  - Letter spacing: `-0.02em`
  - Usage: All h1-h6, buttons, titles, section headings
- **Body Text**: Inter (default weights)
  - Usage: Body text, descriptions, labels, form inputs, metadata

### 3.2 Typography Scale

#### Desktop
- **Hero Title**: `text-7xl` (72px) - Poppins, weight 700
- **Page Titles**: `text-5xl` (48px) - Poppins, weight 700
- **Section Titles**: `text-4xl` (36px) - Poppins, weight 600
- **Card Titles**: `text-lg` (18px) - Poppins, weight 600
- **Body Text**: `text-base` (16px) - Inter, weight 400
- **Small Text**: `text-sm` (14px) - Inter, weight 400
- **Labels**: `text-xs` (12px) - Inter, weight 500

#### Mobile
- **Hero Title**: `text-4xl` (36px) - Poppins, weight 700
- **Page Titles**: `text-4xl` (36px) - Poppins, weight 700
- **Section Titles**: `text-2xl` (24px) - Poppins, weight 600
- **Card Titles**: `text-xl` (20px) - Poppins, weight 600 (**largest on mobile**)
- **Body Text**: `text-base` (16px) - Inter, weight 400
- **Small Text**: `text-xs` (12px) - Inter, weight 400
- **User Names**: `text-xs` (12px) - Inter, weight 600 (**smaller on mobile**)

### 3.3 Line Heights
- **Headings**: `1.1` (tight, modern)
- **Body**: `1.4` (comfortable reading)
- **Labels**: `1.5` (readable)

---

## 4. Layout & Spacing

### 4.1 Breakpoints
- **Mobile**: `< 640px` (sm)
- **Tablet**: `640px - 1024px` (md)
- **Desktop**: `≥ 1024px` (lg)

### 4.2 Container Spacing
- **Page Padding**: 
  - Mobile: `px-4` (16px)
  - Desktop: `px-6 lg:px-8` (24px/32px)
- **Section Spacing**: 
  - Mobile: `mb-12` (48px)
  - Desktop: `mb-20 lg:mb-24` (80px/96px)
- **Card Padding**:
  - Mobile: `p-4` (16px)
  - Desktop: `p-6` (24px)

### 4.3 Grid System
- **Card Grid**: 
  - Mobile: `grid-cols-1` (single column)
  - Desktop: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (multi-column)
- **Gap**: `gap-6` (24px) on desktop, `gap-4` (16px) on mobile

---

## 5. Component Design Specifications

### 5.1 Hero Section

#### Desktop
- **Height**: `30vh`, min `200px`, max `280px`
- **Title**: 
  - Size: `text-6xl lg:text-7xl`
  - Color: `#5C3D2E`
  - Text shadow: `0 4px 12px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(0, 0, 0, 0.1)`
  - Icons: Floating animation (3s/3.5s cycles)
- **Tagline**: 
  - Size: `text-xl lg:text-2xl`
  - Font: Inter, weight 500
  - Text shadow: `0 2px 8px rgba(255, 255, 255, 0.9)`
- **Animation**: Fade-in + slide-up (1s duration, 300ms delay)

#### Mobile
- **Height**: `30vh`, min `200px`, max `280px`
- **Title**: `text-4xl` (36px)
- **Tagline**: `text-lg` (18px)
- **Padding**: `pt-16` (64px top)
- **Icons**: No floating animation on mobile

---

### 5.2 Navigation

#### Top Navigation (Desktop)
- **Position**: Absolute overlay on hero, top-right
- **Items**: Search icon, Notification bell, "My PawPaws" button, Sign Out button
- **Button Style**:
  - Background: Gradient `#FFC845` → `#FFD166`
  - Text: White, Poppins, semibold
  - Size: `px-4 py-2 text-sm`
  - Shape: `rounded-full`
  - Shadow: `shadow-lg hover:shadow-xl`
  - Hover: Scale `1.05`, enhanced shadow

#### Bottom Navigation (Mobile Only)
- **Position**: Fixed bottom, `z-50`
- **Height**: `h-12` (48px) - compact
- **Background**: White with `border-t-2 border-gray-200`
- **Shadow**: `shadow-lg`
- **Items**: 5 icons (Home, Upload, My PawPaws 🐾, Profile, Activity/Notifications)
- **Icon Size**: `w-6 h-6` (24px)
- **Active State**: `#FFB500` (gold)
- **Inactive State**: `#6B7280` (gray-600)
- **Spacing**: `justify-around` with `px-2` padding
- **No Text Labels**: Icon-only design

---

### 5.3 Encounter Cards

#### Desktop Card
- **Container**:
  - Background: White
  - Border: `border border-gray-100`
  - Shadow: `shadow-sm hover:shadow-md`
  - Border radius: `rounded-xl`
  - Padding: `p-6`
  - Hover: `transform hover:-translate-y-1` (lift effect)

- **Image**:
  - Height: `h-64` (256px)
  - Object fit: `object-cover`
  - Hover: `scale-110` (zoom effect)
  - Overlay: Gradient on hover (`from-black/30`)

- **Title**:
  - Size: `text-lg` (18px)
  - Font: Poppins, semibold
  - Color: `#5C3D2E`
  - Line clamp: 2 lines

- **Tags** (Desktop):
  - Position: Same line as title
  - Style: Gradient backgrounds, `rounded-full`
  - Size: `text-xs`, `px-3 py-1.5`
  - Spacing: `gap-2`

- **Metadata**:
  - "Posted by": `text-xs`, gray-700
  - Location/Date: `text-xs`, gray-700, opacity 0.7
  - Spacing: `mb-2` between sections

- **Actions**:
  - Three-dot menu: `w-5 h-5` icon, gray-400
  - Menu dropdown: White background, `shadow-lg`, `rounded-lg`

#### Mobile Card
- **Container**:
  - Padding: `p-4` (reduced)
  - Shadow: `shadow-md` (stronger than desktop)
  - No hover effects

- **Image**:
  - Height: `h-64` (same)
  - No hover zoom

- **Title**:
  - Size: `text-xl` (20px) - **largest on mobile**
  - Margin: `mb-2`

- **Tags** (Mobile):
  - Position: Below title
  - Style: Solid backgrounds (`bg-yellow-50`, `bg-blue-50`, `bg-green-50`)
  - No borders, `rounded-full`
  - Size: `text-xs`, `px-2.5 py-1`
  - Icon size: `text-sm leading-none` (aligned)
  - Spacing: `gap-2 mb-3`

- **Metadata**:
  - "Posted by": `text-xs`, aligned with `min-h-[36px]`
  - User name: `text-xs`, `min-h-[36px]`
  - Location/Date: `text-xs`, emoji `text-sm`
  - Spacing: `mb-2` between sections

- **Actions**:
  - Three-dot menu: `w-6 h-6` (larger touch target), `p-2.5`
  - Border separator: `border-t border-gray-50 pt-3` (light separator)

- **Comments**:
  - Hidden by default on mobile
  - Expandable on tap

---

### 5.4 Filter Section

#### Desktop
- **Container**: 
  - Background: White
  - Padding: `p-6`
  - Shadow: `shadow-lg`
  - Border radius: `rounded-xl`
  - Always visible

- **Title**: `text-2xl font-bold`, `#5C3D2E`, `mb-6`

- **Form Elements**:
  - Label: `text-sm font-medium`, `mb-2`
  - Input/Select: `px-4 py-2`, `border-2`, `rounded-lg`
  - Border color: `#FFC845`
  - Focus: `border-yellow-400`
  - Spacing: `space-y-4`

#### Mobile
- **Container**:
  - Padding: `p-4` (reduced)
  - Collapsible: Collapsed by default

- **Header Button**:
  - Full width, clickable
  - Title: `text-xl font-bold`
  - Active count badge: `bg-[#FFB500]`, white text, `rounded-full`
  - Chevron icon: Rotates 180° when expanded
  - Margin: `mb-2`

- **Form Elements**:
  - Label: `text-sm font-medium`, `mb-1.5` (reduced)
  - Input/Select: `min-h-[48px]` (touch-friendly)
  - Spacing: `space-y-3` (tighter)

---

### 5.5 Buttons

#### Primary Button (Desktop)
- **Style**:
  - Background: Gradient `#FFB500` → `#FFC845`
  - Text: White, Poppins, semibold
  - Size: `px-8 py-4 text-base`
  - Shape: `rounded-full`
  - Shadow: `shadow-xl hover:shadow-2xl`
  - Hover: Scale `1.10`
  - Transition: `transition-all`

#### Primary Button (Mobile)
- **Style**:
  - Size: `px-4 py-2.5 text-sm`
  - Shadow: `shadow-lg hover:shadow-xl`
  - Hover: Scale `1.05`
  - Active: Scale `0.95`
  - Touch target: Minimum 44px height

#### Secondary Button
- **Style**:
  - Background: Gray (`bg-gray-100`)
  - Text: Gray-700
  - Size: `px-4 py-2 text-sm`
  - Shape: `rounded-lg`
  - Hover: `bg-gray-200`

---

### 5.6 Tags/Badges

#### Desktop Tags
- **Style**: Gradient backgrounds
  - Breed: Yellow gradient (`from-yellow-100 to-yellow-200`)
  - Size: Blue gradient (`from-blue-100 to-blue-200`)
  - Mood: Green gradient (`from-green-100 to-green-200`)
- **Text**: `text-yellow-800`, `text-blue-800`, `text-green-800`
- **Size**: `text-xs`, `px-3 py-1.5`
- **Shape**: `rounded-full`
- **Icon**: `text-sm` emoji

#### Mobile Tags
- **Style**: Solid backgrounds (no gradient)
  - Breed: `bg-yellow-50`
  - Size: `bg-blue-50`
  - Mood: `bg-green-50`
- **Text**: `text-yellow-700`, `text-blue-700`, `text-green-700`
- **Size**: `text-xs`, `px-2.5 py-1`
- **Shape**: `rounded-full`
- **Icon**: `text-sm leading-none` (aligned)

---

### 5.7 Leaderboard

#### Desktop
- **Container**:
  - Background: White
  - Padding: `p-6`
  - Border: `border-2 border-yellow-200`
  - Shadow: `shadow-lg`
  - Border radius: `rounded-xl`

- **Cards**:
  - Background: Gradient `from-yellow-50 to-orange-50`
  - Border: `border-2 border-yellow-200`
  - Padding: `p-4`
  - Hover: `shadow-lg`, scale `1.05`
  - Spacing: `space-y-3`

- **Text Sizes**:
  - Rank: `text-3xl`
  - Avatar: `text-4xl`
  - Name: `text-sm font-bold`
  - Stats: `text-sm`

#### Mobile
- **Container**:
  - Padding: `p-3` (reduced)
  - No border (removed yellow borders)
  - Expanded by default

- **Cards**:
  - No inner card styling
  - Direct content on outer container
  - Border: `border-b border-gray-200` (bottom only)
  - Padding: `py-2` (reduced)
  - Single row layout

- **Text Sizes**:
  - Rank: `text-xl`
  - Avatar: `text-2xl`
  - Name: `text-xs font-bold`
  - Stats: `text-xs`

---

### 5.8 Forms

#### Input Fields
- **Style**:
  - Border: `border-2`, color `#FFC845`
  - Border radius: `rounded-lg`
  - Padding: `px-4 py-3` (mobile), `px-4 py-2` (desktop)
  - Focus: `border-yellow-400`
  - Placeholder: `#374151` (gray-700), opacity 1
- **Mobile**: `min-h-[48px]` (touch target)

#### Select Dropdowns
- **Style**: Same as inputs
- **Text**: `#374151` (gray-700) for selected options
- **Options**: `#374151` (gray-700)

#### Text Areas
- **Style**: Same as inputs
- **Min height**: `min-h-[100px]`

---

### 5.9 Modals

#### Search Modal
- **Overlay**: `bg-black/50`, full screen, `z-50`
- **Container**:
  - Background: White
  - Border radius: `rounded-xl`
  - Shadow: `shadow-2xl`
  - Padding: `p-6`
  - Max width: `max-w-2xl`
  - Position: `pt-20` from top

---

## 6. Animations & Interactions

### 6.1 Background Animations
- **Paw Prints**:
  - Animation: `fadeInFloat` (combined fade-in + float + fade-out)
  - Duration: 9s cycle (3x slower)
  - Opacity: 0.3-0.5
  - Movement: Vertical float 15-25px, 4-6s per cycle
  - Fade-in: 1-1.5s, staggered over 3-5s
  - Fade-out: Slow fade at end of cycle

### 6.2 Hero Animations
- **Title Icons** (Desktop only):
  - Left icon: `floatLeft` - 3s cycle
  - Right icon: `floatRight` - 3.5s cycle
  - Movement: Vertical bob with slight horizontal drift
- **Content**:
  - Fade-in: 1s duration
  - Slide-up: `translate-y-8` → `translate-y-0`
  - Tagline delay: 300ms

### 6.3 Card Interactions
- **Desktop**:
  - Hover: Lift (`-translate-y-1`), shadow increase
  - Image zoom: `scale-110` on hover
  - Gradient overlay on image hover
- **Mobile**:
  - No hover effects
  - Touch feedback: Active states

### 6.4 Button Interactions
- **Hover**: Scale up, shadow increase
- **Active**: Scale down (mobile)
- **Transition**: `transition-all duration-300`

---

## 7. Mobile-Specific Design

### 7.1 Layout Adjustments
- **Hero**: Reduced height, smaller text
- **Cards**: Single column, tighter padding
- **Filters**: Collapsible accordion
- **Navigation**: Bottom nav bar (icon-only)
- **Spacing**: Reduced margins and padding throughout

### 7.2 Touch Targets
- **Minimum size**: 44px × 44px
- **Buttons**: `min-h-[44px]`
- **Icons**: `w-6 h-6` minimum
- **Text inputs**: `min-h-[48px]`

### 7.3 Typography (Mobile)
- **Card titles**: `text-xl` (largest)
- **User names**: `text-xs` (smaller)
- **Labels**: `text-xs`
- **Body**: `text-base`

### 7.4 Visual Adjustments
- **Tags**: Solid backgrounds, no borders
- **Cards**: Stronger shadows (`shadow-md`)
- **Comments**: Hidden by default
- **Edit badges**: Icon-only, show on hover/tap
- **Three-dot menus**: Larger touch targets

---

## 8. Desktop-Specific Design

### 8.1 Layout
- **Multi-column grids**: 2-4 columns
- **Side-by-side layouts**: Filters + Map (38.2% / 61.8% ratio)
- **Hover effects**: Enabled throughout
- **Floating animations**: Title icons

### 8.2 Typography
- **Larger headings**: Up to `text-7xl` for hero
- **More spacing**: Generous margins and padding
- **Gradient tags**: Full gradient backgrounds

### 8.3 Interactions
- **Hover states**: Cards, buttons, links
- **Scale transforms**: Buttons and cards
- **Shadow depth**: Layered shadows

---

## 9. Visual Hierarchy

### 9.1 Z-Index Layers
- **Background**: `z-0`
- **Content**: `z-10`
- **Navigation**: `z-30`
- **Modals/Overlays**: `z-50`
- **Bottom Nav**: `z-50`

### 9.2 Visual Weight
1. **Hero title** (largest, boldest)
2. **Card titles** (prominent)
3. **Section headings** (clear hierarchy)
4. **Body text** (readable)
5. **Metadata** (subtle, smaller)

---

## 10. Accessibility

### 10.1 Color Contrast
- **Text on white**: `#5C3D2E` (WCAG AA compliant)
- **Placeholder text**: `#374151` (darker for visibility)
- **Buttons**: White text on gradient (high contrast)

### 10.2 Touch Targets
- **Mobile**: Minimum 44px × 44px
- **Icons**: 24px minimum with padding
- **Inputs**: 48px height minimum

### 10.3 ARIA Labels
- All interactive elements have `aria-label`
- Navigation landmarks
- Form labels properly associated

---

## 11. Design Tokens Summary

```css
/* Colors */
--primary-gold: #FFB500
--primary-brown: #5C3D2E
--background: #FFFFFF
--text-primary: #5C3D2E
--text-secondary: #374151
--border-light: #F3F4F6
--border-medium: #E5E7EB

/* Typography */
--font-heading: Poppins (300-800)
--font-body: Inter (default)
--letter-spacing-heading: -0.02em

/* Spacing */
--spacing-xs: 0.5rem (8px)
--spacing-sm: 1rem (16px)
--spacing-md: 1.5rem (24px)
--spacing-lg: 3rem (48px)
--spacing-xl: 5rem (80px)

/* Shadows */
--shadow-sm: shadow-sm
--shadow-md: shadow-md
--shadow-lg: shadow-lg
--shadow-xl: shadow-xl

/* Border Radius */
--radius-sm: rounded-lg (8px)
--radius-md: rounded-xl (12px)
--radius-full: rounded-full
```

---

This document serves as the complete design reference for the PawPaw Encounters application. All components follow these specifications to ensure consistency across both mobile and desktop versions.


