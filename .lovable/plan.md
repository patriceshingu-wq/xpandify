

# Fix: Remove Forced Horizontal Scroll on Events Calendar Month View

## Problem
The last mobile-optimization change added `min-w-[700px]` to the month grid (line 238) and `overflow-x-auto` on its parent (line 234). This forces the calendar to be at least 700px wide, creating the left-right sliding behavior on mobile that wasn't there before.

## Fix

### `src/pages/calendar/EventsCalendar.tsx`

**Line 234**: Remove `overflow-x-auto` from the `CardContent` so it doesn't create a horizontal scroll container.

**Line 238**: Remove `min-w-[700px]` from the 7-column grid div. The `grid-cols-7` will naturally divide the available viewport width into 7 equal columns, fitting any screen size without overflow.

These are the only two class changes needed -- no logic or functionality is affected.

