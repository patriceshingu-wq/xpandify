# Feature Upgrades System - Implementation Plan

## Context

The simplification work added a `simpleMode` flag with hard-coded advanced features. The user wants admins to selectively enable individual advanced features as "upgrades" - treating them as application tiers rather than a single on/off toggle. This enables future SaaS pricing tiers.

**Current state:** Features controlled by static `FEATURES.advanced.*` in code
**Desired state:** Features stored in DB, toggled per-organization via Admin UI

---

## Critical Issues to Fix First

Before implementing the upgrade system, these issues must be resolved:

### 1. CascadeView + DepartmentGoals Coupling (HIGH)
- **File:** `src/components/goals/GoalCascadeView.tsx:30`
- **Problem:** `LEVEL_ORDER` hard-codes 'department' even when departmentGoals is disabled
- **Fix:** Make LEVEL_ORDER dynamic based on feature flags

### 2. EventEditor Missing Feature Guards (MEDIUM)
- **File:** `src/pages/calendar/EventEditor.tsx:606-639`
- **Problem:** Quarters/Programs selectors always visible
- **Fix:** Wrap in feature flag conditionals

### 3. Orphaned Flags (LOW)
- `bulkOperations` - defined but not checked in DirectoryTab
- `bilingualEditing` - defined but controlled by simpleMode only
- **Fix:** Either wire them properly or remove

---

## Feature Groups (for Admin UI)

Group related features to simplify admin decisions:

```
People & Organization
├── orgChart          - "Org Chart Visualization"
└── bulkOperations    - "Bulk Import/Export"

Goals & Development
├── cascadeView       - "Goal Cascade View"
├── departmentGoals   - "Department-Level Goals" (auto-enabled with cascadeView)
├── devPlans          - "Development Plans Tab"
└── eventGoalLinking  - "Event-Goal Linking"

Calendar Advanced
├── quarters          - "Calendar Quarters"
└── programs          - "Programs" (requires quarters)

Forms & Editing
└── bilingualEditing  - "Side-by-Side Bilingual Editing"
```

---

## Implementation Steps

### Phase 1: Fix Dependencies (~30 min)

**1.1 Fix GoalCascadeView.tsx**
```typescript
// Before (line 30):
const LEVEL_ORDER = ['church', 'ministry', 'department', 'individual'] as const;

// After:
const LEVEL_ORDER = isAdvancedFeatureEnabled('departmentGoals')
  ? ['church', 'ministry', 'department', 'individual'] as const
  : ['church', 'ministry', 'individual'] as const;
```

**1.2 Fix EventEditor.tsx**
- Wrap quarters selector (lines 606-620) in `{FEATURES.calendarFeatures.quarters && (...)}`
- Wrap programs selector (lines 623-639) in `{FEATURES.calendarFeatures.programs && (...)}`

**1.3 Wire bulkOperations in DirectoryTab.tsx**
- Add feature check around Bulk Actions dropdown

### Phase 2: Database Schema (~20 min)

**2.1 Add columns to organization_settings table**

```sql
-- Migration: 20260223120000_feature_toggles.sql
ALTER TABLE organization_settings
ADD COLUMN feature_org_chart boolean DEFAULT false,
ADD COLUMN feature_bulk_operations boolean DEFAULT false,
ADD COLUMN feature_cascade_view boolean DEFAULT false,
ADD COLUMN feature_department_goals boolean DEFAULT false,
ADD COLUMN feature_dev_plans boolean DEFAULT false,
ADD COLUMN feature_event_goal_linking boolean DEFAULT false,
ADD COLUMN feature_quarters boolean DEFAULT false,
ADD COLUMN feature_programs boolean DEFAULT false,
ADD COLUMN feature_bilingual_editing boolean DEFAULT false;
```

**2.2 Update TypeScript types**
- Add fields to `organization_settings` type in `types.ts`

### Phase 3: Feature Context (~45 min)

**3.1 Create useFeatureFlags hook**
```typescript
// src/hooks/useFeatureFlags.ts
export function useFeatureFlags() {
  const { data: orgSettings } = useOrganizationSettings();

  return {
    orgChart: orgSettings?.feature_org_chart ?? false,
    bulkOperations: orgSettings?.feature_bulk_operations ?? false,
    cascadeView: orgSettings?.feature_cascade_view ?? false,
    departmentGoals: orgSettings?.feature_department_goals ?? false,
    // ... etc

    // Dependency helpers
    canEnablePrograms: orgSettings?.feature_quarters ?? false,
    canEnableCascade: true, // Will auto-enable departmentGoals
  };
}
```

**3.2 Create FeatureFlagsContext**
```typescript
// src/contexts/FeatureFlagsContext.tsx
// Wrap app in provider, memoize values for performance
```

