-- Per-passport brand identity override, used by demo accounts to build
-- passports for any brand. Only demo accounts may write these (enforced in the
-- passport PATCH route); when set, the public passport and preview show these
-- instead of the account's own brand name / logo.
ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS brand_name_override text,
  ADD COLUMN IF NOT EXISTS brand_logo_override text;
