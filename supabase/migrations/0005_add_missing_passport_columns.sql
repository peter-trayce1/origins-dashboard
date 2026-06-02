-- Add columns present in application code but missing from initial schema

ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS country_of_origin       text,
  ADD COLUMN IF NOT EXISTS product_weight_g        numeric,
  ADD COLUMN IF NOT EXISTS product_lifetime_years  numeric,
  ADD COLUMN IF NOT EXISTS energy_use_kwh          numeric,
  ADD COLUMN IF NOT EXISTS claim_evidence_urls     jsonb DEFAULT '{}';

ALTER TABLE public.passport_material_extras
  ADD COLUMN IF NOT EXISTS pfas_free boolean;
