-- Convert facility_certifications from text[] to jsonb so each entry
-- can carry both a name and a URL/document link.
-- Safe to run even if 0019 already ran — no production data in this column yet.
ALTER TABLE public.product_facilities
  DROP COLUMN IF EXISTS facility_certifications;
ALTER TABLE public.product_facilities
  ADD COLUMN facility_certifications jsonb DEFAULT '[]'::jsonb;
