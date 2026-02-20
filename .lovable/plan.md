
# Add Swipe Gesture Navigation to Events Calendar Month View

## Overview
Enable left/right swipe gestures on the month view of the Events Calendar so users can navigate between months on mobile devices. Swiping left advances to the next month, swiping right goes to the previous month.

## Changes

### 1. `src/pages/calendar/EventsCalendar.tsx`
- Import `useSwipeNavigation` from `@/hooks/useSwipeNavigation`
- Initialize the hook with `onSwipeLeft` mapped to `handleNext` and `onSwipeRight` mapped to `handlePrev`, enabled only when `viewMode === 'month'`
- Wrap the month view `Card` in a `div` that spreads the swipe `handlers` and applies `touch-pan-y` class
- Apply the `swipeOffset` transform during active swipes for visual feedback

### 2. Week view (bonus)
- Also attach the same swipe handlers around the week view for consistent mobile navigation between weeks

## Technical Details
- Reuses the existing `useSwipeNavigation` hook already used in `SwipeableTabs`
- The hook already handles horizontal vs vertical swipe detection and resistance-based visual feedback
- No new dependencies needed
