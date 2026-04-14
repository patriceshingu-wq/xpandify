# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# For task tracking and progress, see @docs/TASK_STATUS.md

---

## Project Overview

**App:** Xpandify
**Purpose:** Bilingual (EN/FR) church staff management combining HR with discipleship tools
**Target Users:** 10-30 church staff per organization
**Stack:** React 18 · TypeScript · Vite · Tailwind · shadcn/ui · Supabase
**Environments:**
- Dev: `http://localhost:8080` (Vite)
- Supabase project ref: `hlclvflxteuzmstgpmds`
- Prod: Vercel (frontend) + Supabase Cloud (backend)

---

## Key Commands

```bash
# Development
npm run dev                          # Start dev server (Vite on port 8080)
npm run build                        # Production build (type-checks + bundles)
npm run lint                         # ESLint

# Unit Tests (Vitest)
npm run test                         # Run all tests once
npm run test:watch                   # Watch mode
npx vitest run src/path/to/file.test.ts  # Run a single test file

# E2E Tests (Playwright)
npx playwright install               # Install browsers (first time)
npx playwright test                   # Run all E2E tests
npx playwright test e2e/auth.spec.ts  # Run a single E2E test
npx playwright test --ui              # Interactive UI mode
npx playwright test --debug           # Step-through debugger

# Supabase
npx supabase link --project-ref hlclvflxteuzmstgpmds
npx supabase db push                  # Push migrations to cloud
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
- **Feature flags:** Check `src/config/features.ts` — MVP features enabled, Phase 2 features hidden. Per-org toggles stored in `organization_settings` and accessed via `useFeatureFlags()` hook
- **Goals + PDPs:** Development items are stored in `goals` table with `pdp_id` set (not separate `pdp_items` table)
- **Responsive dialogs:** Use `ResponsiveDialog` component (dialog on desktop, drawer on mobile)
- **Simple mode:** `FEATURES.simpleMode` is ON by default, reducing nav items and tabs. Advanced features are toggled per-org via Admin > Feature Upgrades

---

## Coding Conventions

- **Never** use hardcoded EN/FR text — always use `t(key)` from `useLanguage()` context
- **Never** fetch data directly with Supabase client in components — always use React Query hooks in `src/hooks/`
- **Always** extend shadcn/ui components from `src/components/ui/` (never modify them directly)
- Use `useAuth()` context for session, roles, person — never call Supabase auth directly
- Use `hasRole()`, `hasAnyRole()`, `isAdminOrSuper` helpers for role checks
- Validate all forms with **Zod** schemas via React Hook Form
- Write errors to `console.error` with context: `console.error('[module] message', { context })`
- Use `toast()` from Sonner for user notifications (success/error/info)
- Use `use-mobile.tsx` hook for responsive behavior
- Calendar/event features are open to all authenticated users (no admin-only restriction unless managing settings)
- Check feature flags with `useFeatureFlags()` hook (reads org settings), not static `FEATURES` config directly

---

## Bilingual Field Pattern

```typescript
// Database columns — always paired
goals: { title_en: string; title_fr: string }

// UI usage
const { language, t } = useLanguage();
const displayTitle = goal[`title_${language}`]; // resolves to "title_en" or "title_fr"
```

---

## React Query Hook Pattern

All hooks in `src/hooks/` follow this structure — queries + mutations in one hook, invalidation on success, toast for user feedback:

```typescript
export function useGoals() {
  const queryClient = useQueryClient();
  const { data: goals } = useQuery({
    queryKey: ['goals', filters],
    queryFn: async () => { /* supabase fetch */ }
  });
  const createMutation = useMutation({
    mutationFn: async (data) => { /* supabase insert */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success(t('goal_created'));
    }
  });
  return { goals, createGoal: createMutation.mutate };
}
```

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
