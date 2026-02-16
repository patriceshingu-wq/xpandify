
# Support Overnight Events in the Calendar

## Problem
When creating an event that crosses midnight (e.g., Prayer Night from 10:00 PM to 2:00 AM), the form shows "End time must be after start time" and blocks saving. This is because the validation only compares times without considering dates.

## Solution
Update the time validation logic so that when end_time is earlier than start_time, the system automatically advances the end_date to the next day -- making overnight events intuitive to create.

## How It Will Work
1. **User enters** Start Date: Jan 15, Start Time: 10:00 PM, End Time: 2:00 AM
2. **System auto-sets** End Date to Jan 16 and removes the error
3. If the user changes end time back to after start time (e.g., 11:30 PM), end date reverts to match start date
4. A small info label appears: "Ends next day" so it's clear what happened

## Technical Changes

### 1. `src/pages/calendar/EventEditor.tsx`
- **Remove the blanket time error** (line 95-97) that rejects `end_time <= start_time` when `end_date > date`
- **Auto-advance end_date**: When the user picks an end_time earlier than start_time and both dates are still the same, automatically set `end_date` to the day after `start_date`
- **Auto-revert end_date**: When end_time is changed back to after start_time and end_date was auto-advanced, revert end_date to match start_date
- **Add "Ends next day" indicator** next to the end time field when end_time < start_time and end_date is the next day
- Only show the time error when dates are the same AND end_time is not after start_time

### 2. `src/pages/calendar/EventDetail.tsx` (display)
- When showing event times, if end_date is the day after start_date and end_time < start_time, display it clearly as an overnight event (e.g., "10:00 PM - 2:00 AM (+1 day)")

### 3. Calendar views (no database changes needed)
- The existing `date` / `end_date` fields already support multi-day spans, so overnight events will naturally render across two days in Month and Week views with no additional changes needed
