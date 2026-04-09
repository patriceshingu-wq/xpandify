
# Detailed Specs for Tasks 6–10 (Phase 2 Sprint 2 + Sprint 3 Start)

---

## Task 6: Build Action Item Carry-Forward Logic

**Journey:** J2 (Supervision) | **Estimate:** 2 days | **Complexity:** Medium

### Current State
- Action items live in `meeting_agenda_items` with `action_required=true`, `action_status`, `action_due_date`, `action_owner_id`
- When a recurring meeting creates the next instance, agenda template is copied but **incomplete action items from the previous meeting are not carried over**
- No link between action items across meeting instances

### What to Build
1. **On recurring meeting creation** — when generating the next instance in a series, query incomplete action items (`action_status IN ('open','in_progress')`) from the most recent past meeting in the same `recurring_series_id`
2. **Copy incomplete items** to the new meeting's agenda as a new `meeting_agenda_items` row with:
   - Same `topic_en/fr`, `action_owner_id`, `action_due_date`, `linked_goal_id`
   - `section_type = 'action_items'`
   - `action_status = 'open'` (reset to open)
   - `discussion_notes` cleared (fresh start)
3. **Visual indicator** — carried-forward items show a small "↻ Carried forward" badge in the agenda
4. **Also support manual carry-forward** — in MeetingDetailDialog, add a "Carry to next meeting" button on open action items that copies the item to the next meeting in the series (or any selected meeting)

### Acceptance Criteria
- [ ] When a recurring meeting instance is created, incomplete action items from the previous instance are auto-copied
- [ ] Carried items retain their owner, due date, and linked goal
- [ ] Carried items show a visual indicator distinguishing them from new items
- [ ] Manual carry-forward works for non-recurring meetings too
- [ ] Original item remains unchanged in the source meeting

### Files to Modify
- `src/components/meetings/MeetingFormDialog.tsx` — add carry-forward logic after recurring instance creation
- `src/hooks/useMeetings.ts` — add `useCarryForwardItems` mutation
- `src/components/meetings/MeetingDetailDialog.tsx` — add "Carry to next" button on action items

---

## Task 7: Build "Prepare for Meeting" Panel

**Journey:** J2 (Supervision) | **Estimate:** 3 days | **Complexity:** High

### Current State
- MeetingDetailDialog has 3 tabs: Agenda, Action Items, Participants
- No pre-meeting preparation view
- Supervisors manually review goals and feedback before meetings

### What to Build
1. **Add "Prep" tab** (or collapsible panel) to MeetingDetailDialog showing:
   - **Goal changes since last meeting**: Query goals owned by the person_focus_id, compare `progress_percent` and `status` changes (using `updated_at` > last meeting date)
   - **Recent feedback**: Query feedback where `person_id = person_focus_id` created since last meeting
   - **Outstanding action items**: Query incomplete items from previous meetings with same person_focus
   - **Upcoming due dates**: Goals with due dates in the next 2 weeks
2. **"Last meeting" detection**: Find the most recent past meeting with the same `person_focus_id` and `organizer_id`
3. **Auto-suggest agenda items**: Based on goal changes and overdue items, suggest topics to add to the agenda (click to add)

### Acceptance Criteria
- [ ] Prep tab shows goal progress changes since last meeting with the same person
- [ ] Recent feedback (given to/by person_focus) is listed
- [ ] Outstanding action items from previous meetings are shown
- [ ] Suggested agenda items can be added with one click
- [ ] Works for both 1:1 and other meeting types (falls back gracefully when no person_focus)
- [ ] Shows "No previous meeting found" for first-time meetings

### Files to Create/Modify
- `src/hooks/useMeetingPrep.ts` — NEW hook: queries goals, feedback, past action items relative to last meeting
- `src/components/meetings/MeetingPrepPanel.tsx` — NEW component for the prep view
- `src/components/meetings/MeetingDetailDialog.tsx` — add Prep tab

---

## Task 8: Enable Participant Agenda Item Adding

**Journey:** J2 (Supervision) | **Estimate:** 1 day | **Complexity:** Low

### Current State
- Only organizer and admins can add agenda items (checked via `canEdit` in MeetingDetailDialog)
- `canEdit` is already `isOrganizer || isParticipant || isAdminOrSuper` — so participants CAN already add items
- However, there's no distinction between organizer-added and participant-added items
- RLS allows participants to insert agenda items (meeting_participants check)

### What to Build
1. **Verify RLS** allows participants to insert `meeting_agenda_items` for meetings they're part of
2. **Add "added by" indicator** — show who added each agenda item (compare `created_at` timing or add `created_by_id` column)
3. **Pre-meeting item collection** — participants can add items before the meeting date, shown in a "Participant Topics" section
4. **Notification** — when a participant adds an item, the organizer gets a notification (use existing notification system)

### Acceptance Criteria
- [ ] Any meeting participant can add agenda items
- [ ] Items show who added them
- [ ] Organizer is notified when a participant adds an item
- [ ] Participant-added items appear in a distinguishable section or with a badge
- [ ] RLS correctly allows participant inserts but not edits of others' items

