ALTER TABLE public.product_facilities
  ADD COLUMN IF NOT EXISTS website_url text;
