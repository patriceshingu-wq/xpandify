
-- 1. Create event_recurrence_rules table
CREATE TABLE public.event_recurrence_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval_value int NOT NULL DEFAULT 1,
  days_of_week int[] DEFAULT NULL,
  day_of_month int DEFAULT NULL,
  nth_weekday int DEFAULT NULL,
  weekday_of_month int DEFAULT NULL,
  end_type text NOT NULL DEFAULT 'never' CHECK (end_type IN ('never', 'after_count', 'until_date')),
  end_count int DEFAULT NULL,
  end_date date DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.event_recurrence_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recurrence rules"
  ON public.event_recurrence_rules FOR ALL
  USING (is_admin_or_super(auth.uid()))
  WITH CHECK (is_admin_or_super(auth.uid()));

CREATE POLICY "Authenticated users can view recurrence rules"
  ON public.event_recurrence_rules FOR SELECT
  USING (true);

-- 2. Add recurrence columns to events table
ALTER TABLE public.events
  ADD COLUMN recurring_series_id uuid DEFAULT NULL,
  ADD COLUMN recurrence_rule_id uuid DEFAULT NULL REFERENCES public.event_recurrence_rules(id) ON DELETE SET NULL,
  ADD COLUMN is_recurrence_exception boolean DEFAULT false,
  ADD COLUMN original_date date DEFAULT NULL;

CREATE INDEX idx_events_recurring_series ON public.events(recurring_series_id) WHERE recurring_series_id IS NOT NULL;
CREATE INDEX idx_events_recurrence_rule ON public.events(recurrence_rule_id) WHERE recurrence_rule_id IS NOT NULL;

-- 3. Create event_recurrence_exceptions table
CREATE TABLE public.event_recurrence_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_series_id uuid NOT NULL,
  exception_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.event_recurrence_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recurrence exceptions"
  ON public.event_recurrence_exceptions FOR ALL
  USING (is_admin_or_super(auth.uid()))
  WITH CHECK (is_admin_or_super(auth.uid()));

CREATE POLICY "Authenticated users can view recurrence exceptions"
  ON public.event_recurrence_exceptions FOR SELECT
  USING (true);

CREATE UNIQUE INDEX idx_unique_exception_date ON public.event_recurrence_exceptions(recurring_series_id, exception_date);
