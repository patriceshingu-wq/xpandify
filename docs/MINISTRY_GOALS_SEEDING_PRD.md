# PRD: Ministry Goals Seeding

## Problem Statement

When a team lead signs up for Xpandify and is assigned to a ministry, they see an empty Goals page. There's no context about what their ministry is working toward for the year. This creates a cold-start problem — leaders must manually create all goals from scratch, which is time-consuming and leads to inconsistency across ministries.

## Desired Outcome

When a team lead (pastor_supervisor or admin) first signs in and views the Goals page, they immediately see pre-populated **ministry-level goals** for their assigned ministry, plus **church-level goals** visible to everyone. Each ministry's goals are structured by quarter (Q1–Q4), drawn from the MC Church 2026 roadmap.

---

## Data Source

All goal data originates from the MC Church Leadership Hub PRD:
- **Source file:** `/Users/kndri/projects/mc-church-ui/lib/leaders-data/ministries.ts`
- **7 top-level ministries**, each with quarterly goals
- **Sub-departments** within some ministries also have their own quarterly goals

### Ministry → Xpandify Mapping

| # | Source Ministry | Xpandify `ministries.name_en` | Sub-departments |
|---|----------------|-------------------------------|-----------------|
| 1 | Next-Gen Ministry | Next-Gen Ministry | Kids Ministry, Students Ministry, Young Adults Ministry |
| 2 | Family Care Ministry | Family Care Ministry | Ladies Ministry, Men's Ministry, Membership Services, Social Integration |
| 3 | Hospitality Services | Hospitality Services | Parking, Greeting/Entry, Welcome Center, Ushers/Seating, Pastoral & Guest Services |
| 4 | Discipleship Ministry | Discipleship Ministry | Next Steps, Small Groups, Prayer Teams, Sacraments & Weddings |
| 5 | Outreach Ministry | Outreach Ministry | Evangelism, Missions |
| 6 | Communications Team | Communications Team | Sound & Lights, Tech Team, Creative Team |
| 7 | MC Music | MC Music | (no sub-departments with separate goals) |

---

## Goal Hierarchy Design

```
Church Goal (top-level, visible to all)
  └── Ministry Goal (per ministry, visible to ministry members + supervisors)
        └── Department Goal (per sub-department, child of ministry goal)
```

### How source data maps to Xpandify `goals` table

| Source field | Xpandify `goals` column | Notes |
|---|---|---|
| Quarter goal text | `title_en` | Each bullet in `quarters[].goals[]` becomes one goal row |
| — | `title_fr` | French translations to be added later (set to EN initially) |
| Quarter focus | `description_en` | The quarter's `focus` text |
| Quarter title (e.g., "Faith as the Engine of Expansion") | — | Used as parent church goal title |
| `ministry.interpretation` | — | Could be stored as ministry description, not as a goal |
| `ministry.endOfYearOutcome` | — | Could become a full-year "outcome" goal or description |
| `keyActions[]` | — | **Not imported as goals.** These are action items, not measurable goals. Could be stored as goal descriptions or meeting agenda items later. |

### Goal levels

| Data | `goal_level` | `owner_ministry_id` | `parent_goal_id` |
|---|---|---|---|
| Quarterly theme (e.g., "Faith as the Engine of Expansion") | `church` | NULL | NULL |
| Ministry quarterly goals | `ministry` | ministry UUID | → church quarterly theme goal |
| Sub-department quarterly goals | `department` | sub-dept ministry UUID | → parent ministry goal for same quarter |

### Goal fields populated

| Column | Value |
|---|---|
| `title_en` | Goal text from source |
| `title_fr` | Same as EN initially (or NULL) |
| `description_en` | Quarter focus text |
| `goal_level` | `church`, `ministry`, or `department` |
| `category` | Mapped from ministry context (see mapping below) |
| `status` | `not_started` |
| `progress_percent` | `0` |
| `year` | `2026` |
| `start_date` | Quarter start (Q1: Jan 1, Q2: Apr 1, Q3: Jul 1, Q4: Oct 1) |
| `due_date` | Quarter end (Q1: Mar 31, Q2: Jun 30, Q3: Sep 30, Q4: Dec 31) |
| `owner_ministry_id` | Ministry UUID (for ministry/department level) |
| `owner_person_id` | NULL (these are org goals, not individual) |
| `parent_goal_id` | UUID of parent goal (church → NULL, ministry → church, department → ministry) |

### Category mapping

| Quarter theme | `goal_category` |
|---|---|
| Q1: "Faith as the Engine of Expansion" | `spiritual` |
| Q2: "Family as the Foundation of Expansion" | `discipleship` |
| Q3: "Church as a Mobilized Force" / "Mission Mobilization" | `evangelism` |
| Q4: "Possession and Consolidation" | `operational` |

---

## Implementation Approach

