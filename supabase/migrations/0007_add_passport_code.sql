-- Add unique passport code (ORI-XXXXXXXX) generated at creation time

ALTER TABLE public.passports
  ADD COLUMN IF NOT EXISTS passport_code text;
