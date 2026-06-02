-- Add durability and circularity columns collected in Step 6 & Step 8 of the builder

ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS warranty_info            text,
  ADD COLUMN IF NOT EXISTS repairability_score      numeric,
  ADD COLUMN IF NOT EXISTS spare_parts_available    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS repair_instructions      text,
  ADD COLUMN IF NOT EXISTS recyclability            text,
  ADD COLUMN IF NOT EXISTS recycling_instructions   text,
  ADD COLUMN IF NOT EXISTS end_of_life_guidance     text;
