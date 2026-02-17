

# Fix: Restore Overnight Event Support Broken by Recurrence Changes

## Problem
The recurrence system changes overwrote the start_time onChange handler, removing the overnight auto-advance logic that was previously there. Currently:
1. The `start_time` input (line 373) uses a simple setter with no overnight detection
2. If a user sets start_time after end_time (or changes start_time to create an overnight scenario), the end_date is never auto-adjusted
3. This means the `timeError` on line 121 fires (since `date === end_date` and `end_time <= start_time`), blocking the save

## Fix

### `src/pages/calendar/EventEditor.tsx`

**1. Add overnight auto-advance logic to the `start_time` onChange handler (line 373)**

Replace the simple setter with logic that mirrors the end_time handler:
- If changing start_time causes `end_time <= start_time` while `date === end_date`, auto-advance `end_date` to the next day
- If changing start_time resolves the overnight condition (end_time is now after start_time) and end_date was auto-advanced to next day, revert end_date back to match date

**2. Add an `useEffect` to handle overnight detection reactively (safety net)**

Add an effect that watches `formData.start_time`, `formData.end_time`, `formData.date`, and `formData.end_date`. When it detects an overnight condition (`end_time <= start_time` and `date === end_date`), it auto-advances end_date. When the condition clears and end_date is the auto-advanced next day, it reverts. This covers edge cases like loading existing events or programmatic state changes (e.g., the existing event useEffect on line 88).

This reactive approach ensures overnight detection always works regardless of which field triggers the change.

## Summary of Changes
- One file modified: `src/pages/calendar/EventEditor.tsx`
- Two changes: enhanced start_time onChange + new useEffect for reactive overnight detection
- No database or other component changes needed

