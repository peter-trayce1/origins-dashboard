-- Supply Chain Requests: allows brands to collect passport data from suppliers
CREATE TABLE IF NOT EXISTS public.supply_chain_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  passport_id UUID REFERENCES public.passports(id) ON DELETE SET NULL,
  request_code TEXT NOT NULL UNIQUE,
  request_type TEXT NOT NULL DEFAULT 'tier1_manufacturer',
  supplier_name TEXT,
  supplier_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'opened', 'in_progress', 'completed', 'expired')),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  response_data JSONB
);

ALTER TABLE public.supply_chain_requests ENABLE ROW LEVEL SECURITY;

-- Brand members can fully manage their own requests
CREATE POLICY "brand_members_manage_requests"
  ON public.supply_chain_requests
  FOR ALL
  USING (
    brand_id IN (
      SELECT b.id FROM public.brands b
      JOIN public.organisation_members om ON om.organisation_id = b.organisation_id
      WHERE om.user_id = auth.uid() AND om.accepted_at IS NOT NULL
    )
  );

-- Unauthenticated users can read non-draft requests (for the supplier form)
CREATE POLICY "anon_read_active_requests"
  ON public.supply_chain_requests
  FOR SELECT
  TO anon
  USING (status != 'draft');
