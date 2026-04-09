

# Detailed Specs for Next 5 Tasks (Phase 2 Sprint 1 + Sprint 2 Start)

Based on the Master Plan Section 7, these are Tasks #1-#5 in priority order.

---

## Task 1: DB-Driven Feature Flags via Organization Settings

**Journey:** All | **Estimate:** 3 days | **Complexity:** Medium

### Current State
- `src/config/features.ts` has hardcoded `simpleMode: true` which forces all advanced features OFF
- `useFeatureFlags()` hook already reads from `organization_settings` table (columns `feature_org_chart`, `feature_cascade_view`, etc.)
- But `simpleMode` short-circuits everything — the DB values are never used

### What to Build
1. **Replace `simpleMode` gate** in `useFeatureFlags()` — instead of returning all-false when `simpleMode` is true, always read from DB and fall back to static config only when DB value is null
2. **Add missing feature flag columns** to `organization_settings` for Phase 2 modules: `feature_courses`, `feature_pathways`, `feature_mentorship`, `feature_reviews`, `feature_surveys`, `feature_analytics`, `feature_recurring_meetings`
3. **Update Admin Feature Upgrades tab** (`FeatureUpgradesTab.tsx`) to show toggles for the new Phase 2 flags
4. **Update navigation/routing** in `Sidebar.tsx`, `BottomNav.tsx`, and `App.tsx` to respect DB-driven flags instead of hardcoded `FEATURES.*`

### Acceptance Criteria
- [ ] Admin can toggle any feature ON/OFF from Administration > Feature Upgrades
- [ ] Toggling a feature ON immediately shows it in navigation for all users
- [ ] Toggling OFF hides the feature without data loss
- [ ] Default state for new Phase 2 features is OFF
- [ ] Feature dependencies still work (programs requires quarters)
- [ ] No changes needed to `features.ts` static config (kept as fallback defaults)

### Files to Modify
- `src/hooks/useFeatureFlags.ts` — remove simpleMode gate, add new flag keys
- `src/hooks/useOrganizationSettings.ts` — add new column types
- `src/components/admin/FeatureUpgradesTab.tsx` — add Phase 2 toggle cards
- `src/components/layout/Sidebar.tsx` — use `useFeatureFlags()` for nav items
- `src/components/layout/BottomNav.tsx` — same
- `src/App.tsx` — guard routes with feature flags
- **Migration:** `ALTER TABLE organization_settings ADD COLUMN feature_courses boolean DEFAULT false, ...`

---

## Task 2: Replace Mock Dashboard Chart Data with Real Queries

**Journey:** J8 (Strategy & Reporting) | **Estimate:** 2 days | **Complexity:** Medium

### Current State
- `GoalCompletionChart` — uses REAL data from `useGoals()` (done)
- `TrainingProgressChart` — uses REAL data from `useCourseAssignments()` (done, but shows "No training data" since courses feature is OFF)
- `TeamEngagementChart` — uses HARDCODED mock data (`engagementData = [{month: 'Jan', engagement: 75}, ...]`)

### What to Build
1. **Replace TeamEngagement mock data** with real metrics derived from:
   - Meeting frequency per month (from `meetings` table — count by month)
   - Feedback volume per month (from `feedback` table — count by month)
   - Goal progress changes over time (from `goals` table — avg progress by month)
2. **Create `useEngagementMetrics()` hook** that queries the last 6 months of meeting counts, feedback counts, and goal progress
3. **Add a "Meetings This Week" stat** to the team stats section (replacing or supplementing the survey badge)
4. **Handle empty states** gracefully when no historical data exists

### Acceptance Criteria
- [ ] TeamEngagementChart shows real meeting frequency trend (last 6 months)
- [ ] Feedback volume is shown as a secondary metric
- [ ] No hardcoded sample data remains in any chart component
- [ ] Empty state shows "Not enough data yet" instead of fake numbers
- [ ] Chart updates when new meetings/feedback are created

### Files to Modify
- `src/hooks/useEngagementMetrics.ts` — NEW hook with 3 queries (meetings/month, feedback/month, goals avg)
- `src/components/dashboard/TeamEngagementChart.tsx` — replace mock data with hook
- `src/pages/Dashboard.tsx` — no changes needed (already lazy-loads charts)

---

## Task 3: Enhance Dashboard Action Items Widget with Overdue Warnings

**Journey:** J2 (Supervision) | **Estimate:** 2 days | **Complexity:** Medium

### Current State
- `StaffDashboard` shows action items with status badges and due dates
- `useUserActionItems()` fetches items ordered by due date
- No visual distinction between overdue, due today, and future items
- No count badge on navigation for pending items

### What to Build
1. **Add overdue styling** — items past due date get red highlight, "Overdue" badge, and sort to top
2. **Add "due today" styling** — amber highlight with "Due Today" badge
3. **Add overdue count badge** on the Meetings nav item (sidebar + bottom nav)
4. **Group action items** by urgency: Overdue > Due Today > Upcoming > No Due Date
5. **Quick-complete from dashboard** — allow status change directly from the card (already partially implemented, enhance UX)

