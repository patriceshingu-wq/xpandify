-- Orgchart Reseed: SNAPSHOT (file 01 of 2)
CREATE TABLE IF NOT EXISTS public._reseed_manifest (
  id text PRIMARY KEY,
  taken_at timestamptz NOT NULL DEFAULT now(),
  ministries_count int NOT NULL,
  people_ministries_count int NOT NULL,
  goals_with_ministry_count int NOT NULL,
  meetings_with_ministry_count int NOT NULL,
  events_with_ministry_count int NOT NULL
);

DROP TABLE IF EXISTS public._reseed_snapshot_ministries;
DROP TABLE IF EXISTS public._reseed_snapshot_people_ministries;
DROP TABLE IF EXISTS public._reseed_snapshot_goals_owner;
DROP TABLE IF EXISTS public._reseed_snapshot_meetings_ministry;
DROP TABLE IF EXISTS public._reseed_snapshot_events_ministry;

CREATE TABLE public._reseed_snapshot_ministries AS
  SELECT * FROM public.ministries;

CREATE TABLE public._reseed_snapshot_people_ministries AS
  SELECT * FROM public.people_ministries;

CREATE TABLE public._reseed_snapshot_goals_owner AS
  SELECT id, owner_ministry_id FROM public.goals WHERE owner_ministry_id IS NOT NULL;

CREATE TABLE public._reseed_snapshot_meetings_ministry AS
  SELECT id, ministry_id FROM public.meetings WHERE ministry_id IS NOT NULL;

CREATE TABLE public._reseed_snapshot_events_ministry AS
  SELECT id, ministry_id FROM public.events WHERE ministry_id IS NOT NULL;

INSERT INTO public._reseed_manifest (
  id, ministries_count, people_ministries_count,
  goals_with_ministry_count, meetings_with_ministry_count, events_with_ministry_count
)
VALUES (
  '20260505155403',
  (SELECT count(*) FROM public._reseed_snapshot_ministries),
  (SELECT count(*) FROM public._reseed_snapshot_people_ministries),
  (SELECT count(*) FROM public._reseed_snapshot_goals_owner),
  (SELECT count(*) FROM public._reseed_snapshot_meetings_ministry),
  (SELECT count(*) FROM public._reseed_snapshot_events_ministry)
)
ON CONFLICT (id) DO UPDATE SET
  taken_at = now(),
  ministries_count = EXCLUDED.ministries_count,
  people_ministries_count = EXCLUDED.people_ministries_count,
  goals_with_ministry_count = EXCLUDED.goals_with_ministry_count,
  meetings_with_ministry_count = EXCLUDED.meetings_with_ministry_count,
  events_with_ministry_count = EXCLUDED.events_with_ministry_count;