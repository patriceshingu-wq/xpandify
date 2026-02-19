# TASK_STATUS.md
# Living task tracker — update this before running /clear or ending a session.
# Reference this with @docs/TASK_STATUS.md when starting a new session.
# Claude Code can check off boxes automatically as tasks complete.

---

## Current Phase

**Phase:** MVP Testing & Refinement
**Started:** 2026-02-17
**Target completion:** TBD
**Status:** 🟢 Active Testing

---

## What We Are Building Right Now

The MVP is feature-complete and deployed. Currently in testing phase with focus on:
1. User acceptance testing with test accounts
2. Bug fixes and UX improvements based on feedback
3. Performance optimization
4. E2E test coverage completion

---

## Feature Gap Analysis Progress

Reviewing each major feature against PRD to identify gaps and improvements.

| Feature | Status | Gaps Found | Session |
|---------|--------|------------|---------|
| Calendar/Events | ✅ Complete | 3 gaps fixed (organizer_id, campus_id, recurrence cleanup) | 2026-02-17 |
| People/Directory | 🔄 Implementing | 7/9 gaps done (title ✅, campus FK ✅, profile page ✅, ministry UI ✅, infinite scroll ✅, org chart ✅, photos ✅), 2 remaining | 2026-02-18 |
| Ministries | ⏳ Pending | — | — |
| Goals | ⏳ Pending | — | — |
| Meetings | ⏳ Pending | — | — |
| PDPs | ⏳ Pending | — | — |
| Feedback | ⏳ Pending | — | — |
| Reviews | ⏳ Pending | — | — |
| Learning | ⏳ Pending | — | — |
| Admin | ⏳ Pending | — | — |

### People/Directory - Gap Analysis (2026-02-18)

**Current Implementation:**
- 4 tabs: Directory, My Team, Peers, Supervisor
- PersonFormDialog with 3 tabs (Basic, Ministry, Development)
- Hooks: usePeople, useDirectReports, useTeammates, useSupervisor, etc.
- Search/filter by name, person_type, status
- Supervisor hierarchy via self-referencing supervisor_id

**Confirmed Gaps (user approved):**

| # | Gap | Priority | Complexity | Status |
|---|-----|----------|------------|--------|
| 1 | Add `title` field to people schema | High | Low | ✅ Done |
| 2 | Change `campus` text → `campus_id` FK | High | Medium | ✅ Done |
| 3 | Add profile page (`/people/:id`) with full stats | High | Medium | ✅ Done |
| 4 | Add profile photo upload (Supabase Storage) | Medium | Medium | ✅ Done |
| 5 | Add ministry assignment UI (both directions) | High | Medium | ✅ Done |
| 6 | Add org chart visualization | Medium | High | ✅ Done |
| 7 | Add user invite flow (create auth + person) | Medium | High | ⏳ Pending |
| 8 | Add bulk import/export (CSV) | Low | High | ⏳ Pending |
| 9 | Add infinite scroll to directory | Low | Low | ✅ Done |

**Profile Page Design Decisions:**
- Sections: Basic info, Ministry memberships, Development (strengths/calling), Stats (goals, meetings, courses)
- Access: Basic info visible to all authenticated users; Development + Stats visible to self + supervisors + admins only
- Photo: Users can upload their own photo freely (no approval required)

**Ministry Assignment UI:**
- Add to PersonFormDialog (multi-select ministries)
- Also allow from Ministry detail page (add/remove members)

**Implementation Order (recommended):**
1. Schema changes: Add `title`, change `campus` → `campus_id`
2. Update PersonFormDialog with title field + campus dropdown
3. Add ministry assignment UI to PersonFormDialog
4. Create profile page with access controls
5. Add photo upload
6. Add infinite scroll
7. Add org chart
8. Add invite flow
9. Add bulk import/export

---

## Files Modified This Phase