### Option A: Supabase Migration (SQL seed script) — **Recommended**

A SQL migration script that:
1. Creates the 7 ministries (+ sub-departments as child ministries) in `ministries` table if they don't exist
2. Creates 4 church-level goals (one per quarter theme)
3. Creates ministry-level goals under each church goal
4. Creates department-level goals under each ministry goal
5. Uses `ON CONFLICT DO NOTHING` to be idempotent

**Pros:** Runs once, deterministic, part of migration history, works for all orgs
**Cons:** Hardcoded to 2026 data, needs a new migration for 2027

### Option B: Edge Function seeding endpoint

An admin-callable Edge Function that:
1. Reads the goal data from a JSON payload or config
2. Creates goals for a specific organization
3. Can be re-run for different years

**Pros:** Reusable, admin-triggered, supports multi-year
**Cons:** More complex, requires auth + API call

### Option C: First-login seeding hook

Frontend logic that detects first login (no goals exist) and triggers seeding:
1. On Goals page mount, check if ministry goals exist for current year
2. If none found, call a seeding function
3. Creates goals for the user's ministry

**Pros:** Just-in-time, per-ministry
**Cons:** Race conditions, harder to debug, front-end complexity

### Recommendation: Option A (SQL migration) for initial seed + Option C as a light "check" for future years

For MVP, a migration seeds all 2026 goals. Later, an admin UI could allow importing goals for a new year.

---

## Estimated Goal Count

| Level | Count per quarter | × 4 quarters | Total |
|---|---|---|---|
| Church goals (quarterly themes) | 1 | 4 | **4** |
| Ministry goals (7 ministries, ~3-4 goals/quarter each) | ~25 | ~100 | **~100** |
| Department goals (sub-depts, ~2-3 goals/quarter each) | ~40 | ~160 | **~160** |
| **Total** | | | **~264 goals** |

---

## What a Team Lead Sees on First Login

### Goals Page — "My Goals" tab
- Empty (no individual goals assigned yet)

### Goals Page — "Team Goals" tab (simple mode combines ministry + department)
- All ministry-level goals for their assigned ministry, grouped by quarter
- All department-level goals for sub-departments they lead
- Progress bars all at 0%, status "Not Started"

### Goals Page — "Church Goals" tab
- 4 church-level quarterly theme goals
- Each expandable to show child ministry goals cascading down

---

## Pre-requisites

1. **Ministries must exist** in the `ministries` table with matching `name_en` values
   - The seeding script should create them if they don't exist (upsert pattern)
   - Sub-departments should be created as child ministries (`parent_ministry_id` set)

2. **People must be assigned to ministries** via `people_ministries` junction table
   - This is already handled by the existing invite/onboarding flow
   - Team leads see goals for ministries they belong to

---

## Implementation Steps

### Step 1: Create the SQL migration
- File: `supabase/migrations/YYYYMMDD_seed_ministry_goals.sql`
- Upsert 7 ministries + sub-departments into `ministries` table
- Insert 4 church-level quarterly goals
- Insert ~100 ministry-level goals linked to church goals
- Insert ~160 department-level goals linked to ministry goals
- All wrapped in a transaction with `ON CONFLICT` guards

### Step 2: Update TypeScript types (if needed)
- Regenerate types if the migration adds any schema changes
- No schema changes expected — just data inserts

### Step 3: Verify the Goals page displays seeded goals
- Login as a ministry leader
- Confirm "Team Goals" shows their ministry's goals
- Confirm "Church Goals" shows quarterly themes
- Confirm goal hierarchy (parent → child) works in cascade view

### Step 4: Add French translations (follow-up)
- Translate all `title_en` values to `title_fr`
- Can be done in a separate migration or via admin UI

---

## Out of Scope (for now)

- **Key Actions import**: The source data has `keyActions[]` per quarter. These are action items, not goals. They could become meeting agenda items or checklist items later.
- **Strategic Priorities**: Director-level priorities could become individual goals assigned to the ministry director later.
- **End-of-Year Outcomes**: Could become a "yearly outcome" goal type, but the current schema doesn't support this cleanly.
- **Yearly refresh**: 2027 goal import would need a separate mechanism (admin UI or new migration).
- **French translations**: Initial seed uses English only; French to follow.

---

## Open Questions

1. **Should `keyActions` be imported as goal descriptions?** They provide useful context but aren't goals themselves. We could concatenate them into `description_en`.
2. **Should sub-departments be separate ministries?** The current `ministries` table supports hierarchy via `parent_ministry_id`. Sub-departments would be child ministries. This seems correct.
3. **What if ministries already exist with different names?** The migration should match on `name_en` or use a slug-based lookup to avoid duplicates.
4. **Should we create a church-level "Vision 2026" umbrella goal?** All 4 quarterly church goals could be children of a single annual goal.
