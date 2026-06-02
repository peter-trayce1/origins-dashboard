-- Organisation status for approval-based workspace model
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS organisation_status text NOT NULL DEFAULT 'pending'
    CHECK (organisation_status IN ('pending', 'approved', 'suspended'));

-- Onboarding fields gathered during application
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS expected_passport_volume text,
  ADD COLUMN IF NOT EXISTS plan_interest            text,
  ADD COLUMN IF NOT EXISTS job_title               text,
  ADD COLUMN IF NOT EXISTS country                 text,
  ADD COLUMN IF NOT EXISTS website                 text;

-- Trial period tracking (set on approval)
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date   timestamptz;

-- Extend billing_plan to include 'trial'
-- Drop the auto-generated inline check and replace with updated values
DO $$
BEGIN
  ALTER TABLE public.organisations
    DROP CONSTRAINT IF EXISTS organisations_billing_plan_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.organisations
  ADD CONSTRAINT organisations_billing_plan_check
    CHECK (billing_plan IN ('none', 'trial', 'essentials', 'growth', 'enterprise'));

-- Index for status lookups (admin dashboard, login gate)
CREATE INDEX IF NOT EXISTS organisations_status_idx
  ON public.organisations (organisation_status);
