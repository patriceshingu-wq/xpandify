# Complexity Analysis & Simplification Plan

**Date:** 2026-02-23
**Goal:** Reduce complexity to improve adoption for 10-30 person church staff teams

---

## Current State Assessment

### Navigation Structure (Too Complex)

| Section | Items | Assessment |
|---------|-------|------------|
| **Main** | Dashboard, People, Ministries, Goals, Meetings | OK - core features |
| **Calendar** | Events, Quarters, Programs | Overkill - most users just need Events |
| **Development** | Feedback, [Learning], [Mentorship], [Surveys] | Learning/Mentorship/Surveys already hidden |
| **System** | [Analytics], Admin | Analytics hidden, Admin OK |

**Total visible nav items:** 9 (should be 5-6 max for simplicity)

### Page-Level Complexity

| Page | Tabs | Assessment |
|------|------|------------|
| **Goals** | 6 tabs (My, Department, Ministry, Church, Cascade, Dev Plans) | Too many - consolidate |
| **People** | 5 tabs (Directory, Org Chart, My Team, Peers, Supervisor) | Too many - simplify |
| **Meetings** | TBD | Needs review |
| **Admin** | Multiple tabs | Expected for admin |

### Form Complexity

| Form | Fields | Issue |
|------|--------|-------|
| **GoalFormDialog** | 14+ fields including EN/FR pairs | Bilingual doubles visible fields |
| **PersonFormDialog** | Multiple tabs, many fields | Could be simpler for basic use |
| **EventEditor** | Many fields + goal linking | Event-goal linking adds cognitive load |

---

## Complexity Issues by Category

### 1. Cognitive Overload (High Impact)

| Issue | Why It Hurts | Fix |
|-------|--------------|-----|
| 6 goal tabs | Users don't know where to look | Reduce to 3: My, Team, Church |
| Department vs Ministry | Redundant for small churches | Merge into "Team" |
| Cascade View | Powerful but confusing concept | Hide by default |
| Bilingual side-by-side | 4 fields for title+description | Single language default |

### 2. Feature Bloat (Medium Impact)

| Feature | Assessment | Recommendation |
|---------|------------|----------------|
| Org Chart | Cool but rarely used | Move to Admin or hide |
| Bulk import/export | Enterprise feature | Hide behind flag |
| Event-goal linking | Nice-to-have | Phase 2 |
| Quarters/Programs | Overkill for small churches | Hide, keep Events only |
| Dev Plans tab | Duplicates Goals functionality | Remove (goals with pdp_id already work) |

### 3. Navigation Depth (Low Impact)

| Area | Current | Recommendation |
|------|---------|----------------|
| Calendar sub-nav | 3 items (Events, Quarters, Programs) | 1 item (Events only) |
| Profile pages | Deep linking works | OK |
| Ministry detail | URL routing works | OK |

---

## Proposed Simplification Tiers

### Tier 1: Core (Always Visible)

Essential features every user needs:

```
Navigation:
- Dashboard
- People (Directory + My Team)
- Goals (My Goals + Church Goals)
- Meetings
- Calendar (Events only)

Features:
- Basic CRUD for all entities
- Single-language mode (default)
- Simple goal tracking (no cascade)
- 1:1 meetings with agenda
- Feedback (informal)
```

### Tier 2: Advanced (Feature Flag: `FEATURES.advancedMode`)

Power-user features, hidden by default:

```
- Cascade View for goals
- Org Chart visualization
- Ministry-level goals (separate from Team)
- Department-level goals
- Event-goal linking
- Quarters and Programs
- Bulk import/export
- Bilingual side-by-side editing
```

### Tier 3: Phase 2 (Already Hidden)

Future features, already behind flags:

```
- Learning Management (courses, pathways)
- Mentorship program
- Surveys
- Advanced Analytics
- Event RSVP/Attendance
- Recurring events
```

---

## Recommended Changes

### Navigation Simplification

**Before (9 visible items):**
```
Main:       Dashboard, People, Ministries, Goals, Meetings
Calendar:   Events, Quarters, Programs
Dev:        Feedback
System:     Admin
```

