-- Add per-section story images for the Product Story and Makers sections
ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS product_story_image_url text,
  ADD COLUMN IF NOT EXISTS makers_image_url text;
