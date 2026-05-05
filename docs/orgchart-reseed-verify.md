# Orgchart Reseed — Post-Apply Verification

After pasting both migrations (snapshot then apply) into Supabase SQL Editor, run these read-only queries to confirm the reseed worked. All should return the expected values without errors.

## 1. Snapshot exists

```sql
SELECT * FROM public._reseed_manifest WHERE id = '20260505155403';
```

Expected: one row, with original counts (ministries before reseed, etc.).

## 2. New active ministry count

```sql
SELECT count(*) FROM public.ministries WHERE deleted_at IS NULL;
```

Expected: **72** rows (was 42 before).

## 3. Soft-deleted count

```sql
SELECT count(*) FROM public.ministries WHERE deleted_at IS NOT NULL;
```

Expected: **17** rows.

## 4. Every active row has an orgchart_id

```sql
SELECT id, name_en FROM public.ministries WHERE deleted_at IS NULL AND orgchart_id IS NULL;
```

Expected: **0 rows**.

## 5. No orphaned FKs

```sql
-- Goals pointing at soft-deleted ministries
SELECT g.id, g.title_en, m.name_en
  FROM public.goals g
  JOIN public.ministries m ON m.id = g.owner_ministry_id
  WHERE m.deleted_at IS NOT NULL;

-- Meetings pointing at soft-deleted ministries
SELECT mt.id, mt.title_en, m.name_en
  FROM public.meetings mt
  JOIN public.ministries m ON m.id = mt.ministry_id
  WHERE m.deleted_at IS NOT NULL;

-- Events pointing at soft-deleted ministries
SELECT e.id, e.title_en, m.name_en
  FROM public.events e
  JOIN public.ministries m ON m.id = e.ministry_id
  WHERE m.deleted_at IS NOT NULL;
```

Expected: **0 rows** for all three.

## 6. Tree integrity

```sql
-- Top-level ministries (should be the 9 from orgchart)
SELECT name_en, orgchart_id FROM public.ministries
  WHERE deleted_at IS NULL AND parent_ministry_id IS NULL
  ORDER BY name_en;
```

Expected: 9 rows — Church-Wide Initiatives, Connections Ministry, Discipleship & Spiritual Formation, Next Gen Ministry, Operations & Administration, Outreach & Mission, Pastoral Care & Community Life, Prayer Ministry, Worship Experience.

```sql
-- Every active row's parent must also be active
SELECT m.id, m.name_en, p.name_en AS parent
  FROM public.ministries m
  LEFT JOIN public.ministries p ON p.id = m.parent_ministry_id
  WHERE m.deleted_at IS NULL
    AND m.parent_ministry_id IS NOT NULL
    AND p.deleted_at IS NOT NULL;
```

Expected: **0 rows**.

## 7. Phase 1 backfill should now show 0 unlinked ministries

Open Admin → Orgchart Sync. The "Backfill Ministries" panel should display "All ministries are linked." and the UnlinkedBanner on Ministries / PersonProfile pages should hide (assuming the people backfill is also done).

## If something looks wrong

Run `scripts/orgchart-reseed-rollback.sql` in Supabase SQL Editor to revert.
