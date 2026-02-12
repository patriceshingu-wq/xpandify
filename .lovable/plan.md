

# Ministry and Department Hierarchy UI

## Overview

The database already supports hierarchy via `parent_ministry_id`, but currently all ministries are displayed as a flat grid and the form doesn't allow setting a parent. This plan surfaces the tree structure in both the list view and the detail view, and adds a "Parent Ministry" selector to the form.

## What Changes

### 1. Ministries List View -- Tree Layout (src/pages/Ministries.tsx)

Replace the flat card grid with a hierarchical accordion-based tree:

- **Top-level ministries** (those with no `parent_ministry_id`) display as expandable cards
- **Child ministries/departments** are nested inside, indented, and shown when the parent is expanded
- Each level shows the ministry name, leader, and a count of children (e.g., "3 departments")
- Clicking a ministry still opens its detail view
- The tree is built client-side by grouping the existing `ministries` array by `parent_ministry_id`

```text
+--------------------------------------+
| [Church icon] NextGen Ministry       |
|   Led by Jane Doe  |  3 departments  |
|   [v expand]                         |
|   +----------------------------------+
|   | Kingdom Kids Ministry            |
|   | Students Ministry                |
|   | Young Adults Ministry            |
|   +----------------------------------+
+--------------------------------------+
| [Church icon] Worship                |
|   Led by John Smith  | 1 department  |
+--------------------------------------+
```

Uses the existing `Collapsible` component (Radix) for expand/collapse, with a chevron toggle.

### 2. Ministry Detail View -- Show Children (src/pages/Ministries.tsx)

When viewing a ministry's detail page, add a "Sub-Ministries / Departments" section below the members list:

- Lists child ministries as clickable cards
- Each card shows name, leader, and a "View" action
- Clicking navigates into that child ministry's detail view
- Admins see an "Add Department" button that opens the form with `parent_ministry_id` pre-filled

### 3. Ministry Form -- Parent Selector (src/components/ministries/MinistryFormDialog.tsx)

Add a "Parent Ministry" dropdown to the form:

- Shows all existing ministries as options (excluding the ministry being edited and its descendants, to prevent circular references)
- Optional field -- leaving it empty creates a top-level ministry
- Add `parent_ministry_id` to the form state and payload
- Pass the current ministries list as a prop (already available from the page)

### 4. Hook Update (src/hooks/useMinistries.ts)

- Add `children` as an optional field on the `Ministry` interface (computed client-side, not from DB)
- Add a helper function `buildMinistryTree(ministries)` that groups flat data into a nested structure

### 5. Breadcrumb Navigation (src/pages/Ministries.tsx)

When viewing a nested ministry, show a breadcrumb trail so users can navigate up:

```text
Ministries > NextGen Ministry > Kingdom Kids Ministry
```

Built by walking up the `parent_ministry_id` chain using the loaded ministries data.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useMinistries.ts` | Add `buildMinistryTree` helper, add `children` to interface |
| `src/pages/Ministries.tsx` | Replace flat grid with collapsible tree; add children section in detail view; add breadcrumbs |
| `src/components/ministries/MinistryFormDialog.tsx` | Add `parent_ministry_id` field with dropdown; accept `ministries` prop |

## Technical Details

- **Tree building**: A `buildMinistryTree` utility groups the flat array into nested nodes. Top-level = items where `parent_ministry_id` is null.
- **Circular reference prevention**: When editing, the parent dropdown excludes the current ministry and all its descendants (computed by walking the tree).
- **No database migration needed** -- `parent_ministry_id` column already exists.
- **Collapsible UI**: Uses the existing `@radix-ui/react-collapsible` component already installed in the project.
- **Breadcrumbs**: Uses the existing `Breadcrumb` component from `src/components/ui/breadcrumb.tsx`.