```
src/
  hooks/useEvents.ts                    ✅ Updated - added campus_id, organizer_id, removed recurrence_pattern
  hooks/useRecurringEvents.ts           ✅ Updated - removed recurrence_pattern reference
  hooks/usePeople.ts                    ✅ Updated - campus_id FK with embedded join, title field, usePeopleInfinite hook
  hooks/useTeammates.ts                 ✅ Updated - campus_id FK with embedded join, title field
  hooks/useSupervisor.ts                ✅ Updated - campus_id FK with embedded join, title field
  hooks/usePersonStats.ts               ✅ Created - fetches goals/meetings/courses/feedback counts
  hooks/usePersonMinistries.ts          ✅ Created - fetches ministry memberships + sync mutation for person
  integrations/supabase/types.ts        ✅ Updated - people table: campus → campus_id, added title
  components/people/PersonFormDialog.tsx ✅ Updated - title field, campus dropdown, ministry multi-select
  components/people/DirectoryTab.tsx    ✅ Updated - displays title and campus, links to profile page, infinite scroll
  components/people/OrgChartTab.tsx     ✅ Created - hierarchical org chart with expand/collapse, zoom, search
  hooks/useProfilePhoto.ts              ✅ Created - upload/delete profile photos to Supabase Storage
  components/team/TeammateCard.tsx      ✅ Updated - displays title and campus.name
  components/team/SupervisorCard.tsx    ✅ Updated - displays title and campus.name
  contexts/LanguageContext.tsx          ✅ Updated - added people.*, personProfile.* translations
  pages/calendar/EventEditor.tsx        ✅ Updated - added campus_id, organizer_id dropdowns, auto-sets organizer
  pages/calendar/EventDetail.tsx        ✅ Updated - displays campus and organizer info
  pages/PersonProfile.tsx               ✅ Created - profile page with contact, ministries, development, stats, photo upload
  App.tsx                               ✅ Updated - added /people/:id route
  pages/People.tsx                      ✅ Updated - added Org Chart tab

e2e/
  auth.spec.ts                  ✅ Complete
  dashboard.spec.ts             ✅ Complete
  meeting-workflow.spec.ts      ✅ Complete
  role-access.spec.ts           ✅ Complete

supabase/migrations/
  20260217180000_fix_events_schema.sql  ✅ Applied - adds organizer_id, campus_id, drops recurrence_pattern
  20260218100000_people_add_title_and_campus_fk.sql  ✅ Applied - adds title, campus_id FK, drops campus text
  20260218150000_add_profile_photos.sql ⏳ Pending - adds photo_url column, creates storage bucket + RLS policies
```

---

## Test Accounts Created

```
Test user setup (password: testpassword@123):
- bideldjiki+admin@gmail.com (super_admin role)
- bideldjiki+pastor@gmail.com (pastor_supervisor role)
- bideldjiki+staff1@gmail.com (staff role)
- bideldjiki+staff2@gmail.com (staff role)
- bideldjiki+volunteer@gmail.com (volunteer role)
```

**Test data seeding:** Using Supabase Studio to manually create test data for:
- People records linked to auth users
- Ministries and roles
- Sample goals (church, ministry, individual)
- Sample meetings and agenda items
- Sample PDPs

---

## Schema Status

**Current Schema Version:** Production (latest migration applied)

**Key Tables:**
- `people` - Staff/volunteer records with supervisor hierarchy ✅
- `goals` - Unified goals + PDP items with `pdp_id` FK ✅
- `meetings` - Meetings with agenda items and linking ✅
- `personal_development_plans` - PDP containers ✅
- `courses` / `course_assignments` / `course_progress` - Learning system ✅
- `feedback` - Informal feedback with visibility control ✅
- `events` - Calendar events with quarter/program/ministry/campus/organizer links ✅
- `mentorship` - Mentor/mentee pairings ✅

**Applied Migration:** `20260217180000_fix_events_schema.sql` ✅
- Added `organizer_id` (FK → people) for tracking event creators
- Added `campus_id` (FK → campuses) for multi-campus support
- Dropped unused `recurrence_pattern` column (replaced by `recurrence_rule_id` FK)
- Added RLS policy "Organizers can manage their events"

---

## Decisions Made This Phase

| Decision | Reason | Date |
|---|---|---|
| Use Gmail + addressing for test accounts | No need for multiple actual accounts; all go to one inbox | 2026-02-12 |
| Keep LMS features hidden via feature flags | Phase 2 scope; MVP focuses on core HR + discipleship | Current |
| Unified goals table with `pdp_id` FK | Avoids duplicate tables; PDP items are just flagged goals | Current |
| Mobile-first with responsive dialog pattern | Primary users are on mobile; desktop is secondary | Current |
| Add `organizer_id` to events | Track who created/owns events (like meetings have `organizer_id`) | 2026-02-17 |
| Add `campus_id` to events | Enable multi-campus event filtering and assignment | 2026-02-17 |
| Drop `recurrence_pattern` from events | Replaced by `recurrence_rule_id` FK for proper relational recurrence | 2026-02-17 |

---

## Known Issues / Blockers

- [x] Migration `20260217180000_fix_events_schema.sql` needs to be applied to Supabase — **APPLIED**
- [x] Events table missing `organizer_id` field — **FIXED** (migration created)
- [x] Events table missing `campus_id` field — **FIXED** (migration created)
- [x] Events table had unused `recurrence_pattern` column — **FIXED** (dropped in migration)
- [x] TypeScript types mismatch with DB schema for events — **FIXED** (types.ts updated)
- [x] EventEditor missing campus/organizer UI fields — **FIXED** (dropdowns added)
- [x] EventDetail not displaying campus/organizer — **FIXED** (display sections added)
- [x] Migration `20260218100000_people_add_title_and_campus_fk.sql` applied — **DONE**

