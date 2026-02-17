
# Mobile Overflow Fix: Enforce Mobile-First Across the App

## Problem
Several pages have elements overflowing outside the viewport on mobile (430px width), caused by:
1. Hard-coded `grid-cols-2` layouts that don't stack on small screens
2. Fixed-width elements (e.g. `w-[200px]`, `w-48`) that don't fit narrow viewports
3. The `App.css` file applying `max-width: 1280px` and `padding: 2rem` on `#root`, conflicting with the full-width mobile layout
4. The Goals page TabsList trying to fit 6 tabs in `grid-cols-3` on mobile
5. EventDetail page has a horizontal row of badges and progress bar that overflows
6. EventEditor uses `grid-cols-2` for date pickers and dropdowns without stacking on mobile
7. Profile page uses `grid-cols-2` for form fields without stacking
8. Settings page uses `grid-cols-2` for form fields without stacking
9. Development page has a fixed-width search input (`w-[200px]`) that doesn't flex
10. EventsCalendar month view renders a 7-column grid that overflows on mobile

## Pages Affected and Fixes

### 1. `src/App.css` - Remove conflicting root styles
The `#root` block sets `max-width: 1280px`, `padding: 2rem`, and `text-align: center`, which conflicts with the mobile layout system. Remove or neutralize these.

### 2. `src/pages/Goals.tsx` - Fix 6-tab overflow
The TabsList uses `grid-cols-3` but has 6 tabs, causing a second row that can overflow. Change to a horizontally scrollable container on mobile instead of a grid.

### 3. `src/pages/calendar/EventDetail.tsx` - Fix badge/progress row overflow
The status badges and progress bar are in a single `flex` row with `gap-4` that overflows. Wrap them to stack on mobile.

### 4. `src/pages/calendar/EventEditor.tsx` - Stack form fields on mobile
Multiple `grid-cols-2` sections (dates, times, status/completion, descriptions) need to become `grid-cols-1` on mobile: change to `grid-cols-1 sm:grid-cols-2`.

### 5. `src/pages/Profile.tsx` - Stack form fields on mobile
The `grid-cols-2` for name, email/phone, and strengths/growth areas needs `grid-cols-1 sm:grid-cols-2`. The profile header card `flex` row with avatar needs to stack on mobile.

### 6. `src/pages/Settings.tsx` - Stack form fields on mobile
Multiple `grid-cols-2` for phone/email, city/province, postal/country, sender name/email, and `grid-cols-3` for color pickers need mobile-responsive alternatives.

### 7. `src/pages/Development.tsx` - Fix search input width
The search input uses `w-[200px]` which is rigid. Change to `w-full sm:w-[200px]`.

### 8. `src/pages/calendar/EventsCalendar.tsx` - Fix month grid and filter overflow
- The 7-column month grid needs horizontal scroll on mobile or a condensed mobile view
- The filter row with fixed-width selects (`w-36`, `w-32`, `w-28`) needs to wrap and use full width on mobile
- The navigation row needs wrapping on mobile

### 9. `src/components/calendar/RecurrenceRuleEditor.tsx` - Fix nth-weekday row
The nth-weekday selector has two side-by-side `w-24` selects that could overflow on very small screens.

## Technical Summary

| File | Issue | Fix |
|------|-------|-----|
| `src/App.css` | `#root` padding/max-width | Remove conflicting styles |
| `src/pages/Goals.tsx` | 6 tabs in grid-cols-3 | Scrollable tabs on mobile |
| `src/pages/calendar/EventDetail.tsx` | Badge row overflow | `flex-wrap` on mobile |
| `src/pages/calendar/EventEditor.tsx` | grid-cols-2 forms | `grid-cols-1 sm:grid-cols-2` |
| `src/pages/Profile.tsx` | grid-cols-2 forms + avatar row | Stack on mobile |
| `src/pages/Settings.tsx` | grid-cols-2/3 forms | Stack on mobile |
| `src/pages/Development.tsx` | Fixed search width | `w-full sm:w-[200px]` |
| `src/pages/calendar/EventsCalendar.tsx` | 7-col grid + fixed filter widths | Scroll wrapper + responsive widths |
| `src/components/calendar/RecurrenceRuleEditor.tsx` | Side-by-side selects | `flex-wrap` |

All fixes use existing Tailwind responsive prefixes (`sm:`, `md:`) and add `overflow-x-auto` where needed, with no structural changes to component logic.
