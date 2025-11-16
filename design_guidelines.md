# ClassBeyond Design Guidelines

## Design Approach

**Selected Approach**: Material Design System

**Justification**: ClassBeyond serves low-resource educational contexts requiring maximum clarity, accessibility, and performance. Material Design provides:
- Proven patterns for content-heavy applications
- Strong visual hierarchy and feedback systems
- Mobile-first responsive framework
- Accessibility built-in for low-literacy users
- Lightweight, performant components

**Core Principles**:
1. **Clarity First**: Every element serves learning - no decorative distractions
2. **Offline-Ready Indicators**: Clear visual states for offline/online modes
3. **Role-Based Navigation**: Distinct layouts for Students, Teachers, Mentors, Admins
4. **Progressive Disclosure**: Show essential information first, details on demand
5. **Accessibility Priority**: Large touch targets, clear labels, high contrast

## Typography

**Font Family**: Roboto (Google Fonts CDN - Material Design standard)
- Primary: Roboto Regular (400)
- Emphasis: Roboto Medium (500)
- Headings: Roboto Bold (700)

**Type Scale**:
- H1 (Page Titles): text-4xl (36px), font-bold
- H2 (Section Headers): text-2xl (24px), font-bold
- H3 (Card Titles): text-xl (20px), font-medium
- Body: text-base (16px), font-normal
- Small/Meta: text-sm (14px), font-normal
- Buttons/Labels: text-base (16px), font-medium

**Line Heights**: leading-relaxed for body text (readability for low-literacy users)

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Component padding: p-4, p-6
- Section spacing: py-8, py-12
- Card gaps: gap-4, gap-6
- Margin between elements: m-2, m-4, m-6

**Grid System**:
- Container: max-w-7xl mx-auto px-4
- Dashboard grids: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Lesson cards: grid grid-cols-1 md:grid-cols-2 gap-4
- Student lists: Single column stack on mobile, two columns on tablet+

**Layout Patterns**:
- Sidebar navigation (Teachers/Admins): Fixed left sidebar 256px width on desktop, collapsible drawer on mobile
- Student view: Bottom tab navigation on mobile, top navigation on desktop
- Content areas: max-w-4xl for reading content, full-width for dashboards

## Component Library

**Navigation**:
- Top App Bar: 64px height, sticky positioning, role indicator badge
- Bottom Navigation (Mobile Students): Fixed bottom, 4 primary tabs (Home, Lessons, Badges, Profile)
- Sidebar (Teachers/Admins): Collapsible, icon + label format, active state highlighting
- Breadcrumbs: For lesson navigation showing Subject > Topic > Lesson

**Cards**:
- Lesson Cards: Elevated (shadow-md), rounded-lg, p-6, with subject icon, title, progress bar, and "Continue" or "Start" button
- Quiz Cards: Similar styling with quiz icon, question count, and badge indicator
- Progress Cards: Stats display with large numbers, labels, and trend indicators
- Mentor Cards: Profile photo, name, subject expertise, availability status

**Buttons**:
- Primary Actions: Rounded-lg, px-6 py-3, shadow-sm, font-medium
- Secondary Actions: Outlined style with border-2
- Icon Buttons: Square 40px, rounded-full for avatar actions
- Floating Action Button (FAB): For primary actions like "Request Mentor" - bottom-right on mobile

**Forms & Inputs**:
- Input Fields: border-2, rounded-lg, px-4 py-3, focus:ring-2 focus:ring-offset-2
- Labels: text-sm font-medium, mb-2, always visible above inputs
- Select Dropdowns: Custom styled to match input fields
- Checkboxes/Radio: Large touch targets (min 44x44px)
- File Upload: Dropzone with clear upload status indicator

**Data Display**:
- Progress Bars: Rounded-full, h-2, with percentage label
- Badge System: Circular badges with icons, locked/unlocked states clearly distinguished
- Tables (Admin/Teacher): Responsive with horizontal scroll on mobile, zebra striping for rows
- Charts: Simple bar charts for progress, avoid complex visualizations

**Feedback Elements**:
- Toast Notifications: Top-right positioning, auto-dismiss after 5s, with icon indicating success/error/info
- Loading States: Skeleton screens for content, spinner for actions
- Offline Indicator: Fixed banner at top when offline with sync icon
- Empty States: Illustration + message + action button (e.g., "No lessons yet. Browse Subjects")

**Modals & Overlays**:
- Dialogs: Centered, max-w-md, rounded-lg, with clear close button
- Bottom Sheets (Mobile): For filters, sorting, quick actions
- Full-Screen Overlays: For quiz taking, lesson viewing

**Dashboards**:
- Student Dashboard: Greeting header, progress overview cards (3 stats), "Continue Learning" section, recent badges
- Teacher Dashboard: Class overview cards, recent student activity feed, pending approvals count, quick actions
- Parent Dashboard: Child selector dropdown, progress summary, upcoming mentorship sessions
- Admin Dashboard: System stats grid, content approval queue, user management shortcuts

**Content Presentation**:
- Lesson Viewer: Clean reading layout, max-w-3xl, with navigation controls (Previous/Next), bookmark button, and download indicator
- Quiz Interface: One question per screen, large answer buttons, immediate feedback on selection, progress indicator
- Mentorship Scheduler: Calendar view with available slots highlighted, form for booking request

## Icons

**Icon Library**: Material Icons (Google Fonts CDN)
- Navigation: home, menu_book, emoji_events, account_circle
- Actions: download, bookmark, check_circle, cancel
- Status: cloud_off, cloud_done, sync
- Subject Icons: calculate (Math), translate (English), science
- Use: text-2xl (24px) for navigation, text-xl (20px) for cards

## Images

**Hero Image**: Large hero image on landing page showing diverse children learning together in a bright, hopeful setting. Full-width, min-h-screen on desktop, with centered text overlay and blurred-background CTA buttons.

**Additional Images**:
- Subject thumbnails: Icon-based illustrations for Math, English, Science on lesson cards
- Mentor profile photos: Circular avatars, 64px on cards, 128px on profile pages
- Achievement badges: Colorful illustrated badges for gamification
- Empty state illustrations: Friendly, simple line drawings for "no content" states

**Image Placement**:
- Landing hero: Full-width with overlay
- Dashboard cards: Small icons/avatars only
- Lesson content: Inline images as educational content
- Profile sections: Circular avatars

## Responsive Behavior

**Breakpoints**:
- Mobile: base (< 768px) - Single column, bottom navigation, stacked cards
- Tablet: md (768px+) - Two columns, side navigation option
- Desktop: lg (1024px+) - Three columns, persistent sidebar navigation

**Mobile Optimizations**:
- Bottom navigation instead of sidebar
- Collapsible sections with expand/collapse icons
- Larger touch targets (min 44px)
- Reduced content density
- Swipe gestures for lesson navigation

## Performance Considerations

- Minimize animation to simple transitions (opacity, transform)
- Use system fonts fallback: font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Lazy load images with placeholder states
- Progressive image loading for low bandwidth
- CSS-only interactions where possible

## Accessibility Standards

- Minimum contrast ratio 4.5:1 for body text
- All interactive elements keyboard accessible
- ARIA labels for icon-only buttons
- Clear focus indicators with ring-2 ring-offset-2
- Text alternatives for all images
- Logical heading hierarchy (no skipping levels)
- Form inputs with associated labels