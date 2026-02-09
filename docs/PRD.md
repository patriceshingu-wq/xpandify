# Xpandify — Product Requirements Document

## 1. Product Overview

**Xpandify** is a bilingual (English/French) church management web application that combines light HR features with discipleship and leadership development tools. It is built as a mobile-first Progressive Web App using **React 18, Vite, TypeScript, Tailwind CSS, and shadcn/ui**, with a **Supabase** (Lovable Cloud) backend for authentication, database, edge functions, and storage.

---

## 2. Users & Roles

The app uses Role-Based Access Control (RBAC) via `app_roles` and `user_roles` tables.

| Role | Description |
|------|-------------|
| `super_admin` | Full system access, org settings, user management |
| `admin` | Administrative access, user/role management |
| `pastor_supervisor` | Manages direct reports, conducts reviews, sets goals |
| `staff` | Standard employee — goals, meetings, learning, profile |
| `volunteer` | Limited access — basic profile, assigned training |

Roles are stored as `app_role_type` enum. A user can hold multiple roles. The `isAdminOrSuper` shortcut gates admin-only features.

---

## 3. Authentication

- **Email/password** sign-up and sign-in via Supabase Auth.
- Email confirmation is **required** (auto-confirm is off).
- On auth state change, the app fetches: `profiles` (language preference, active status), `people` (person record linked via `user_id`), and `user_roles` (with joined `app_roles.name`).
- `ProtectedRoute` redirects unauthenticated users to `/auth`. `PublicRoute` redirects authenticated users to `/dashboard`.

---

## 4. Data Model (Core Entities)

### 4.1 People & Organization

| Table | Purpose |
|-------|---------|
| `people` | Central person record (staff/volunteer). Fields: name, email, phone, campus, person_type, status, supervisor_id (self-ref), primary_language, strengths, growth_areas, calling_description. |
| `profiles` | Auth-linked user profile (id = auth.uid). Language preference, active flag. |
| `ministries` | Hierarchical org units (parent_ministry_id self-ref). Has leader_id → people. |
| `people_ministries` | Junction: person ↔ ministry membership. |
| `ministry_roles` | Role definitions (staff/volunteer categories). |
| `people_roles` | Junction: person ↔ ministry_role assignment. |
| `campuses` | Multi-site campus records with address info. |
| `organization_settings` | Singleton: org name, branding (colors, logo, font), contact info, email settings. |

### 4.2 Goals & Development

| Table | Purpose |
|-------|---------|
| `goals` | Unified goal/development item. Levels: `church`, `ministry`, `department`, `individual`. Supports hierarchical cascade via `parent_goal_id`. Categories: `spiritual`, `operational`, `financial`, `growth`, `training`, `leadership`, `other`. **PDP integration**: `pdp_id` (FK → personal_development_plans) and `item_type` (`course`, `mentoring`, `project`, `reading`, `other`) for development plan items. |
| `personal_development_plans` | PDP container with person_id, period, status, supervisor notes. |
| `pdp_items` | **Legacy** — data migrated to `goals` table with `pdp_id` set. |

### 4.3 Meetings

| Table | Purpose |
|-------|---------|
| `meetings` | Scheduled meetings with organizer, type (`one_on_one`, `team`, `ministry`, `all_staff`, `review`), recurrence support, optional ministry/person focus. |
| `meeting_participants` | Junction: meeting ↔ person. |
| `meeting_agenda_items` | Agenda entries with section_type, discussion notes, linked_goal_id, linked_pdp_item_id, linked_feedback_id, action items with owner/due date/status. |
| `meeting_templates` | Reusable agenda templates by meeting type. |
| `meeting_template_items` | Template agenda entries. |

### 4.4 Learning & Training

| Table | Purpose |
|----------|---------|
| `courses` | Training courses with category, delivery_type, duration. |
| `course_assignments` | Person ↔ course assignment with status tracking. |
| `course_progress` | Completion tracking per person per course (optionally within a pathway). |
| `pathways` | Sequenced learning tracks (code, difficulty, duration). |
| `pathway_courses` | Junction: pathway ↔ course with ordering. |
| `assessments` | Course assessments (quiz/exam) with passing criteria. |
| `assessment_results` | Person assessment attempts and scores. |

### 4.5 Feedback & Reviews

