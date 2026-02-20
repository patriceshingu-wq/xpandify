

# Fix: Return to Viewed Month After Event Create/Edit

## Problem
When creating or editing an event from the calendar, closing/saving navigates back to `/calendar/events`, which remounts the page and resets `currentDate` to `new Date()` (today). The user loses their place.

## Solution
Pass the current month context as a URL search parameter (e.g., `?month=2026-08`) so the calendar can restore the correct month on load.

## Changes

### 1. `src/pages/calendar/EventsCalendar.tsx`
- On mount, read a `month` search parameter from the URL (e.g., `?month=2026-08`) and use it to initialize `currentDate` instead of always defaulting to today.
- Update the "Add Event" button and day-cell click handlers to include `&month=YYYY-MM` in the navigation URL so the editor knows which month to return to.

### 2. `src/pages/calendar/EventEditor.tsx`
- Read the `month` search parameter from the URL on load.
- On all `navigate('/calendar/events')` calls, append `?month=YYYY-MM` so the calendar returns to the correct month.
- For `navigate('/calendar/events/{id}')` calls (going to detail), also pass `month` as a param.

### 3. `src/pages/calendar/EventDetail.tsx`
- Read the `month` search parameter from the URL.
- On "Back" / "Delete" / navigation back to the calendar list, append `?month=YYYY-MM`.
- On "Edit" navigation, forward the `month` param.

### 4. `src/components/calendar/EventsWeekView.tsx` and `src/components/calendar/EventsListView.tsx`
- Accept an optional `monthParam` prop (or similar) and include it in navigation URLs when clicking events or empty cells.

## Technical Notes
- The `month` param format will be `YYYY-MM` parsed with `parse(param, 'yyyy-MM', new Date())`.
- If the param is missing or invalid, the calendar falls back to today (current behavior).
- This approach is stateless (no global state or context needed) and URL-shareable.

