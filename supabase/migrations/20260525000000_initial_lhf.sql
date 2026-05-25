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
TO authenticated
USING (actor_id = auth.uid()::text);

CREATE POLICY "lhf_audit_events_insert_own"
ON public.lhf_audit_events
FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid()::text);

CREATE TABLE IF NOT EXISTS public.lhf_demo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lhf_demo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lhf_demo_items_read_own"
ON public.lhf_demo_items
FOR SELECT
TO authenticated
USING (actor_id = auth.uid()::text);

CREATE POLICY "lhf_demo_items_write_own"
ON public.lhf_demo_items
FOR ALL
TO authenticated
USING (actor_id = auth.uid()::text)
WITH CHECK (actor_id = auth.uid()::text);