---

## Next Steps (in order)

### Testing Phase Tasks
- [ ] Complete user acceptance testing with all role types
- [ ] Document any UX friction points discovered during testing
- [ ] Run full E2E test suite and verify all passing
- [ ] Performance audit (Lighthouse scores, bundle size)
- [ ] Accessibility audit (WCAG 2.1 AA compliance check)

### Potential Bug Fixes (TBD based on testing)
- [ ] [Add issues discovered during testing here]

### Post-MVP Enhancements (if requested)
- [ ] Phase 2 features: Full LMS with assessments
- [ ] Phase 2 features: Formal mentorship program
- [ ] Phase 2 features: Pulse surveys
- [ ] Phase 2 features: Advanced analytics dashboards

---

## Testing Checklist

### Core Flows to Validate
- [ ] Auth: Sign up → Email confirm → Sign in → Dashboard redirect
- [ ] People: Directory browsing, supervisor hierarchy display
- [ ] Goals: Create church/ministry/individual goals, cascade view
- [ ] Meetings: Schedule 1:1, add agenda items, link to goals/PDPs
- [ ] Development: Create PDP, add goals as PDP items (via `pdp_id`)
- [ ] Feedback: Submit feedback, verify visibility controls
- [x] Calendar: Schema review completed — organizer_id and campus_id added
- [x] Calendar: UI updated — EventEditor has campus/organizer dropdowns, EventDetail displays them
- [ ] Admin: User management, role assignment, meeting templates
- [ ] Bilingual: Switch EN ↔ FR, verify all labels translate
- [ ] Mobile: Test on actual mobile device (iOS/Android)

### Role-Specific Testing
- [ ] **Super Admin:** Full access to all features + admin panel
- [ ] **Admin:** Same as super admin (no org settings lock)
- [ ] **Pastor/Supervisor:** View direct reports, conduct meetings, set team goals
- [ ] **Staff:** View own data, create individual goals, participate in meetings
- [ ] **Volunteer:** Limited access to profile, assigned training only

### Cross-Browser Testing
- [ ] Chrome (desktop + mobile)
- [ ] Safari (desktop + mobile iOS)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)

---

## Session Log

### 2026-02-18 Session
**Focus:** People/Directory feature gap analysis and implementation

**Completed:**
1. Conducted gap analysis interview for People/Directory feature
2. Identified 9 gaps against PRD (user approved all):
   - title field, campus FK, profile page, photos, ministry UI, org chart, invite, bulk ops, infinite scroll
3. Created migration `20260218100000_people_add_title_and_campus_fk.sql`:
   - Adds `title` text field for job title/position
   - Adds `campus_id` FK to campuses table
   - Migrates existing `campus` text data to `campus_id`
   - Drops old `campus` text column
4. Updated TypeScript types in `types.ts` (campus → campus_id, added title)
5. Updated hooks to use campus FK with embedded joins:
   - `usePeople.ts` - fetches campus relationship
   - `useTeammates.ts` - fetches campus and title
   - `useSupervisor.ts` - fetches campus and title
6. Updated UI components:
   - `PersonFormDialog.tsx` - added title input + campus dropdown
   - `DirectoryTab.tsx` - displays title (falls back to person_type), shows campus
   - `TeammateCard.tsx` - displays title in badge, campus.name
   - `SupervisorCard.tsx` - displays title in badge, campus.name
7. Added translations: `people.title`, `people.campus`, `people.selectCampus`
8. TypeScript compiles without errors
9. Implemented infinite scroll for directory:
   - Created `usePeopleInfinite` hook using React Query's `useInfiniteQuery`
   - Uses Supabase `range()` for pagination (20 items per page)
   - Intersection Observer triggers loading more when scrolling to bottom
   - Shows "Showing X of Y" count and loading spinner
   - Added `common.showing` and `common.of` translations
10. Implemented org chart visualization:
    - Created `OrgChartTab.tsx` with pure CSS/React hierarchical tree
    - Builds tree from supervisor_id relationships
    - Features: expand/collapse nodes, zoom in/out, search filter
    - Shows direct reports count on each node
    - Clicking a node navigates to profile page
    - Added 12 new translations for org chart UI
11. Implemented profile photo upload:
    - Created migration `20260218150000_add_profile_photos.sql`:
      - Adds `photo_url` column to people table
      - Creates `profile-photos` public storage bucket (5MB limit)
      - RLS policies: users upload their own, admins manage all
    - Created `useProfilePhoto.ts` hook for upload/delete operations
    - Updated `PersonProfile.tsx` with photo upload overlay (camera icon on hover)
    - Updated `DirectoryTab.tsx` and `OrgChartTab.tsx` to display photos
    - Added 4 translations for photo upload/delete feedback

