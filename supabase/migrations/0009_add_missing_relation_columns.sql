-- Add columns present in wizard forms but missing from related tables

ALTER TABLE public.product_materials
  ADD COLUMN IF NOT EXISTS supplier_name text;

ALTER TABLE public.product_facilities
  ADD COLUMN IF NOT EXISTS facility_address       text,
  ADD COLUMN IF NOT EXISTS ownership_relationship text;
