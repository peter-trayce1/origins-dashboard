-- Add rich metadata columns for the three core lifecycle metrics (carbon, water, energy)
-- Stored as JSONB to keep the schema flexible without adding ~30 scalar columns.
-- Each column stores: benchmark_value, avoided_value, savings_percentage, scope,
-- source_name, source_method, evidence_url, verification_status, explanation, display_public

ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS carbon_meta jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS water_meta  jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_meta jsonb NOT NULL DEFAULT '{}',
  -- Unit override for energy (default kWh; some brands report in MJ)
  ADD COLUMN IF NOT EXISTS energy_unit text NOT NULL DEFAULT 'kWh';
