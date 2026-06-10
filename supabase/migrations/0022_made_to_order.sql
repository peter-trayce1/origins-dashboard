ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS made_to_order boolean DEFAULT false;
