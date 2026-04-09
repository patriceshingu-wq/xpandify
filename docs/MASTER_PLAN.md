# Xpandify — Master Plan: User Journeys, Requirements & Phased Roadmap

> **Version:** 1.0 — First Pass  
> **Date:** 2026-04-07  
> **Status:** Draft for review  
> **Vision 2026:** EXPANSION (Isaiah 54:1–3) — Q1 Faith, Q2 Family, Q3 Mission, Q4 Possession

---

## Table of Contents

1. [User Personas](#1-user-personas)
2. [User Journeys](#2-user-journeys)
   - J1: Onboarding a New Person
   - J2: Weekly Supervision Cycle
   - J3: Goal Cascade & Alignment
   - J4: Event Planning & Execution
   - J5: Personal Development & Growth
   - J6: Feedback & Recognition
   - J7: Volunteer Self-Service
   - J8: Organizational Strategy & Reporting
3. [Phase Definitions](#3-phase-definitions)
4. [Journey × Phase Matrix](#4-journey--phase-matrix)
5. [Detailed Journey Specifications](#5-detailed-journey-specifications)
6. [Cross-Journey Integration Points](#6-cross-journey-integration-points)
7. [Technical Task Breakdown](#7-technical-task-breakdown)
8. [Success Metrics](#8-success-metrics)

---

## 1. User Personas

### P1: Senior Pastor / Super Admin — "Pastor David"

| Attribute | Detail |
|-----------|--------|
| **Role** | `super_admin` |
| **Goals** | Strategic alignment across all ministries; yearly vision tracking; staff health |
| **Pain points** | No visibility into ministry progress; manual follow-ups; scattered data |
| **Key screens** | Dashboard (supervisor), Goals (church cascade), Administration, Org Settings |
| **Frequency** | Daily (5-10 min dashboard check), Weekly (30 min reviews), Quarterly (strategic planning) |
| **Device** | Desktop primary, tablet secondary |

### P2: Pastor/Supervisor — "Pastor Marie"

| Attribute | Detail |
|-----------|--------|
| **Role** | `pastor_supervisor` |
| **Goals** | Develop direct reports; track ministry goals; conduct meaningful 1:1s |
| **Pain points** | Meeting prep takes too long; can't see staff progress at a glance; feedback gets lost |
| **Key screens** | Dashboard (supervisor), Meetings, People (My Team), Goals, Feedback |
| **Frequency** | Daily (dashboard + meeting prep), Weekly (1:1 meetings, feedback) |
| **Device** | Mobile primary (between meetings), desktop for detailed work |

### P3: Staff Member — "Jean"

| Attribute | Detail |
|-----------|--------|
| **Role** | `staff` |
| **Goals** | Know what's expected; track personal growth; prepare for meetings; feel connected |
| **Pain points** | Unclear priorities; no development tracking; meetings feel unstructured |
| **Key screens** | Dashboard (staff), Goals (personal), Meetings, Profile, Events Calendar |
| **Frequency** | Daily (quick check-in), Weekly (meeting prep, goal updates) |
| **Device** | Mobile primary |

### P4: Volunteer — "Sophie"

| Attribute | Detail |
|-----------|--------|
| **Role** | `volunteer` |
| **Goals** | Know schedule; fulfill ministry role; feel part of the team |
| **Pain points** | Doesn't know when/where to serve; no communication channel; feels disconnected |
| **Key screens** | Dashboard, Events Calendar, Ministries, Profile |
| **Frequency** | Weekly (check schedule), Event-driven |
| **Device** | Mobile only |

### P5: Administrator — "Patrice"

| Attribute | Detail |
|-----------|--------|
| **Role** | `admin` |
| **Goals** | Manage users, maintain data, configure system, onboard people |
| **Pain points** | Manual user creation; no bulk operations; scattered settings |
| **Key screens** | Administration (all tabs), People (Directory), Ministries |
| **Frequency** | As-needed (onboarding bursts, quarterly setup) |
| **Device** | Desktop primary |

---

## 2. User Journeys

### Journey Map Overview

```
J1: Onboarding ──────────► J2: Supervision Cycle ──────────► J8: Strategy & Reporting
                                    │                                    ▲
                                    ├── J3: Goal Cascade ────────────────┤
                                    ├── J5: Personal Development ────────┤
                                    └── J6: Feedback & Recognition ──────┘
                                    
J4: Event Planning ◄──── J7: Volunteer Self-Service
```

---

## 3. Phase Definitions

### Phase 1: MVP (Current — Complete ✅)

**Target:** Core church staff management for 10-30 users  
**Theme:** Get the basics right — people, goals, meetings, feedback

| Module | Status |
|--------|--------|
| People & Ministries | ✅ Complete |
| Goals (3-level cascade) | ✅ Complete |
| 1:1 Meetings with agendas | ✅ Complete |
| Events Calendar | ✅ Complete |
| Informal Feedback | ✅ Complete |
| PDPs (via goals) | ✅ Complete |
| Admin (8 tabs) | ✅ Complete |
| Auth + RBAC | ✅ Complete |
| Bilingual (EN/FR) | ✅ Complete |

### Phase 2: Engagement & Growth (In Progress)

**Target:** Deepen adoption; enable volunteers; add learning  
**Theme:** Make it sticky — training, self-service, automation

| Module | Status |
|--------|--------|
| DB-driven Feature Flags | ✅ Complete (org_settings toggles) |
| Real Dashboard Charts | ✅ Complete (real queries) |
| Action Items Widget | ✅ Complete (overdue warnings) |
| Welcome Empty State | ✅ Complete |
| Recurring Meetings | ✅ Complete (schema + feature flag) |
| Meeting Prep Panel | ✅ Complete |
| Action Item Carry-Forward | ✅ Complete |
| Participant Agenda Items | ✅ Complete (created_by_id) |
| Event Role Assignment UI | ✅ Complete (EventRoleBoard + MyRolesWidget) |
| Event Role Requirements | ✅ Complete (vacancy board) |
| Volunteer Notifications | ✅ Complete (role assignment notifications) |
| LMS (Courses, Pathways) | ✅ Enabled (feature flags ON) |
| Course Assignment from Catalog | ✅ Complete (Assign button on cards) |
| Mentorship Program | ✅ Enabled (feature flags ON, check-ins work) |
| Formal Reviews | ✅ Enabled (feature flags ON, 3-tab dialog) |
| Self-Assessment | ✅ Complete (self-ratings + comparison view) |
| Review + Meeting History | ✅ Complete (MeetingHistoryPanel + ReviewPeriodDataPanel) |
| Event Recurrence Enhancements | 🔲 Instance generation needed |
| Meeting Templates (user-facing) | 🔲 Admin-only currently |
| Advanced Analytics | 🔲 Basic dashboard widgets only |
| Pulse Surveys | 🔲 Schema needed |
| Bulk Operations | 🔲 Built but hidden |
| Org Chart | 🔲 Built but hidden |
| RSVP & Attendance | 🔲 Schema needed |
| Onboarding Wizard | 🔲 Not started |
| Enhanced Invite Dialog | 🔲 Not started |
| Report Export (PDF/CSV) | 🔲 Not started |

### Phase 3: Scale & Intelligence (Future)

**Target:** Multi-church, AI-assisted, advanced reporting  
**Theme:** Scale smart — automation, insights, integrations

| Module | Status |
|--------|--------|
| AI Meeting Summaries | 🔲 Not started |
| AI Goal Suggestions | 🔲 Not started |
| Multi-org / Multi-campus | 🔲 Campus table exists |
| External Calendar Sync (Google/Outlook) | 🔲 Not started |
| Mobile Push Notifications | 🔲 Not started |
| Advanced Reporting & Exports | 🔲 Not started |
| API & Integrations | 🔲 Not started |

---

## 4. Journey × Phase Matrix

| Journey | Phase 1 (MVP) ✅ | Phase 2 (Engagement) | Phase 3 (Scale) |
|---------|------------------|----------------------|-----------------|
| **J1: Onboarding** | Admin invite + manual setup | Guided onboarding wizard, bulk import, self-serve volunteer signup | Automated workflows, multi-org |
| **J2: Supervision** | 1:1 meetings + manual agenda | Recurring meetings, templates, linked feedback review | AI meeting prep & summaries |
| **J3: Goal Cascade** | 3-level hierarchy + manual progress | Auto-rollup, cascade view, department goals | AI goal suggestions, OKR framework |
| **J4: Events** | Basic CRUD calendar | Volunteer roles, RSVP, attendance, recurrence | Google/Outlook sync, auto-scheduling |
| **J5: Development** | PDPs via goals table | LMS courses, pathways, mentorship | AI learning recommendations |
| **J6: Feedback** | Informal feedback (3 types) | Formal reviews, 360 feedback, pulse surveys | Sentiment analysis, trends |
| **J7: Volunteer** | View-only calendar + profile | Self-serve role signup, training assignments | Availability management, auto-scheduling |
| **J8: Strategy** | Dashboard widgets (stats only) | Advanced analytics, goal reports, engagement metrics | Predictive insights, board reports |

---

## 5. Detailed Journey Specifications

---

### J1: Onboarding a New Person

#### 5.1.1 Narrative

A new staff member or volunteer joins the church. The admin creates their account, assigns them to ministries and a supervisor, and the person receives an invitation email. On first login, they complete their profile and can immediately see their dashboard, upcoming events, and any assigned goals.

#### 5.1.2 Wireflow — Phase 1 (Current)

```
Admin (Administration page)
  │
  ├─► Click "Invite User"
  │     └─► InviteUserDialog
  │           ├─ Enter: first_name, last_name, email
  │           ├─ Select: person_type (staff/volunteer)
  │           ├─ Select: role (app_role)
  │           ├─ Select: campus
  │           └─ Submit → Edge Function: invite-user
  │                 ├─ Creates auth.users record
  │                 ├─ Creates people record
  │                 ├─ Assigns user_role
  │                 └─ Sends invitation email → redirects to xpandify.wearemc.church/auth
  │
  ├─► Manually assign to ministry (Ministries page → Add Member)
  ├─► Manually set supervisor (People → Edit Person → supervisor_id)
  └─► Manually create initial goals (Goals → New Goal)

New User
  │
  ├─► Receives email → Clicks link → Sets password
  ├─► Redirected to /auth → Logs in
  ├─► Sees Dashboard (empty state)
  └─► Navigates to Profile → Edits preferences
```

#### 5.1.3 Acceptance Criteria — Phase 1

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Admin can invite a user with email, name, role, and campus | ✅ Done |
| 2 | Invitation email is sent with correct redirect URL | ✅ Done |
| 3 | New user can set password and log in | ✅ Done |
| 4 | Person record is automatically created and linked to auth user | ✅ Done |
| 5 | User role is assigned during invite | ✅ Done |
| 6 | Admin can manually assign person to ministry after creation | ✅ Done |
| 7 | Admin can set supervisor_id on person record | ✅ Done |
| 8 | Duplicate email is handled gracefully (409 error message) | ✅ Done |

#### 5.1.4 Wireflow — Phase 2 (Planned)

```
Admin (Administration page)
  │
  ├─► Bulk Import: Upload CSV → Preview → Confirm
  │     ├─ Auto-creates people records
  │     ├─ Auto-assigns ministries (by ministry name column)
  │     ├─ Auto-assigns supervisors (by supervisor email column)
  │     └─ Sends batch invitations
  │
  ├─► Invite → Enhanced Dialog
  │     ├─ All Phase 1 fields +
  │     ├─ Ministry assignment (multi-select)
  │     ├─ Supervisor assignment (dropdown)
  │     ├─ Welcome message (custom)
  │     └─ Auto-assign onboarding course pathway
  │
  └─► Volunteer Self-Registration
        ├─ Public signup link (limited role)
        └─ Admin approves → Account activated

New User
  │
  ├─► Receives email → Sets password → Logs in
  ├─► First-Login Wizard (NEW)
  │     ├─ Step 1: Upload photo + set preferred name
  │     ├─ Step 2: Set language preference (EN/FR)
  │     ├─ Step 3: Review ministry assignments
  │     ├─ Step 4: View assigned goals/training
  │     └─ Step 5: Quick tour of key features
  └─► Dashboard shows personalized welcome + next steps
```

#### 5.1.5 Acceptance Criteria — Phase 2

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Bulk CSV import creates people + sends invitations | 🔲 |
| 2 | CSV import supports ministry and supervisor columns | 🔲 |
| 3 | Enhanced invite dialog includes ministry + supervisor | 🔲 |
| 4 | First-login wizard guides new users through setup | 🔲 |
| 5 | Photo upload works in wizard | 🔲 |
| 6 | Language preference is set during onboarding | 🔲 |
| 7 | Assigned training courses appear on first login | 🔲 |
| 8 | Volunteer self-registration with admin approval | 🔲 |
| 9 | Welcome dashboard state shows next steps for new users | 🔲 |

#### 5.1.6 Phase 2 Tasks

| # | Task | Complexity | Dependencies |
|---|------|-----------|--------------|
| 1 | Enhance InviteUserDialog with ministry + supervisor fields | Medium | — |
| 2 | Update invite-user Edge Function to accept ministry/supervisor | Medium | Task 1 |
| 3 | Build first-login detection (check `last_sign_in_at` or flag) | Low | — |
| 4 | Build OnboardingWizard component (5 steps) | High | Task 3 |
| 5 | Enhance BulkImportDialog with ministry/supervisor columns | High | — |
| 6 | Build volunteer self-registration flow | High | New Edge Function |
| 7 | Create welcome dashboard empty state | Medium | Task 3 |

---

### J2: Weekly Supervision Cycle

#### 5.2.1 Narrative

Pastor Marie meets weekly with each of her 4 direct reports for 1:1 meetings. Before each meeting, she reviews the staff member's goal progress and recent feedback. During the meeting, she follows the agenda template, takes notes, and creates action items. After the meeting, the staff member can see the notes and their action items on their dashboard.

#### 5.2.2 Wireflow — Phase 1 (Current)

```
Supervisor (Dashboard)
  │
  ├─► Views "Upcoming Meetings" widget
  │     └─ Shows next 4 meetings with type badges
  │
  ├─► Clicks meeting → MeetingDetailDialog
  │     ├─ Tab 1: Agenda (grouped by section type)
  │     │     ├─ Section: Check-in / Spiritual
  │     │     ├─ Section: Goal Review (linked goals with progress bars)
  │     │     ├─ Section: Development
  │     │     ├─ Section: Action Items
  │     │     └─ + Add Agenda Item
  │     ├─ Tab 2: Action Items (filterable by status)
  │     │     ├─ Each item: topic, owner, due date, status
  │     │     └─ Update status: open → in_progress → completed
  │     └─ Tab 3: Participants
  │
  ├─► Creates new meeting → MeetingFormDialog
  │     ├─ Select template (if any)
  │     ├─ Set: title, date/time, duration, type
  │     ├─ Select person focus (for 1:1)
  │     ├─ Conflict detection (real-time)
  │     └─ Submit → auto-adds organizer + focus person as participants
  │
  └─► Gives feedback → FeedbackFormDialog
        ├─ Select person, type (encouragement/coaching/concern)
        ├─ Write content (EN/FR)
        ├─ Toggle visibility to person
        └─ If visible → auto-added to next 1:1 agenda

Staff Member (Dashboard)
  │
  ├─► Views "Upcoming Meetings" (same widget)
  ├─► Views action items assigned to them (StaffDashboard)
  └─► Updates goal progress (Goals page)
```

#### 5.2.3 Acceptance Criteria — Phase 1

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Supervisor can create 1:1 meetings with person focus | ✅ Done |
| 2 | Meeting templates auto-populate agenda sections | ✅ Done |
| 3 | Conflict detection warns of overlapping meetings | ✅ Done |
| 4 | Agenda items can link to goals with live progress display | ✅ Done |
| 5 | Action items have owner, due date, and status tracking | ✅ Done |
| 6 | Visible feedback auto-populates in 1:1 agenda | ✅ Done |
| 7 | Both participants see the same meeting details | ✅ Done |
| 8 | Dashboard shows upcoming meetings for all users | ✅ Done |

#### 5.2.4 Wireflow — Phase 2 (Planned)

```
Supervisor (Dashboard)
  │
  ├─► "Prepare for Meeting" prompt (NEW)
  │     ├─ Auto-summary: goal changes since last meeting
  │     ├─ Recent feedback given/received
  │     ├─ Outstanding action items from last meeting
  │     └─ Suggested agenda items
  │
  ├─► Recurring Meetings (NEW)
  │     ├─ Set recurrence: weekly/bi-weekly/monthly
  │     ├─ Auto-creates future instances
  │     └─ Carries forward incomplete action items
  │
  ├─► Post-Meeting Summary (NEW)
  │     ├─ Auto-generated notes summary
  │     ├─ Action items extracted
  │     └─ Optional: email summary to participant
  │
  └─► Meeting History Review (for performance reviews)
        ├─ Filter by person + date range
        ├─ View all past meeting notes
        └─ Export for review preparation

Staff Member
  │
  ├─► "Action Items" widget on dashboard (NEW — enhanced)
  │     ├─ Grouped by meeting
  │     ├─ Due date warnings (overdue highlighted)
  │     └─ Quick-complete from dashboard
  │
  └─► Self-add agenda items before meeting (NEW)
        └─ Participant can add topics they want to discuss
```

#### 5.2.5 Acceptance Criteria — Phase 2

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Recurring meetings create future instances automatically | ✅ Done (feature flag enabled, schema ready) |
| 2 | Incomplete action items carry forward to next meeting | ✅ Done (MeetingPrepPanel) |
| 3 | "Prepare for meeting" shows goal changes + recent feedback | ✅ Done (MeetingPrepPanel) |
| 4 | Staff can add agenda items before the meeting | ✅ Done (created_by_id column + RLS) |
| 5 | Post-meeting email summary can be sent to participants | 🔲 |
| 6 | Meeting history is filterable by person and date range | ✅ Done (MeetingHistoryPanel in reviews) |
| 7 | Dashboard action items widget shows overdue warnings | ✅ Done |

#### 5.2.6 Phase 2 Tasks

| # | Task | Complexity | Dependencies |
|---|------|-----------|--------------|
| 1 | Enable recurring meetings (use existing schema fields) | High | — |
| 2 | Build action item carry-forward logic | Medium | Task 1 |
| 3 | Build "Prepare for Meeting" panel | High | — |
| 4 | Enable participant agenda item adding (RLS already allows) | Low | — |
| 5 | Build post-meeting email summary Edge Function | High | Email infra |
| 6 | Enhance dashboard action items widget | Medium | — |
| 7 | Build meeting history export for reviews | Medium | — |

#### 5.2.7 Wireflow — Phase 3 (Future)

```
Supervisor
  │
  ├─► AI Meeting Prep (NEW)
  │     ├─ AI summarizes: "Jean's goal progress is 65%, up 15% since last meeting"
  │     ├─ AI suggests: "Consider discussing training completion — overdue by 2 weeks"
  │     └─ AI-generated agenda draft
  │
  ├─► AI Meeting Notes (NEW)
  │     ├─ Voice-to-text during meeting
  │     ├─ Auto-extracts action items from notes
  │     └─ Sentiment tracking over time
  │
  └─► Smart Scheduling (NEW)
        ├─ Finds optimal meeting times across participants
        └─ Google/Outlook calendar sync
```

---

### J3: Goal Cascade & Alignment

#### 5.3.1 Narrative

The senior pastor sets the yearly church goals aligned with the vision theme (EXPANSION). Ministry leaders create ministry-level goals that align to church goals. Supervisors assign individual goals to staff that align to ministry goals. Progress flows upward: individual → ministry → church.

#### 5.3.2 Wireflow — Phase 1 (Current)

```
Senior Pastor (Goals page → Church tab)
  │
  ├─► Creates church-level goal
  │     ├─ Title (EN/FR), description, category
  │     ├─ Year, start/due dates
  │     ├─ Status: not_started → in_progress → completed
  │     └─ Progress: 0-100% (auto-rollup from children)
  │
  └─► Views all church goals with progress bars

Ministry Leader (Goals page → Team tab)
  │
  ├─► Creates ministry-level goal
  │     ├─ Links to parent church goal (parent_goal_id)
  │     ├─ Assigns to ministry (owner_ministry_id)
  │     └─ Sets category + timeline
  │
  └─► Views ministry goals + progress

Supervisor (Goals page → My Goals tab)
  │
  ├─► Creates individual goal for staff
  │     ├─ Links to parent ministry goal
  │     ├─ Assigns to person (owner_person_id)
  │     └─ Staff member can update progress
  │
  └─► Views direct reports' goals (via supervisor RLS)

Staff Member (Goals page → My Goals tab)
  │
  ├─► Views own goals with progress bars
  ├─► Updates progress percentage
  └─► Changes status (triggers parent auto-rollup)
```

#### 5.3.3 Acceptance Criteria — Phase 1

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Church, ministry, and individual goal levels exist | ✅ Done |
| 2 | Goals can link to parent goals via parent_goal_id | ✅ Done |
| 3 | Parent goal progress auto-calculates from children (DB trigger) | ✅ Done |
| 4 | Goal cascade view shows tree hierarchy | ✅ Done (hidden in simple mode) |
| 5 | Goals support categories (spiritual, operational, etc.) | ✅ Done |
| 6 | Goals support bilingual titles and descriptions | ✅ Done |
| 7 | RLS enforces visibility (own goals, supervised, admin) | ✅ Done |
| 8 | Simple mode shows 3 tabs: My Goals, Team Goals, Church Goals | ✅ Done |

#### 5.3.4 Wireflow — Phase 2 (Planned)

```
Senior Pastor
  │
  ├─► Cascade View (advanced mode)
  │     ├─ Full tree: Church → Ministry → Department → Individual
  │     ├─ Color-coded by status
  │     ├─ Expand/collapse branches
  │     ├─ Filter by year, status, ministry
  │     └─ "Alignment Score" — % of ministry goals linked to church goals
  │
  ├─► Department-level goals (advanced mode)
  │     └─ Additional hierarchy level between ministry and individual
  │
  └─► Event-Goal Linking (advanced mode)
        ├─ Link events to goals they support
        └─ View goal progress impact from events

Supervisor
  │
  ├─► Goal Templates (NEW)
  │     ├─ Reusable goal structures
  │     └─ Apply template → creates goals for multiple people
  │
  └─► Goal Dependencies (NEW)
        ├─ Goal A depends on Goal B
        └─ Visual dependency graph
```

#### 5.3.5 Acceptance Criteria — Phase 2

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Cascade view shows full 4-level hierarchy | ✅ Done (feature flag enabled) |
| 2 | Department-level goals toggle via feature flag | ✅ Done (feature flag enabled) |
| 3 | Alignment score shows % of linked goals | 🔲 |
| 4 | Event-goal linking shows impact on goal progress | ✅ Done (feature flag enabled) |
| 5 | Goal templates can be created and applied | 🔲 |
| 6 | All advanced features toggled per-org via DB flags | ✅ Done |

#### 5.3.6 Phase 2 Tasks

| # | Task | Complexity | Dependencies |
|---|------|-----------|--------------|
| 1 | Enable cascade view in advanced mode (already built) | Low | Feature flag system |
| 2 | Enable department-level goals | Low | Feature flag system |
| 3 | Build alignment score calculation | Medium | — |
| 4 | Enable event-goal linking (already built) | Low | Feature flag system |
| 5 | Build goal templates system | High | New DB table |
| 6 | Implement DB-driven feature flags (organization_settings) | Medium | See FEATURE_UPGRADES_PLAN.md |

---

### J4: Event Planning & Execution

#### 5.4.1 Narrative

The ministry leader plans a training event. They create it on the calendar, assign it to their ministry, set the date/time/location, and optionally link it to quarterly goals. In Phase 2, they can assign volunteer roles and track attendance.

#### 5.4.2 Wireflow — Phase 1 (Current)

```
Any Authenticated User
  │
  ├─► Events Calendar (/calendar/events)
  │     ├─ Month view with swipe navigation (mobile)
  │     ├─ Week view
  │     ├─ List view
  │     ├─ Filter by ministry (color-coded)
  │     └─ Month context preserved across navigation
  │
  ├─► Create Event (/calendar/events/new)
  │     ├─ Title (EN/FR), description
  │     ├─ Date, start/end time (or all-day)
  │     ├─ Multi-day support (date + end_date)
  │     ├─ Location
  │     ├─ Ministry assignment
  │     ├─ Campus assignment
  │     ├─ Organizer assignment
  │     ├─ Status: Planned → Completed/Cancelled/Postponed
  │     └─ Language: English/French/Bilingual
  │
  ├─► View Event Detail (/calendar/events/:id)
  │     ├─ Full event info
  │     ├─ Edit/Delete (if organizer, ministry leader, or admin)
  │     └─ Status management
  │
  └─► Edit Event (/calendar/events/:id/edit)
        └─ Same form as create, pre-populated
```

#### 5.4.3 Acceptance Criteria — Phase 1

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Events CRUD with full bilingual support | ✅ Done |
| 2 | Month/Week/List views on calendar | ✅ Done |
| 3 | Ministry color-coding on calendar | ✅ Done |
| 4 | Swipe navigation between months (mobile) | ✅ Done |
| 5 | Month context preserved when creating/editing events | ✅ Done |
| 6 | Multi-day event support | ✅ Done |
| 7 | Campus and organizer assignment | ✅ Done |
| 8 | RLS: organizers + ministry leaders + admins can edit | ✅ Done |

#### 5.4.4 Wireflow — Phase 2 (Planned)

```
Ministry Leader
  │
  ├─► Assign Volunteer Roles (NEW)
  │     ├─ Define needed roles (worship leader, greeter, AV tech, etc.)
  │     ├─ Assign people to roles
  │     ├─ View unfilled roles
  │     └─ Notify assigned volunteers
  │
  ├─► Event Recurrence (NEW)
  │     ├─ Weekly/bi-weekly/monthly patterns
  │     ├─ Exception dates (skip holidays)
  │     └─ Edit single instance vs. series
  │
  ├─► RSVP & Attendance (NEW)
  │     ├─ Invite participants
  │     ├─ Collect RSVP responses
  │     ├─ Mark attendance post-event
  │     └─ Attendance history per person
  │
  ├─► Quarters & Programs (advanced mode)
  │     ├─ Organize events into quarterly themes
  │     ├─ Group events by program
  │     └─ Quarter-level progress tracking
  │
  └─► Activity Categories (advanced mode)
        ├─ Categorize events (worship, training, outreach, etc.)
        └─ Filter and report by category
```

#### 5.4.5 Acceptance Criteria — Phase 2

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Volunteer roles can be defined and assigned per event | ✅ Done (EventRoleBoard) |
| 2 | Unfilled roles are visually highlighted | ✅ Done (vacancy board) |
| 3 | Assigned volunteers receive notifications | ✅ Done |
| 4 | Recurring events generate instances automatically | 🔲 |
| 5 | Single instance can be edited without affecting series | 🔲 (EditScopeDialog exists) |
| 6 | RSVP responses collected and displayed | 🔲 |
| 7 | Post-event attendance marking | 🔲 |
| 8 | Quarters and Programs visible in advanced mode | ✅ Done (feature flags enabled) |

#### 5.4.6 Phase 2 Tasks

| # | Task | Complexity | Dependencies |
|---|------|-----------|--------------|
| 1 | Build EventRoleAssignment UI (schema exists) | High | — |
| 2 | Build recurrence instance generation (schema + lib exist) | High | — |
| 3 | Build edit-single-vs-series dialog (EditScopeDialog exists) | Medium | Task 2 |
| 4 | Build RSVP system (new table + UI) | High | New migration |
| 5 | Build attendance tracking (new table + UI) | Medium | New migration |
| 6 | Enable Quarters/Programs (already built, feature flag) | Low | Feature flag system |
| 7 | Build volunteer notification for role assignments | Medium | Notification system |

---

### J5: Personal Development & Growth

#### 5.5.1 Narrative

Pastor Marie creates a Personal Development Plan (PDP) for Jean. The PDP contains development goals (courses to complete, mentoring sessions, projects). Jean tracks progress on each item. In Phase 2, the PDP links to actual LMS courses and formal mentorship programs.

#### 5.5.2 Wireflow — Phase 1 (Current)

```
Supervisor
  │
  ├─► Goals page → Dev Plans tab (hidden in simple mode)
  │     ├─ View all PDPs for direct reports
  │     ├─ Create PDP → PDPFormDialog
  │     │     ├─ Select person
  │     │     ├─ Set period (Q1 2026, Annual, etc.)
  │     │     ├─ Add supervisor notes
  │     │     └─ Status: draft → active → completed
  │     └─ View PDP detail → PDPDetailDialog
  │           ├─ PDP metadata
  │           └─ Linked goals (goals with pdp_id = this PDP)
  │
  └─► Create development goals linked to PDP
        ├─ Goal with pdp_id set
        ├─ item_type: course, mentoring, project, reading, other
        └─ Standard goal tracking (progress, status, dates)

Staff Member
  │
  ├─► Goals page → My Goals tab
  │     ├─ Sees PDP-linked goals alongside regular goals
  │     └─ Updates progress on development items
  │
  └─► Profile page → Development section
        ├─ Strengths, growth areas, calling description
        └─ Editable by self + supervisor + admin
```

#### 5.5.3 Acceptance Criteria — Phase 1

| # | Criterion | Status |
|---|-----------|--------|
| 1 | PDPs can be created with person, period, and notes | ✅ Done |
| 2 | Goals with pdp_id are treated as PDP items | ✅ Done |
| 3 | PDP detail shows linked development goals | ✅ Done |
| 4 | Development goals support item_type classification | ✅ Done |
| 5 | Profile shows strengths, growth areas, calling | ✅ Done |
| 6 | Dev Plans tab hidden in simple mode | ✅ Done |

#### 5.5.4 Wireflow — Phase 2 (Planned)

```
Supervisor
  │
  ├─► Assign Course to Staff (NEW)
  │     ├─ Browse course catalog
  │     ├─ Assign with due date
  │     ├─ Track completion
  │     └─ Auto-creates PDP goal item
  │
  ├─► Create Mentorship Pairing (NEW)
  │     ├─ Select mentor + mentee
  │     ├─ Set focus area
  │     ├─ Define meeting frequency
  │     └─ Track check-ins
  │
  └─► Formal Performance Review (NEW)
        ├─ Review period (quarterly/annual)
        ├─ Self-assessment + supervisor assessment
        ├─ Meeting history summary
        ├─ Goal completion summary
        └─ Rating + narrative

Staff Member
  │
  ├─► Learning Hub (/learning) (NEW)
  │     ├─ Course Catalog: browse available courses
  │     ├─ My Progress: track assigned + voluntary courses
  │     ├─ Pathways: follow sequenced learning tracks
  │     └─ Complete assessments (quiz/exam)
  │
  ├─► Mentorship (NEW)
  │     ├─ View mentor/mentee relationship
  │     ├─ Log check-ins (notes, mood, prayer points)
  │     └─ Track action items from check-ins
  │
  └─► Self-Assessment (NEW)
        ├─ Complete self-review questionnaire
        └─ Submit for supervisor review
```

#### 5.5.5 Acceptance Criteria — Phase 2

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Course catalog displays available courses with categories | ✅ Done |
| 2 | Courses can be assigned to staff with due dates | ✅ Done (CourseAssignmentDialog) |
| 3 | Course progress tracking (0-100%) | ✅ Done (course_progress table) |
| 4 | Learning pathways with sequential course ordering | ✅ Done (PathwayDetailDialog) |
| 5 | Assessments with scoring and pass/fail | 🔲 (schema ready, no UI) |
| 6 | Mentorship pairings with focus area and frequency | ✅ Done |
| 7 | Mentorship check-in logging | ✅ Done |
| 8 | Formal reviews with ratings and self-assessment | ✅ Done (SelfAssessmentTab) |
| 9 | Review pulls meeting history + goal data | ✅ Done (MeetingHistoryPanel + ReviewPeriodDataPanel) |

#### 5.5.6 Phase 2 Tasks

| # | Task | Complexity | Dependencies |
|---|------|-----------|--------------|
| 1 | Enable Learning Hub (feature flag + routes exist) | Low | — |
| 2 | Build course catalog UI (CourseCatalogTab exists) | Medium | Task 1 |
| 3 | Build course assignment flow | Medium | — |
| 4 | Build pathway progress tracking | High | — |
| 5 | Build assessment engine (quiz UI + scoring) | High | — |
| 6 | Enable Mentorship (feature flag + routes exist) | Low | — |
| 7 | Build mentorship check-in flow (components exist) | Medium | Task 6 |
| 8 | Build formal review flow (components exist) | High | — |
| 9 | Build self-assessment questionnaire | Medium | Task 8 |

---

### J6: Feedback & Recognition

#### 5.6.1 Narrative

Any user can give feedback to another person — encouragement, coaching observation, or concern. Feedback can be private (supervisor-only) or visible to the recipient. Visible feedback auto-populates in the next 1:1 meeting agenda. In Phase 2, this extends to formal 360 reviews and pulse surveys.

#### 5.6.2 Wireflow — Phase 1 (Current)

```
Any User
  │
  ├─► Reviews page → Feedback tab
  │     ├─ View feedback given and received
  │     ├─ Filter by type (encouragement/coaching/concern)
  │     └─ Give feedback → FeedbackFormDialog
  │           ├─ Select person
  │           ├─ Select type
  │           ├─ Write content (EN/FR)
  │           ├─ Toggle: visible to person?
  │           └─ Submit
  │
  └─► Automatic: visible feedback appears in next 1:1 agenda
        └─ Section: "Recent Feedback" in MeetingDetailDialog

Supervisor
  │
  └─► Can view all feedback for direct reports (RLS)
        ├─ Including feedback marked not-visible-to-person
        └─ Context for performance conversations
```

#### 5.6.3 Acceptance Criteria — Phase 1

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Users can give 3 types of feedback | ✅ Done |
| 2 | Visibility toggle controls recipient access | ✅ Done |
| 3 | Supervisors see all feedback for direct reports | ✅ Done |
| 4 | Visible feedback auto-populates in 1:1 agendas | ✅ Done |
| 5 | Feedback supports bilingual content | ✅ Done |

#### 5.6.4 Wireflow — Phase 2 (Planned)

```
360 Feedback (NEW)
  │
  ├─► Admin initiates 360 review cycle
  │     ├─ Select reviewee
  │     ├─ Select reviewers (peers, reports, supervisors)
  │     ├─ Set deadline
  │     └─ Send review requests
  │
  └─► Reviewers complete structured feedback form
        ├─ Competency ratings
        ├─ Open-ended comments
        └─ Anonymous option

Pulse Surveys (NEW)
  │
  ├─► Admin creates survey
  │     ├─ Questions (Likert scale, open-ended)
  │     ├─ Target audience (all staff, ministry, campus)
  │     └─ Frequency (weekly/monthly/quarterly)
  │
  └─► Staff receives + completes survey
        ├─ Quick mobile-friendly form
        └─ Results aggregated for admin dashboard
```

#### 5.6.5 Phase 2 Tasks

| # | Task | Complexity | Dependencies |
|---|------|-----------|--------------|
| 1 | Build 360 feedback request system | High | New DB tables |
| 2 | Build structured feedback form with competencies | High | Task 1 |
| 3 | Build anonymous feedback option | Medium | Task 1 |
| 4 | Enable Surveys feature (flag exists) | Low | — |
| 5 | Build survey creation UI (SurveyFormDialog exists) | Medium | Task 4 |
| 6 | Build survey response collection | Medium | New DB table |
| 7 | Build survey results dashboard | High | Task 6 |

---

### J7: Volunteer Self-Service

#### 5.7.1 Narrative

Sophie is a volunteer in the Worship Ministry. She wants to check her upcoming serving schedule, confirm availability, and see what's coming up. In Phase 1, she can view events. In Phase 2, she can sign up for roles, manage availability, and complete assigned training.

#### 5.7.2 Wireflow — Phase 1 (Current)

```
Volunteer
  │
  ├─► Dashboard (staff view — limited data)
  │     ├─ Upcoming events from calendar
  │     └─ Basic stats (mostly empty for volunteers)
  │
  ├─► Events Calendar
  │     ├─ View all events (filtered by ministry if desired)
  │     └─ View event details
  │
  ├─► Ministries
  │     └─ View own ministry membership
  │
  └─► Profile
        └─ Edit basic info + photo
```

#### 5.7.3 Acceptance Criteria — Phase 1

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Volunteers can log in and see dashboard | ✅ Done |
| 2 | Volunteers can view events calendar | ✅ Done |
| 3 | Volunteers can view their ministry membership | ✅ Done |
| 4 | Volunteers can edit their own profile | ✅ Done |

#### 5.7.4 Wireflow — Phase 2 (Planned)

```
Volunteer
  │
  ├─► "My Schedule" widget on Dashboard (NEW)
  │     ├─ Shows events where volunteer has assigned role
  │     ├─ Upcoming serving dates highlighted
  │     └─ Quick confirm/decline availability
  │
  ├─► Event Role Signup (NEW)
  │     ├─ View events needing volunteers
  │     ├─ See available roles
  │     └─ Sign up for open roles
  │
  ├─► Availability Management (Phase 3)
  │     ├─ Set recurring availability (e.g., "available Sunday mornings")
  │     ├─ Block specific dates
  │     └─ Auto-suggest based on availability
  │
  └─► Assigned Training (NEW)
        ├─ View courses assigned by ministry leader
        ├─ Complete training modules
        └─ Track certification status
```

#### 5.7.5 Phase 2 Tasks

| # | Task | Complexity | Dependencies |
|---|------|-----------|--------------|
| 1 | Build "My Schedule" dashboard widget for volunteers | Medium | Event roles |
| 2 | Build event role signup UI | High | J4 Task 1 |
| 3 | Build volunteer notification for role assignments | Medium | Notification system |
| 4 | Enable course assignments for volunteers | Low | J5 LMS |
| 5 | Build volunteer-specific dashboard view | Medium | — |

---

### J8: Organizational Strategy & Reporting

#### 5.8.1 Narrative

Pastor David and Patrice need organizational visibility: How are goals progressing? Are meetings happening? Is the team engaged? They need dashboards and reports to make strategic decisions and present to the board.

#### 5.8.2 Wireflow — Phase 1 (Current)

```
Admin/Super Admin
  │
  ├─► Dashboard
  │     ├─ Stat cards: total people, active staff, volunteers, goals in progress
  │     ├─ Upcoming meetings
  │     ├─ Recent goals with progress
  │     └─ Charts (lazy loaded):
  │           ├─ Goal Completion (by status)
  │           ├─ Training Progress (mock data)
  │           └─ Team Engagement (mock data)
  │
  ├─► Yearly Theme Banner
  │     ├─ Theme name (EN/FR)
  │     ├─ Vision statement
  │     ├─ Scripture reference
  │     └─ Configured in Admin → Organization
  │
  └─► Organization Settings (Admin)
        ├─ Set yearly theme, vision, scripture
        ├─ Branding (colors, logo, font)
        └─ Email configuration
```

#### 5.8.3 Acceptance Criteria — Phase 1

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Dashboard shows real people/goal counts | ✅ Done |
| 2 | Yearly theme banner displays org settings | ✅ Done |
| 3 | Chart widgets render (some with mock data) | ✅ Done |
| 4 | Admin can configure org settings | ✅ Done |

#### 5.8.4 Wireflow — Phase 2 (Planned)

```
Admin/Super Admin
  │
  ├─► Analytics Dashboard (/analytics) (NEW)
  │     ├─ Goal completion rates by ministry/quarter
  │     ├─ Meeting frequency and consistency
  │     ├─ Feedback volume and sentiment
  │     ├─ Training completion rates
  │     ├─ Volunteer engagement metrics
  │     └─ Trends over time (quarterly comparison)
  │
  ├─► Reports (NEW)
  │     ├─ Staff development report (per person)
  │     ├─ Ministry health report
  │     ├─ Quarterly review summary
  │     └─ Export to PDF/CSV
  │
  └─► Board Report Generator (Phase 3)
        ├─ Pre-formatted report template
        ├─ Auto-populated with data
        └─ Exportable presentation
```

#### 5.8.5 Phase 2 Tasks

| # | Task | Complexity | Dependencies |
|---|------|-----------|--------------|
| 1 | Replace mock chart data with real queries | Medium | — |
| 2 | Build Analytics page with real metrics | High | — |
| 3 | Build goal completion by ministry/quarter report | Medium | Task 2 |
| 4 | Build meeting frequency report | Medium | Task 2 |
| 5 | Build staff development report (per person) | High | — |
| 6 | Build PDF/CSV export for reports | Medium | — |

---

## 6. Cross-Journey Integration Points

These are critical connections between journeys that must work together:

| Integration | Journeys | Description | Phase |
|------------|----------|-------------|-------|
| **Feedback → Meeting Agenda** | J6 → J2 | Visible feedback auto-populates 1:1 agendas | ✅ P1 |
| **Goal → Meeting Agenda** | J3 → J2 | Goals linked to agenda items show live progress | ✅ P1 |
| **Person → Ministry** | J1 → J4,J7 | Ministry membership determines event visibility | ✅ P1 |
| **Goal → Event** | J3 → J4 | Events linked to goals (hidden in simple mode) | ✅ P1 |
| **PDP → Goal** | J5 → J3 | Development items stored as goals with pdp_id | ✅ P1 |
| **Course → PDP** | J5 → J5 | Course assignments create PDP goal items | 🔲 P2 |
| **Review → Meeting History** | J6 → J2 | Formal reviews pull past meeting notes | ✅ P2 Done |
| **Event Role → Dashboard** | J4 → J7 | Volunteer sees serving schedule on dashboard | ✅ P2 Done (MyRolesWidget) |
| **Survey → Analytics** | J6 → J8 | Survey results feed analytics dashboard | 🔲 P2 |
| **AI Summary → Meeting** | J2 → J8 | AI meeting notes feed into analytics | 🔲 P3 |

---

## 7. Technical Task Breakdown

### Phase 2 — Priority Order

#### Sprint 1: Foundation (Weeks 1-2) ✅ COMPLETE
| # | Task | Journey | Complexity | Status |
|---|------|---------|-----------|--------|
| 1 | Implement DB-driven feature flags (org_settings → FEATURES) | All | Medium | ✅ Done |
| 2 | Replace mock dashboard chart data with real queries | J8 | Medium | ✅ Done |
| 3 | Enhance dashboard action items widget (overdue warnings) | J2 | Medium | ✅ Done |
| 4 | Build welcome dashboard state for new users | J1 | Medium | ✅ Done |

#### Sprint 2: Supervision Enhancement (Weeks 3-4) ✅ COMPLETE
| # | Task | Journey | Complexity | Status |
|---|------|---------|-----------|--------|
| 5 | Enable recurring meetings | J2 | High | ✅ Done |
| 6 | Build action item carry-forward logic | J2 | Medium | ✅ Done |
| 7 | Build "Prepare for Meeting" panel | J2 | High | ✅ Done |
| 8 | Enable participant agenda item adding | J2 | Low | ✅ Done |

#### Sprint 3: Events & Volunteers (Weeks 5-6) ✅ MOSTLY COMPLETE
| # | Task | Journey | Complexity | Status |
|---|------|---------|-----------|--------|
| 9 | Build event role assignment UI | J4 | High | ✅ Done |
| 10 | Build event recurrence instance generation | J4 | High | 🔲 Partial (UI ready, generation logic needed) |
| 11 | Build volunteer "My Schedule" widget | J7 | Medium | ✅ Done |
| 12 | Build volunteer notification system | J4,J7 | Medium | ✅ Done |

#### Sprint 4: Learning & Development (Weeks 7-8) ✅ COMPLETE
| # | Task | Journey | Complexity | Status |
|---|------|---------|-----------|--------|
| 13 | Enable Learning Hub (feature flag + wire up) | J5 | Low | ✅ Done |
| 14 | Build course catalog + assignment flow | J5 | Medium | ✅ Done |
| 15 | Build pathway progress tracking | J5 | High | ✅ Done |
| 16 | Enable Mentorship (feature flag + wire up) | J5 | Low | ✅ Done |
| 17 | Build mentorship check-in flow | J5 | Medium | ✅ Done |

#### Sprint 5: Feedback & Reviews (Weeks 9-10) ✅ COMPLETE
| # | Task | Journey | Complexity | Status |
|---|------|---------|-----------|--------|
| 18 | Build formal review flow | J5,J6 | High | ✅ Done |
| 19 | Build self-assessment questionnaire | J5 | Medium | ✅ Done |
| 20 | Build review + meeting history integration | J6,J2 | Medium | ✅ Done |

#### Sprint 6: Analytics & Onboarding (Weeks 11-12) ✅ COMPLETE
| # | Task | Journey | Complexity | Status |
|---|------|---------|-----------|--------|
| 21 | Build Analytics page with real metrics | J8 | High | ✅ Done |
| 22 | Build report export (PDF/CSV) | J8 | Medium | ✅ Done |
| 23 | Enhance invite dialog (ministry + supervisor) | J1 | Medium | ✅ Done |
| 24 | Build first-login onboarding wizard | J1 | High | ✅ Done |
| 25 | Enhance bulk import with ministry/supervisor | J1 | Medium | ✅ Done |

#### Sprint 7: Polish & Advanced (Weeks 13-14) ✅ COMPLETE
| # | Task | Journey | Complexity | Status |
|---|------|---------|-----------|--------|
| 26 | Build RSVP system | J4 | High | ✅ Done |
| 27 | Build attendance tracking | J4 | Medium | ✅ Done |
| 28 | Enable Surveys feature | J6 | Medium | ✅ Done |
| 29 | Build assessment engine | J5 | High | ✅ Done |
| 30 | Post-meeting email summary | J2 | Medium | ✅ Done |

---

## 8. Success Metrics

### Phase 1 Metrics (Baseline)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| User adoption | 100% of staff have accounts | Count active users |
| Weekly login rate | >80% of staff | Auth logs |
| Meetings created per week | ≥1 per supervisor | meetings table |
| Goals set per person | ≥2 per quarter | goals table |
| Feedback given per month | ≥2 per supervisor | feedback table |

### Phase 2 Metrics (Growth)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Volunteer engagement | >60% login monthly | Auth logs for volunteer role |
| Course completion rate | >70% within due date | course_progress table |
| Meeting prep usage | >50% of supervisors | "Prepare" panel views |
| Event role fill rate | >85% of needed roles | event_roles vs required |
| Survey response rate | >70% within deadline | survey_responses table |

### Phase 3 Metrics (Scale)

| Metric | Target | How to Measure |
|--------|--------|---------------|
| AI feature adoption | >40% use AI meeting prep | Feature usage tracking |
| Multi-campus coordination | Events shared across campuses | Cross-campus event count |
| Board report generation | Monthly auto-reports | Report generation logs |

---

## Appendix A: Current Feature Flag Map

```typescript
// src/config/features.ts — Current state
FEATURES = {
  simpleMode: true,          // Default ON — hides advanced features
  
  // MVP (Active)
  people: true,
  ministries: true,
  goals: true,
  meetings: true,
  calendar: true,
  feedback: true,
  pdp: true,
  admin: true,
  
  // Phase 2 (Hidden)
  courses: false,
  pathways: false,
  assessments: false,
  mentorship: false,
  formalReviews: false,
  surveys: false,
  analytics: false,
  
  // Advanced (Hidden in simple mode)
  advanced: {
    cascadeView: false,
    devPlans: false,
    orgChart: false,
    departmentGoals: false,
    eventGoalLinking: false,
    bulkOperations: false,
    bilingualEditing: false,
  }
}
```

## Appendix B: Database Readiness for Phase 2

| Feature | Tables Exist | Schema Ready | Needs Migration |
|---------|-------------|-------------|-----------------|
| LMS Courses | ✅ courses, course_assignments, course_progress | ✅ | No |
| Pathways | ✅ pathways, pathway_courses | ✅ | No |
| Assessments | ✅ assessments, assessment_results | ✅ | No |
| Mentorship | ✅ mentorship, mentorship_check_ins | ✅ | No |
| Event Roles | ✅ event_roles | ✅ | No |
| Event Recurrence | ✅ event_recurrence_rules, exceptions | ✅ | No |
| Surveys | ❌ | ❌ | Yes — need survey tables |
| RSVP | ❌ | ❌ | Yes — need event_rsvp table |
| Attendance | ❌ | ❌ | Yes — need event_attendance table |
| 360 Feedback | ❌ | ❌ | Yes — need review_requests table |
| Notifications (enhanced) | ✅ notifications | ✅ | No |
| Feature Flags (DB-driven) | ✅ organization_settings | ✅ | No (columns exist) |

---

*This document is a living plan. Update as decisions are made and phases progress.*