**Pending:**
- Migration `20260218150000_add_profile_photos.sql` needs to be applied
- Remaining 2 People gaps to implement (invite flow, bulk import/export)

### 2026-02-17 Session (continued)
**Focus:** Calendar/Events UI implementation for campus and organizer fields

**Completed:**
1. Migration `20260217180000_fix_events_schema.sql` applied to Supabase
2. Updated `EventEditor.tsx`:
   - Added `useCampuses` and `usePeople` hooks
   - Added `useAuth` for current user's person
   - Added `campus_id` and `organizer_id` to form state
   - Added Campus dropdown (after Ministry)
   - Added Organizer dropdown (after Campus)
   - Auto-sets organizer to current user when creating new event
   - Loads existing campus/organizer when editing
3. Updated `EventDetail.tsx`:
   - Added Building and User icons
   - Added Campus display section (shows name and code)
   - Added Organizer display section (shows name)
4. Updated `TASK_STATUS.md` with all changes
5. Installed npm dependencies and started dev server (http://localhost:8080)
6. TypeScript compiles without errors

### 2026-02-17 Session (earlier)
**Focus:** Calendar/Events feature review and schema fixes

**Completed:**
1. Conducted detailed interview about Calendar/Events requirements
2. Analyzed existing Calendar/Events implementation vs requirements
3. Identified schema issues:
   - Missing `organizer_id` on events (who created the event)
   - Missing `campus_id` on events (multi-campus support)
   - Unused `recurrence_pattern` column (replaced by `recurrence_rule_id`)
4. Created migration `20260217180000_fix_events_schema.sql`
5. Updated TypeScript types in `types.ts`
6. Updated `useEvents.ts` hook with new fields and relationships
7. Updated `useRecurringEvents.ts` to remove `recurrence_pattern`
8. Updated `EventEditor.tsx` form state
9. Created `CLAUDE.md` for future sessions

**Bugs Found:**
- Events schema missing organizer tracking (fixed)
- Events schema missing campus support (fixed)
- Events had redundant `recurrence_pattern` column alongside `recurrence_rule_id` (fixed)

---

## Resume Prompt (copy-paste to start next session)

```
Read @docs/TASK_STATUS.md. Working on People/Directory feature gaps.
Completed: title field + campus_id FK (migration + types + hooks + UI).
Migration `20260218100000_people_add_title_and_campus_fk.sql` needs to be
applied (run `npx supabase login` then `npx supabase db push`).
Next: Implement remaining 2 gaps (invite flow, bulk import/export).
Migration `20260218150000_add_profile_photos.sql` needs to be applied.
```

---

## Module Status Reference

| Module | Status | Notes |
|--------|--------|-------|
| Auth | ✅ Complete | Email/password with confirmation |
| Dashboard | ✅ Complete | Role-adaptive (staff vs supervisor) |
| People | ✅ Complete | Directory, team, peers, supervisor tabs |
| Ministries | ✅ Complete | Hierarchy, members, leadership |
| Goals | ✅ Complete | Church/ministry/individual cascade |
| Meetings | ✅ Complete | Calendar, templates, agenda linking |
| Development (PDPs) | ✅ Complete | PDP container + goals with `pdp_id` |
| Learning | ✅ Complete | Courses, pathways, progress tracking |
| Feedback | ✅ Complete | Informal feedback with visibility |
| Reviews | ✅ Complete | Formal reviews + feedback history |
| Calendar/Events | ✅ Complete | Events, quarters, programs |
| Mentorship | ⚠️ Phase 2 | Feature flag OFF (not visible) |
| Surveys | ⚠️ Phase 2 | Feature flag OFF (not visible) |
| Analytics | ⚠️ Phase 2 | Feature flag OFF (not visible) |
| Admin | ✅ Complete | Users, roles, templates, org settings |

---

## Deployment Status

**Frontend:** Vercel (production URL: TBD)
**Backend:** Supabase Cloud (`hlclvflxteuzmstgpmds`)
**Edge Functions:** Deployed (notifications, email)
**RLS Policies:** All enabled and tested
**Auth Settings:** Email confirmation required ✅

---

## Performance Targets

- [ ] Lighthouse Performance Score: >90
- [ ] First Contentful Paint: <1.5s
- [ ] Time to Interactive: <3s
- [ ] Bundle size: <500KB (gzipped)
- [ ] Mobile usability: No layout shift on load

---

## Documentation Status

- [x] PRD.md - Complete product requirements
- [x] directory-structure.md - Full file tree
- [x] CLAUDE.md - Lean session memory
- [x] TASK_STATUS.md - Living task tracker (this file)
- [ ] API.md - API patterns and examples (create if needed)
- [x] E2E test README - Playwright test documentation
