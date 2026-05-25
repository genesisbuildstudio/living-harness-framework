CREATE TABLE IF NOT EXISTS public.lhf_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL,
  event_type text NOT NULL,
  target_ref text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lhf_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lhf_audit_events_read_own"
ON public.lhf_audit_events
FOR SELECT
USING (actor_id = auth.uid()::text);

CREATE POLICY "lhf_audit_events_insert_own"
ON public.lhf_audit_events
FOR INSERT
WITH CHECK (actor_id = auth.uid()::text);

