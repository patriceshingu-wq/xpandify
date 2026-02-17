# CLAUDE.md
# Project memory for Claude Code — loaded automatically at every session start.
# Keep this file LEAN. Only include what Claude needs to know in EVERY session.
# For task tracking and progress, see @docs/TASK_STATUS.md

---

## Project Overview

**App:** Xpandify
**Purpose:** Bilingual (EN/FR) church staff management combining HR with discipleship tools
**Target Users:** 10-30 church staff per organization
**Stack:** React 18 · TypeScript · Vite · Tailwind · shadcn/ui · Supabase
**Environments:**
- Dev: `http://localhost:8080` (Vite)
- Supabase: `hlclvflxteuzmstgpmds`
- Prod: Vercel (frontend) + Supabase Cloud (backend)

---

## Key Commands

```bash
# Development
npm run dev           # Start dev server (Vite on port 8080)
npm run build         # Production build
npm run lint          # ESLint
npm run test          # Run Vitest tests
npm run test:watch    # Run tests in watch mode

# E2E Tests (Playwright)
npx playwright install              # Install browsers (first time)
npx playwright test                 # Run all E2E tests
npx playwright test --ui            # UI mode for debugging
npx playwright test --debug         # Debug mode

# Supabase
npx supabase link --project-ref hlclvflxteuzmstgpmds
npx supabase db push                # Push migrations
```

---

## Architecture Decisions

> These are final decisions. Do not suggest changing them without being asked.

- **Mobile-first PWA:** Portrait-first, one-handed use, 44×44px minimum touch targets
- **Bilingual:** All DB fields use `*_en` / `*_fr` suffix pattern (e.g., `title_en`, `title_fr`)
- **RBAC:** `super_admin | admin | pastor_supervisor | staff | volunteer` (stored in `app_roles` table)
- **RLS:** Row-Level Security enforces all access; supervisors see direct reports via `supervises_person()`
- **State management:** TanStack React Query v5 only (no Redux, Zustand, etc.)
- **Auth:** Supabase Auth with email confirmation required (auto-confirm is OFF)
- **Feature flags:** Check `src/config/features.ts` — MVP features enabled, Phase 2 features hidden
- **Goals + PDPs:** Development items are stored in `goals` table with `pdp_id` set (not separate `pdp_items` table)
- **Responsive dialogs:** Use `ResponsiveDialog` component (dialog on desktop, drawer on mobile)

---

## File Structure (Key Paths)

```
src/
  pages/               # Route components (Dashboard, People, Goals, Meetings, etc.)
  components/          # Feature components organized by domain
    ui/                # shadcn/ui primitives (button, dialog, card, etc.)
    dashboard/         # StaffDashboard, SupervisorDashboard, widgets
    meetings/          # Meeting forms, calendar views, agenda items
    goals/             # GoalFormDialog, GoalCascadeView
    admin/             # UserManagementTable, MeetingTemplateManagement
  hooks/               # React Query hooks (useGoals, useMeetings, usePeople, etc.)
  contexts/            # AuthContext (session, roles, person), LanguageContext (i18n)
  integrations/supabase/
    client.ts          # Supabase client singleton
    types.ts           # Auto-generated TypeScript types
  config/
    features.ts        # Feature flags (MVP vs Phase 2)
  lib/
    utils.ts           # Utility functions (cn, date helpers)
docs/
  TASK_STATUS.md       # Current task status, next steps, blockers ← READ THIS
  PRD.md               # Full product requirements
  directory-structure.md
supabase/
  migrations/          # Database schema migrations
  functions/           # Edge Functions (generate-notifications, send-notification-email)
e2e/                   # Playwright E2E tests
```

---

## Coding Conventions

- **Never** use hardcoded EN/FR text — always use `t(key)` from `useLanguage()` context
- **Never** fetch data directly with Supabase client — always use React Query hooks in `src/hooks/`
- **Always** extend shadcn/ui components from `src/components/ui/` (never modify them directly)
- Use `useAuth()` context for session, roles, person — never call Supabase auth directly
- Use `hasRole()`, `hasAnyRole()`, `isAdminOrSuper` helpers for role checks
- Validate all forms with **Zod** schemas via React Hook Form
- Write errors to `console.error` with context: `console.error('[module] message', { context })`
- Use `toast()` from Sonner for user notifications (success/error/info)
- Mobile components should use `use-mobile.tsx` hook for responsive behavior
- Calendar/event features are open to all authenticated users (no admin-only restriction unless managing settings)

---

## Bilingual Field Pattern

**Database columns:**
```typescript
// Correct
goals: { title_en: string; title_fr: string }

// WRONG - do not create single-language columns
goals: { title: string }
```

**UI usage:**
```typescript
const { language, t } = useLanguage();
const displayTitle = goal[`title_${language}`]; // "title_en" or "title_fr"
```

---

## React Query Patterns

**All hooks in `src/hooks/` follow this pattern:**
```typescript
export function useGoals() {
  const queryClient = useQueryClient();
  
  // Query
  const { data: goals } = useQuery({
    queryKey: ['goals', filters],
    queryFn: async () => { /* fetch */ }
  });
  
  // Mutation
  const createMutation = useMutation({
    mutationFn: async (data) => { /* insert */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success(t('goal_created'));
    }
  });
  
  return { goals, createGoal: createMutation.mutate };
}
```

**Never** call Supabase directly in components — always use these hooks.

---

## Feature Flags

Before implementing features, check `src/config/features.ts`:

```typescript
export const FEATURES = {
  MVP: {
    goals: true,
    meetings: true,
    feedback: true,
    people: true,
    // ...
  },
  PHASE_2: {
    lms: false,           // Full LMS with assessments
    mentorship: false,    // Formal mentorship program
    surveys: false,       // Pulse surveys
    analytics: false,     // Advanced reporting
  }
};
```

**MVP features** are enabled and should be implemented.  
**Phase 2 features** are hidden and should NOT be implemented unless explicitly requested.

---

## When Compacting

> Instructions for Claude when running /compact

Always preserve in the summary:
1. The list of files modified this session
2. Any schema changes (table names, columns, RLS policies)
3. Any new React Query hooks created or modified
4. Decisions made (and why) that differ from the patterns above
5. The current task and its completion status
6. The exact next step to resume from
7. Any bilingual field additions or translation keys added

---

## Session Start Checklist

When starting a new session, always:
1. Read `@docs/TASK_STATUS.md` for current task and next steps
2. Check for any TODO comments left in recently modified files
3. Confirm feature flag status if implementing new features
4. Ask about test data needs if working on new modules
