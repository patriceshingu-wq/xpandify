

# Fix Sidebar Theme Badge for Long Theme Names

## Problem
When the yearly theme is a multi-word phrase (e.g., "Manifesting the Kingdom of God"), the theme badge in the sidebar expands or overflows, breaking the sidebar layout.

## Solution
Constrain the theme badge text with truncation so it never exceeds the sidebar width, and add a tooltip so users can still read the full theme on hover.

## Changes

### File: `src/components/layout/Sidebar.tsx`

- Add `truncate` and `max-w-full` classes to the Badge so long text is clipped with an ellipsis
- Wrap the Badge in a `Tooltip` so the full theme name is visible on hover
- Keep the badge hidden when the sidebar is collapsed (already the case)

### Technical Details

- Uses the existing `Tooltip` component from `@/components/ui/tooltip`
- No new dependencies or components needed
- The badge container is already constrained to `w-full` -- just needs the inner text to truncate
- Tooltip provides full accessibility for the clipped text

