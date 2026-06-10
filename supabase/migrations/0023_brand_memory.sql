-- Per-brand "previously used" memory for the passport builder.
-- Replaces browser localStorage (which leaked between accounts on a shared
-- browser). Data is keyed by brand so it is strictly isolated per account and
-- also follows the brand across devices.

CREATE TABLE IF NOT EXISTS public.brand_memory (
  brand_id   UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL,  -- 'suppliers' | 'care_instructions'
  data       JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (brand_id, kind)
);

ALTER TABLE public.brand_memory ENABLE ROW LEVEL SECURITY;

-- Brand members can fully manage their own brand's memory
CREATE POLICY "brand_members_manage_memory"
  ON public.brand_memory
  FOR ALL
  USING (
    brand_id IN (
      SELECT b.id FROM public.brands b
      JOIN public.organisation_members om ON om.organisation_id = b.organisation_id
      WHERE om.user_id = auth.uid() AND om.accepted_at IS NOT NULL
    )
  )
  WITH CHECK (
    brand_id IN (
      SELECT b.id FROM public.brands b
      JOIN public.organisation_members om ON om.organisation_id = b.organisation_id
      WHERE om.user_id = auth.uid() AND om.accepted_at IS NOT NULL
    )
  );