**After (6 visible items):**
```
Main:       Dashboard, People, Ministries, Goals, Meetings, Calendar
Admin:      Admin (role-restricted)
```

- Merge Calendar section into single "Calendar" nav item
- Hide Quarters/Programs behind advanced mode
- Keep Feedback accessible from Goals or Meetings context

### Goals Page Simplification

**Before (6 tabs):**
```
My Goals | Department | Ministry | Church | Cascade | Dev Plans
```

**After (3 tabs, simple mode):**
```
My Goals | Team Goals | Church Goals
```

- "Team Goals" combines Ministry + Department
- Remove Cascade tab (advanced mode only)
- Remove Dev Plans tab (use goals with pdp_id)

### People Page Simplification

**Before (5 tabs):**
```
Directory | Org Chart | My Team | Peers | Supervisor
```

**After (2-3 tabs, simple mode):**
```
Directory | My Team | [Org Chart - advanced only]
```

- Remove Peers tab (visible in Directory)
- Remove Supervisor tab (visible in My Team header)
- Org Chart becomes advanced feature

### Form Simplification

**Single-language mode (default):**
- Show only primary language fields (based on user preference)
- "Show other language" toggle reveals EN/FR side-by-side
- Reduces visible form fields by ~50%

**Goal form simplified:**
- Remove event linking (advanced)
- Remove parent goal linking for individual goals (auto-suggest instead)
- Pre-fill owner based on context

---

## Implementation Priority

### Phase A: Quick Wins (1-2 days)

1. Add `FEATURES.simpleMode = true` flag (default ON)
2. Conditionally hide:
   - Cascade tab on Goals
   - Dev Plans tab on Goals
   - Org Chart tab on People
   - Quarters nav item
   - Programs nav item

### Phase B: Tab Consolidation (2-3 days)

1. Merge Department + Ministry → "Team Goals"
2. Merge Peers + Supervisor info into Directory/My Team
3. Create "advanced mode" toggle in user settings

### Phase C: Form Simplification (3-4 days)

1. Implement single-language mode
2. Simplify GoalFormDialog (hide event linking)
3. Simplify PersonFormDialog (progressive disclosure)

### Phase D: Navigation Polish (1 day)

1. Reduce nav to 6 items
2. Add "More" menu for advanced features
3. Clean up redirects

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Main nav items | 9 | 6 |
| Goals page tabs | 6 | 3 |
| People page tabs | 5 | 2 |
| Form fields (Goal) | 14+ | 8 |
| Time to create first goal | ~3 min | <1 min |
| Features visible to new user | 15+ | 8 |

---

## Decision Required

**Option A:** Finish gap analysis for remaining features (Meetings, PDPs, Feedback, Reviews, Admin), THEN simplify everything at once.

**Option B:** Implement simplification now (Phase A quick wins), then continue gap analysis with simpler baseline.

**Recommendation:** Option A - complete the picture first, then make informed simplification decisions.

---

## Feature Flag Structure (Proposed)

```typescript
export const FEATURES = {
  // Simple mode (default ON for new orgs)
  simpleMode: true,

  // Core features (always on)
  people: true,
  goals: true,
  meetings: true,
  calendar: true,
  feedback: true,

  // Advanced features (hidden when simpleMode=true)
  advanced: {
    cascadeView: false,      // Goal cascade visualization
    orgChart: false,         // Org chart in People
    departmentGoals: false,  // Separate department level
    eventGoalLinking: false, // Link events to goals
    quarters: false,         // Calendar quarters
    programs: false,         // Calendar programs
    bulkOperations: false,   // Bulk import/export
    bilingualEditing: false, // Side-by-side EN/FR
  },

  // Phase 2 (unchanged)
  courses: false,
  mentorship: false,
  surveys: false,
  analytics: false,
};
```

---

## Notes

- Target audience: Church staff, not enterprise HR
- Most users are NOT tech-savvy
- First impression matters for adoption
- "Less is more" - feature discovery over feature overload
- Consider onboarding wizard for first-time setup
