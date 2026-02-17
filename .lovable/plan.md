

# Complete Event Recurrence System

## Overview
Currently, the `recurrence_pattern` field on events is just a label with no actual functionality -- it doesn't generate recurring instances or support editing individual occurrences. This plan adds a full recurrence engine with advanced patterns, exception handling, and edit-scope control.

## How It Will Work (User Perspective)
1. When creating/editing an event, you choose a recurrence pattern (daily, weekly on specific days, monthly by date or nth weekday, etc.)
2. You set an end condition: after N occurrences, until a specific date, or no end
3. The system generates individual event records for each occurrence
4. When editing a recurring event, you're asked: "Edit this event only" or "This and all future events"
5. When deleting, same choice: "Delete this one" or "This and all future"
6. You can skip specific dates (exception dates) without breaking the series

## Database Changes

### 1. New `event_recurrence_rules` table
Stores the recurrence configuration separately from individual events.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| frequency | text | daily, weekly, monthly, yearly |
| interval | int | Every N frequency units (e.g., every 2 weeks) |
| days_of_week | int[] | For weekly: 0=Sun..6=Sat |
| day_of_month | int | For monthly-by-date |
| nth_weekday | int | For monthly: 1st, 2nd, 3rd, 4th, -1 (last) |
| weekday_of_month | int | For nth-weekday: 0=Sun..6=Sat |
| end_type | text | 'never', 'after_count', 'until_date' |
| end_count | int | Number of occurrences (if after_count) |
| end_date | date | Last occurrence date (if until_date) |

### 2. Modify `events` table
Add columns to link occurrences to their series and rule:

| Column | Type | Description |
|--------|------|-------------|
| recurring_series_id | uuid | Groups all events in the same series |
| recurrence_rule_id | uuid FK | Points to the rule that generated this event |
| is_recurrence_exception | boolean | True if this occurrence was individually edited |
| original_date | date | The date this occurrence was originally scheduled for (before any edits) |

The existing `recurrence_pattern` column will be kept for backward compatibility but deprecated in favor of the new rule-based system.

### 3. New `event_recurrence_exceptions` table
Tracks dates that should be skipped (deleted occurrences).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| recurring_series_id | uuid | Which series |
| exception_date | date | The skipped date |

## Frontend Changes

### 1. New `RecurrenceRuleEditor` component
A dedicated UI section in the EventEditor that replaces the current simple dropdown. It will include:
- Frequency selector (Daily / Weekly / Monthly / Yearly)
- Interval input ("Every ___ weeks")
- Day-of-week checkboxes (for weekly: Mon, Tue, Wed...)
- Monthly mode toggle: "On day 15" vs "On the 3rd Tuesday"
- End condition: Never / After N occurrences / Until date

### 2. Update `EventEditor.tsx`
- Replace the simple recurrence dropdown with the new `RecurrenceRuleEditor`
- On save with recurrence: create the rule, then generate all occurrence events in a batch insert
- When editing an existing recurring event: show a dialog asking "This event only" or "This and all future events"
  - "This event only": mark the occurrence as an exception, update only that row
  - "This and all future": delete all future occurrences, regenerate from the edited event's date forward with the new data

### 3. New `EditScopeDialog` component
A confirmation dialog shown when editing or deleting a recurring event:
- "This event only"
- "This and all future events"
- "All events in the series" (for delete only)

### 4. Update `useEvents.ts` hook
- New `useCreateRecurringEvent` mutation: creates the rule + generates occurrences
- New `useUpdateRecurringEvent` mutation: handles edit-scope logic
- New `useDeleteRecurringEvent` mutation: handles delete-scope logic
- Add `useRecurrenceRule(ruleId)` query for loading rule details in the editor

### 5. Update `EventDetail.tsx`
- Show a "Recurring" badge with the pattern description (e.g., "Every 2 weeks on Tue, Thu")
- Show "Part of series" indicator with option to view all occurrences

### 6. Recurrence generation utility (`src/lib/recurrence.ts`)
A pure function that takes a start date, recurrence rule, and exception dates, and returns an array of occurrence dates. This handles:
- Daily: every N days
- Weekly: every N weeks on specified days
- Monthly by date: every N months on day X
- Monthly by nth weekday: every N months on the Nth [weekday]
- Yearly: every N years on the same date
- Capped at a reasonable maximum (e.g., 365 occurrences or 2 years out)

### 7. Translation keys
Add all new labels to `LanguageContext.tsx`:
- `calendar.recurrenceRule`, `calendar.frequency`, `calendar.interval`
- `calendar.daysOfWeek`, `calendar.endCondition`, `calendar.afterOccurrences`, `calendar.untilDate`
- `calendar.editScope`, `calendar.thisEventOnly`, `calendar.thisAndFuture`, `calendar.allInSeries`
- `calendar.recurring`, `calendar.partOfSeries`

## Implementation Sequence
1. Database migration (new tables + alter events)
2. Recurrence date generation utility with tests
3. RecurrenceRuleEditor component
4. EditScopeDialog component
5. Update useEvents hooks (create, update, delete with recurrence)
6. Update EventEditor to use new components
7. Update EventDetail to show recurrence info
8. Add all translation keys