### Files to Modify
- `src/components/meetings/MeetingDetailDialog.tsx` — add "added by" display, participant section
- `src/hooks/useMeetings.ts` — no change needed (insert already works for participants)
- **Migration:** `ALTER TABLE meeting_agenda_items ADD COLUMN created_by_id UUID REFERENCES people(id)` — to track who added each item

---

## Task 9: Build Event Role Assignment UI

**Journey:** J4 (Event Planning) | **Estimate:** 3 days | **Complexity:** High

### Current State
- `event_roles` table exists with `event_id`, `person_id`, `role`, `from_country`, `notes`
- `EventRoleDialog` exists for adding a single role to an event
- EventDetail page shows roles in a simple list
- No bulk role assignment, no role templates, no vacancy display
- Feature is accessible but basic

### What to Build
1. **Role requirements template** — when creating/editing an event, define needed roles (e.g., "Need 2 Hosts, 1 Tech, 1 Worship Leader") without assigning people yet
2. **Role vacancy board** — on EventDetail, show required roles vs filled roles with visual fill indicator
3. **Quick-assign from people list** — click a vacant role → dropdown of available people (filtered by ministry membership)
4. **Bulk role copy** — copy role assignments from a previous event (useful for recurring events)
5. **"My Roles" widget** — on volunteer/staff dashboard, show upcoming events where user has a role assigned
6. **Role summary on event cards** — show role fill status (e.g., "3/5 roles filled") on EventsListView cards

### Acceptance Criteria
- [ ] Event creator can define required roles with quantities
- [ ] Vacant roles are visually distinct from filled roles
- [ ] People can be assigned to roles from the event detail page
- [ ] Role assignments can be copied from another event
- [ ] Dashboard shows user's upcoming role assignments
- [ ] Event cards show role fill status

### Database Notes
- May need a `event_role_requirements` table: `event_id`, `role_name`, `quantity_needed`, `is_filled`
- Or simpler: use `event_roles` with `person_id = NULL` to represent vacant slots

### Files to Create/Modify
- `src/components/calendar/EventRoleBoard.tsx` — NEW: vacancy board component
- `src/pages/calendar/EventDetail.tsx` — replace simple role list with EventRoleBoard
- `src/pages/calendar/EventEditor.tsx` — add role requirements section
- `src/components/dashboard/MyRolesWidget.tsx` — NEW: dashboard widget for assigned roles
- `src/hooks/useEventRoles.ts` — add bulk copy mutation
- **Migration:** Add `event_role_requirements` table if needed

---

## Task 10: Build Event Recurrence Instance Generation

**Journey:** J4 (Event Planning) | **Estimate:** 3 days | **Complexity:** High

### Current State
- `useRecurringEvents.ts` has `useCreateRecurringEvent` that creates a recurrence rule + generates event instances
- `RecurrenceRuleEditor.tsx` component exists with frequency/interval/end-type controls
- `EditScopeDialog` handles "this only" vs "this and future" for edits
- `useDeleteRecurringEvent` handles scoped deletion
- **BUT**: Recurrence is only available from the EventEditor page — no easy way to make an existing event recurring
- Role assignments are NOT copied to generated instances

### What to Build
1. **Copy event roles to instances** — when generating recurring event instances, also copy `event_roles` from the parent event
2. **Copy event goals to instances** — also copy `event_goals` linkages
3. **"Make Recurring" action** — on EventDetail page, add a button to convert a single event into a recurring series
4. **Instance management** — show all instances in a series on EventDetail with ability to navigate between them
5. **Exception handling** — when editing a single instance, mark it as `is_recurrence_exception = true` and preserve the edit
6. **Calendar visual** — recurring events show a recurrence icon (↻) on the calendar views

### Acceptance Criteria
- [ ] Creating a recurring event copies role assignments to all instances
- [ ] Creating a recurring event copies goal linkages to all instances
- [ ] Single events can be converted to recurring series
- [ ] Series instances are navigable from event detail
- [ ] Editing "this only" marks the instance as an exception
- [ ] Recurring events show a visual indicator on calendar views
- [ ] Deleting "this and future" removes future instances correctly

### Files to Modify
- `src/hooks/useRecurringEvents.ts` — add role/goal copy logic to instance generation
- `src/pages/calendar/EventDetail.tsx` — add "Make Recurring" action, series navigation
- `src/components/calendar/EventsListView.tsx` — add recurrence icon
- `src/components/calendar/EventsWeekView.tsx` — add recurrence icon
- `src/components/meetings/MonthlyCalendarView.tsx` — add recurrence icon (if events shown here)

---

## Implementation Order & Dependencies

```
Task 6 (Carry-Forward)     ──► depends on Task 5 (recurring meetings) ✅ done
Task 7 (Meeting Prep)      ──► standalone, no deps
Task 8 (Participant Agenda) ──► standalone, needs migration
Task 9 (Event Roles UI)    ──► standalone, may need migration
Task 10 (Event Recurrence)  ──► standalone, enhances existing recurrence

Recommended parallel tracks:
  Track A: Task 6 → Task 7
  Track B: Task 8 (quick) → Task 9 → Task 10
```
