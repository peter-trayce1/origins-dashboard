-- Demo requests captured from the Origins marketing website.
-- Submitted via the public /api/demo-request endpoint; viewed by super admins
-- in the Customer Management dashboard.

CREATE TABLE IF NOT EXISTS public.demo_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text,
  email       text NOT NULL,
  company     text,
  job_title   text,
  phone       text,
  website     text,
  message     text,
  source      text DEFAULT 'marketing_site',
  status      text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'scheduled', 'closed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Locked down: only the service role (used by both the public submit endpoint
-- and the admin read endpoint) may touch this table. No anon/authenticated access.
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON public.demo_requests(status);
