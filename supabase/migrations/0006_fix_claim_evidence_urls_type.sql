-- Fix claim_evidence_urls column type: was created as jsonb[] (array) but should be jsonb (object map)
ALTER TABLE public.passports DROP COLUMN IF EXISTS claim_evidence_urls;
ALTER TABLE public.passports ADD COLUMN claim_evidence_urls jsonb DEFAULT '{}';