| Table | Purpose |
|-------|---------|
| `feedback` | Informal feedback entries (encouragement, coaching, concern). Visibility control via `visible_to_person`. |
| `reviews` *(implied)* | Formal performance reviews linked to review periods. |

### 4.6 Calendar & Events

| Table | Purpose |
|-------|---------|
| `quarters` | Fiscal/ministry quarters for planning. |
| `programs` | Named program containers within quarters. |
| `events` | Calendar events with date/time, location, status, linked quarter/program/ministry/course. |
| `event_roles` | Person assignments to events with role labels. |
| `event_goals` | Junction: event ↔ goal alignment. |
| `activity_categories` | Categorization for events. |

### 4.7 Mentorship

| Table | Purpose |
|-------|---------|
| `mentorship` | Mentor ↔ mentee pairings with focus area, frequency, status. |
| `mentorship_check_ins` | Session logs with notes, mood, prayer points, action items. |

### 4.8 Other

| Table | Purpose |
|-------|---------|
| `notifications` | In-app notifications per user with type, link, read status. |
| `surveys` *(implied)* | Pulse surveys for engagement tracking. |

---

## 5. Application Modules & Routing

| Route | Module | Description |
|-------|--------|-------------|
| `/auth` | Auth | Sign in / sign up (public route) |
| `/dashboard` | Dashboard | Role-adaptive: `StaffDashboard` or `SupervisorDashboard`. Widgets for action items, goal completion, team engagement, training progress, direct report cards. |
| `/people` | People Hub | Tabbed: Directory, My Team (direct reports), Peers, Supervisor. Dynamic default tab based on user role. |
| `/ministries` | Ministries | Ministry directory with hierarchy, members, leadership. |
| `/goals` | Goals Hub | **Tabbed**: Goals (church/ministry/individual, cascade view), Dev Plans (PDP management), Assignments (course assignments). Excludes PDP items from main goals list via `pdp_id IS NULL` filter. |
| `/meetings` | Meetings | Weekly/monthly calendar views with drag-and-drop rescheduling. Meeting creation with templates, agenda management, goal/PDP linking, action item tracking, rescheduling with conflict detection. Feedback integration auto-populates agenda items. |
| `/learning` | Learning Hub | Tabbed: Course Catalog, Pathways, My Progress. |
| `/mentorship` | Mentorship | Mentor/mentee pairings, check-in logs. |
| `/reviews` | Reviews Hub | Formal reviews + informal feedback (unified). Tabs for reviews, feedback history, meeting history panel, review period data. |
| `/surveys` | Surveys | Pulse surveys for engagement. |
| `/analytics` | Analytics | Reporting dashboards (admin). |
| `/administration` | Admin Hub | Tabbed: Users, Roles, Meeting Templates, Org Settings, Campuses, Email, System. Restricted to `admin`/`super_admin`. |
| `/profile` | Profile | User's own profile management. |
| `/calendar/*` | Calendar | Sub-routes: `/calendar/events`, `/calendar/quarters`, `/calendar/quarters/:id`, `/calendar/programs`, `/calendar/events/new`, `/calendar/events/:id`, `/calendar/events/:id/edit`. Access open to all authenticated users; admin management restricted by RLS. |

### Redirects (Legacy Routes)

| From | To |
|------|----|
| `/team` | `/people` |
| `/development` | `/goals` |
| `/courses` | `/learning` |
| `/pathways` | `/learning` |
| `/my-learning` | `/learning` |
| `/feedback` | `/reviews` |
| `/admin` | `/administration` |
| `/settings` | `/administration` |

---

## 6. UI Architecture

### 6.1 Layout

- **Desktop**: `Sidebar` (collapsible) + `Header` with notifications dropdown.
- **Mobile**: `MobileHeader` + `BottomNav` (5 items: Dashboard, People, Goals, Meetings, More). The "More" item opens `MobileMoreMenu` (bottom sheet) with grouped sections: Ministries, Calendar, Development (Learning, Mentorship, Reviews, Surveys), Admin (Analytics, Administration).

### 6.2 Design System

