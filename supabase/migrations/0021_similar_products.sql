-- Upsell / similar products strip on the public passport Product tab.
-- Stored as JSONB: [{name, image_url, url, rrp}] — up to 4 items.
ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS similar_products jsonb DEFAULT '[]'::jsonb;
