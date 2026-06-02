-- Extend impact_metrics with richer lifecycle data fields
-- Supports flexible, brand-configurable impact metrics for DPP

ALTER TABLE public.impact_metrics
  ADD COLUMN IF NOT EXISTS metric_type        text DEFAULT 'other'
    CHECK (metric_type IN ('carbon','water','energy','transport','waste','circularity','packaging','biodiversity','repairability','other')),
  ADD COLUMN IF NOT EXISTS benchmark_value    numeric,
  ADD COLUMN IF NOT EXISTS avoided_value      numeric,
  ADD COLUMN IF NOT EXISTS savings_percentage numeric,
  ADD COLUMN IF NOT EXISTS explanation        text,
  -- Evidence: URL already exists; file path schema-ready for future upload UI
  ADD COLUMN IF NOT EXISTS evidence_file_path text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'claimed'
    CHECK (verification_status IN ('claimed','evidence_attached','verified','third_party_verified')),
  ADD COLUMN IF NOT EXISTS display_public     boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order         integer NOT NULL DEFAULT 0,
  -- Provenance: where the data came from and how it was obtained
  ADD COLUMN IF NOT EXISTS source_name        text,
  ADD COLUMN IF NOT EXISTS source_method      text,
  -- Scope: context for the metric value (per garment, cradle-to-gate, etc.)
  ADD COLUMN IF NOT EXISTS metric_scope       text,
  -- Semantic interoperability (UNTP, AAS, GS1 etc.) — populated programmatically, not shown in UI
  ADD COLUMN IF NOT EXISTS semantic_id        text,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz DEFAULT now();