### Acceptance Criteria
- [ ] Overdue items show red background/border and "Overdue" badge
- [ ] Due-today items show amber styling and "Due Today" badge
- [ ] Items are grouped by urgency section with headers
- [ ] Nav badge shows count of overdue + due-today items
- [ ] Quick status change works without opening meeting detail
- [ ] Supervisor dashboard also shows aggregate overdue count per direct report

### Files to Modify
- `src/components/dashboard/StaffDashboard.tsx` — add urgency grouping and styling
- `src/components/dashboard/DirectReportCard.tsx` — show overdue count
- `src/components/layout/Sidebar.tsx` — add badge to Meetings nav item
- `src/components/layout/BottomNav.tsx` — add badge
- `src/hooks/useUserActionItems.ts` — add `useOverdueCount()` export

---

## Task 4: Build Welcome Dashboard State for New Users

**Journey:** J1 (Onboarding) | **Estimate:** 1 day | **Complexity:** Medium

### Current State
- New users see empty stat cards (0 people, 0 goals, 0 meetings)
- Empty states exist per-widget but no cohesive "welcome" experience
- No detection of first-time login

### What to Build
1. **Detect new user** — check if user has zero goals, zero meetings, and person record was created within last 7 days
2. **Show WelcomeBanner component** instead of normal dashboard content for new users
3. **Banner content:**
   - Welcome message with user's name
   - Yearly theme (from org settings)
   - Quick-start checklist: "Complete your profile", "View your ministry", "Check upcoming events", "Review your goals"
   - Each item links to the relevant page
   - Dismissable (store flag in localStorage)
4. **Progressive disclosure** — show normal dashboard below the banner so it's not blocking

### Acceptance Criteria
- [ ] New user (< 7 days, 0 goals, 0 meetings) sees welcome banner
- [ ] Banner shows 4 quick-start actions with links
- [ ] Each completed action shows a checkmark (profile has photo, has ministry, etc.)
- [ ] Banner can be dismissed and doesn't reappear
- [ ] Existing users never see the banner
- [ ] Bilingual support for all banner text

### Files to Create/Modify
- `src/components/dashboard/WelcomeBanner.tsx` — NEW component
- `src/pages/Dashboard.tsx` — add WelcomeBanner conditionally
- Translation keys added for welcome messages

---

## Task 5: Enable Recurring Meetings

**Journey:** J2 (Supervision) | **Estimate:** 3 days | **Complexity:** High

### Current State
- `meetings` table has `recurrence_pattern` (text) and `recurring_series_id` (text) columns
- No UI for setting recurrence when creating a meeting
- `MeetingFormDialog` has no recurrence controls
- Event recurrence system exists (`useRecurringEvents.ts`, `RecurrenceRuleEditor.tsx`) but is for calendar events, not meetings
- Feature flag `meetingFeatures.recurringMeetings` is `false`

### What to Build
1. **Add recurrence selector** to `MeetingFormDialog` — simple dropdown: None, Weekly, Bi-weekly, Monthly
2. **On save with recurrence**, generate future instances:
   - Weekly: next 12 occurrences
   - Bi-weekly: next 12 occurrences
   - Monthly: next 6 occurrences
   - All share the same `recurring_series_id`
   - Each is a separate row in `meetings` (same pattern as event recurrence)
3. **Copy agenda template** to each generated instance
4. **Add participants** to each generated instance
5. **Edit scope dialog** — when editing a recurring meeting, ask: "This meeting only" or "This and future meetings" (reuse `EditScopeDialog` from calendar)
6. **Visual indicator** on meeting cards showing recurrence icon + pattern label
7. **Enable feature flag** `meetingFeatures.recurringMeetings = true`

### Acceptance Criteria
- [ ] User can select recurrence (none/weekly/biweekly/monthly) when creating a meeting
- [ ] Correct number of future instances are generated
- [ ] Each instance has the same agenda template sections
- [ ] Each instance has the same participants
- [ ] Editing a recurring meeting shows scope dialog
- [ ] "This only" edits just one instance
- [ ] "This and future" regenerates from that point
- [ ] Recurring meetings show a recurrence icon in lists
- [ ] Deleting a recurring meeting offers scope options

### Files to Modify
- `src/components/meetings/MeetingFormDialog.tsx` — add recurrence dropdown
- `src/hooks/useMeetings.ts` — add `useCreateRecurringMeeting` mutation
- `src/components/meetings/MeetingDetailDialog.tsx` — add edit scope handling
- `src/components/calendar/EditScopeDialog.tsx` — reuse as-is (already generic)
- `src/config/features.ts` — enable `recurringMeetings`

### Database Notes
- No migration needed — `recurrence_pattern` and `recurring_series_id` columns already exist
- `recurrence_pattern` stores: `"weekly"`, `"biweekly"`, `"monthly"`, or `null`
- `recurring_series_id` is a UUID shared across all instances in a series

---

## Implementation Order & Dependencies

```text
Task 1 (Feature Flags) ──► unlocks Phase 2 features
Task 2 (Real Charts)   ──► standalone, no deps
Task 3 (Action Items)  ──► standalone, no deps
Task 4 (Welcome State) ──► standalone, no deps
Task 5 (Recurring Mtgs) ──► depends on Task 1 (feature flag toggle)

Recommended parallel tracks:
  Track A: Task 1 → Task 5
  Track B: Task 2 → Task 3 → Task 4
```

