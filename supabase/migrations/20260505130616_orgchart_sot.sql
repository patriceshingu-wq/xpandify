-- Orgchart Source-of-Truth: Phase 1 + Phase 2 schema
-- Adds stable orgchart_id join keys, soft-delete markers, ministry status,
-- and the sync run / review queue infrastructure.

-- ──────────────────────────────────────────────────────────────────────────
-- Ministries
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.ministries
  ADD COLUMN orgchart_id text,
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','vacant','inactive')),
  ADD COLUMN deleted_at timestamptz;

CREATE UNIQUE INDEX ministries_orgchart_id_key
  ON public.ministries (orgchart_id)
  WHERE orgchart_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- People
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.people
  ADD COLUMN orgchart_id text,
  ADD COLUMN deleted_at timestamptz;

CREATE UNIQUE INDEX people_orgchart_id_key
  ON public.people (orgchart_id)
  WHERE orgchart_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- People <-> Ministries link annotation (no uniqueness)
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.people_ministries
  ADD COLUMN orgchart_node_id text;

-- ──────────────────────────────────────────────────────────────────────────
-- Sync runs
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.orgchart_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  triggered_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('running','succeeded','failed')),
  summary jsonb,
  error_message text
);

ALTER TABLE public.orgchart_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sync runs"
  ON public.orgchart_sync_runs FOR SELECT
  USING (public.is_admin_or_super(auth.uid()));

-- INSERT/UPDATE only via service role (no policy means RLS blocks anon/authenticated).

-- ──────────────────────────────────────────────────────────────────────────
-- Review queue
-- ──────────────────────────────────────────────────────────────────────────
CREATE TABLE public.orgchart_sync_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL REFERENCES public.orgchart_sync_runs(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN (
    'ministry_deleted','person_deleted','ministry_reparented','membership_dropped'
  )),
  entity_type text NOT NULL CHECK (entity_type IN (
    'ministry','person','people_ministries'
  )),
  entity_id uuid NOT NULL,
  orgchart_id text,
  before jsonb NOT NULL,
  after jsonb,
  state text NOT NULL DEFAULT 'pending'
    CHECK (state IN ('pending','applied','dismissed','snoozed')),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  detected_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orgchart_sync_review_queue_pending_idx
  ON public.orgchart_sync_review_queue (state, detected_at DESC);

ALTER TABLE public.orgchart_sync_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read review queue"
  ON public.orgchart_sync_review_queue FOR SELECT
  USING (public.is_admin_or_super(auth.uid()));

CREATE POLICY "Admins can resolve review queue items"
  ON public.orgchart_sync_review_queue FOR UPDATE
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));
