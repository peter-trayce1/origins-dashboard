-- Certification description and custom logo for brand-facing explainer text
ALTER TABLE public.product_certifications
  ADD COLUMN IF NOT EXISTS description      text,
  ADD COLUMN IF NOT EXISTS custom_logo_url  text;

-- Supplier/factory certifications stored as a text array on each facility row
ALTER TABLE public.product_facilities
  ADD COLUMN IF NOT EXISTS facility_certifications text[] DEFAULT '{}';