- **Component library**: shadcn/ui (Radix primitives + Tailwind).
- **Theming**: CSS custom properties in `index.css` with HSL values. Light/dark mode via `next-themes`. Semantic tokens: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--card`, `--popover`, `--sidebar-*`.
- **Custom UI components**: `StatCard`, `StatusBadge`, `EmptyState`, `PageHeader`, `PullToRefresh`, `SwipeableTabs`, `ResponsiveDialog` (dialog on desktop, drawer on mobile), `MobileSkeletons`.

### 6.3 Mobile-First Standards

- Portrait-first, one-handed use optimization.
- Minimum 44×44px touch targets (`.touch-target` class).
- Card-based lists over tables on mobile.
- Pull-to-refresh and swipe navigation on list/tab views.
- Safe-area padding for notched devices (`pb-safe`).
- `use-mobile.tsx` hook for responsive behavior.

---

## 7. Bilingual Support (i18n)

- `LanguageContext` provides `t(key)` translation function and `language` state (`en`/`fr`).
- User language preference stored in `profiles.primary_language`.
- Database fields use `*_en` / `*_fr` suffix pattern (e.g., `title_en`, `title_fr`, `name_en`, `name_fr`, `description_en`, `description_fr`).
- All UI labels should use translation keys via `t()`.

---

## 8. Backend Services

### 8.1 Edge Functions

| Function | Purpose |
|----------|---------|
| `generate-notifications` | Creates notification records based on system events. |
| `send-notification-email` | Sends email notifications using org email settings. |

### 8.2 Row-Level Security (RLS)

All tables have RLS enabled. Policies enforce:

- Users see/edit their own data (via `auth.uid()` matched to `user_id` or person record).
- Supervisors see direct reports' data.
- Admins have broader access.
- Public read on some reference tables (ministries, courses, pathways, activity_categories).
- Calendar/event visibility open to all authenticated users; administrative management restricted to admins and ministry leaders.

---

## 9. Key Data Hooks

| Hook | Purpose |
|------|---------|
| `useGoals` | CRUD goals with filters (year, level, status, category, owner, pdp_id, exclude_pdp_items). |
| `useMeetings` | Meeting CRUD with participant management. |
| `usePeople` | People directory queries. |
| `useDirectReports` | Supervisor's team members. |
| `useTeammates` | Peer-level colleagues. |
| `useSupervisor` | Current user's supervisor. |
| `useDevelopmentPlans` | PDP container CRUD. |
| `useCourses` / `useCourseAssignments` / `useCourseProgress` | Learning module data. |
| `useFeedback` / `useVisibleFeedback` | Feedback with visibility filtering. |
| `useReviews` | Performance review management. |
| `useMentorship` | Mentorship pairings and check-ins. |
| `useEvents` / `useEventRoles` / `useEventGoals` | Calendar event management. |
| `useNotifications` | In-app notification management. |
| `useOrganizationSettings` | Org branding and config. |
| `useAdminUsers` | User management (admin). |
| `useMeetingTemplates` | Meeting template CRUD. |

All hooks use **TanStack React Query v5** for caching, invalidation, and optimistic updates.

---

## 10. Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + tailwindcss-animate |
| Components | shadcn/ui (Radix primitives) |
| Routing | React Router v6 |
| State/Data | TanStack React Query v5 |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts |
| Backend | Supabase (Lovable Cloud) — Auth, PostgreSQL, Edge Functions, Storage |
| Theme | next-themes (light/dark) |
| Animations | Tailwind animate + CSS transitions |
| Date handling | date-fns v3 |
| Drag & Drop | @dnd-kit |
| Toasts | sonner + Radix Toast |
| Testing | Vitest + Testing Library (unit), Playwright (e2e) |

---

## 11. Architectural Principles

1. **Module Consolidation**: Redundant modules are unified into hub pages with tabbed interfaces. Legacy routes redirect.
2. **Mobile-First**: All features designed for mobile first, enhanced for desktop.
3. **Role-Adaptive UI**: Dashboards and navigation adapt based on user roles.
4. **Bilingual by Default**: All user-facing text uses translation keys; all DB content fields have `_en`/`_fr` variants.
5. **Hierarchical Goals**: Church → Ministry → Department → Individual cascade with visual tree view.
6. **Linked Workflows**: Meeting agendas link to goals/PDPs for in-context progress updates. Feedback auto-populates agenda items.
7. **Semantic Design Tokens**: All colors via CSS custom properties; no hardcoded colors in components.
