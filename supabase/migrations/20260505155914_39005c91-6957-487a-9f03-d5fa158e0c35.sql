ALTER TABLE public._reseed_manifest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._reseed_snapshot_ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._reseed_snapshot_people_ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._reseed_snapshot_goals_owner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._reseed_snapshot_meetings_ministry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._reseed_snapshot_events_ministry ENABLE ROW LEVEL SECURITY;
-- No policies = deny all to clients; service role bypasses RLS.