**3.3 Update existing helper functions**
```typescript
// src/config/features.ts
// Replace static FEATURES.advanced.* with calls to useFeatureFlags()
// Keep FEATURES.simpleMode as override (if true, all advanced features disabled)
```

### Phase 4: Admin UI (~1 hour)

**4.1 Create FeatureUpgradesTab component**
- Location: `src/components/admin/FeatureUpgradesTab.tsx`
- Display feature groups with toggle switches
- Show dependencies (e.g., "Requires Quarters" for Programs)
- Auto-enable dependencies (e.g., enabling cascadeView enables departmentGoals)

**4.2 Add to Admin page**
- Add "Feature Upgrades" tab to Admin.tsx (after System tab)
- Restrict to super_admin only

**4.3 UI Design**
```
┌─────────────────────────────────────────────────┐
│ Feature Upgrades                                │
├─────────────────────────────────────────────────┤
│ People & Organization                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ [○] Org Chart Visualization                 │ │
│ │     View organizational hierarchy           │ │
│ │ [○] Bulk Import/Export                      │ │
│ │     CSV import and export for people        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Goals & Development                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ [○] Goal Cascade View                       │ │
│ │     Visualize goal hierarchy (enables Dept) │ │
│ │ [○] Department-Level Goals         [locked] │ │
│ │     Separate department from ministry       │ │
│ │ [○] Development Plans Tab                   │ │
│ │     Track personal development plans        │ │
│ │ [○] Event-Goal Linking                      │ │
│ │     Connect calendar events to goals        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Calendar Advanced                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ [○] Calendar Quarters                       │ │
│ │     Organize events by quarters             │ │
│ │ [○] Programs                       [locked] │ │
│ │     Requires: Quarters                      │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Phase 5: Replace Static Checks (~30 min)

Update all files that use `isSimpleMode()` or `isAdvancedFeatureEnabled()`:

| File | Current | Replace With |
|------|---------|--------------|
| `Sidebar.tsx` | `isSimpleMode()` | `useFeatureFlags()` |
| `Goals.tsx` | `isSimpleMode()`, `isAdvancedFeatureEnabled()` | `useFeatureFlags()` |
| `People.tsx` | `isSimpleMode()`, `isAdvancedFeatureEnabled()` | `useFeatureFlags()` |
| `GoalFormDialog.tsx` | `isSimpleMode()`, `isAdvancedFeatureEnabled()` | `useFeatureFlags()` |
| `GoalCascadeView.tsx` | `isAdvancedFeatureEnabled()` | `useFeatureFlags()` |
| `EventEditor.tsx` | Add new checks | `useFeatureFlags()` |
| `DirectoryTab.tsx` | Add new check | `useFeatureFlags()` |

---

## Files to Modify

```
supabase/migrations/
  20260223120000_feature_toggles.sql    (NEW)

src/
  config/features.ts                     (UPDATE - keep simpleMode override)
  contexts/FeatureFlagsContext.tsx       (NEW)
  hooks/useFeatureFlags.ts               (NEW)
  integrations/supabase/types.ts         (UPDATE - add feature columns)

  components/admin/FeatureUpgradesTab.tsx (NEW)
  pages/Admin.tsx                        (UPDATE - add tab)

  components/layout/Sidebar.tsx          (UPDATE)
  pages/Goals.tsx                        (UPDATE)
  pages/People.tsx                       (UPDATE)
  components/goals/GoalFormDialog.tsx    (UPDATE)
  components/goals/GoalCascadeView.tsx   (UPDATE - fix LEVEL_ORDER)
  pages/calendar/EventEditor.tsx         (UPDATE - add guards)
  components/people/DirectoryTab.tsx     (UPDATE - wire bulkOperations)

  contexts/LanguageContext.tsx           (UPDATE - add translations)
```

---

## Dependency Rules (Enforced in UI)

```typescript
const FEATURE_DEPENDENCIES = {
  // Enabling cascadeView auto-enables departmentGoals
  cascadeView: { autoEnable: ['departmentGoals'] },

  // Programs requires quarters
  programs: { requires: ['quarters'] },

  // Disabling quarters auto-disables programs
  quarters: { autoDisable: ['programs'] },
};
```

---

## Verification

1. **Unit test:** Toggle each feature in Admin, verify UI changes
2. **Dependency test:** Enable cascadeView, verify departmentGoals auto-enabled
3. **Dependency test:** Disable quarters, verify programs auto-disabled
4. **Persistence test:** Toggle features, refresh page, verify state persists
5. **Role test:** Verify only super_admin can access Feature Upgrades tab
6. **Build test:** `npm run build` passes without errors

---

## Estimated Time

| Phase | Time |
|-------|------|
| Fix dependencies | 30 min |
| Database schema | 20 min |
| Feature context | 45 min |
| Admin UI | 60 min |
| Replace static checks | 30 min |
| Testing | 30 min |
| **Total** | **~3.5 hours** |
