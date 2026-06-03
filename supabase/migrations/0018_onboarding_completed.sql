-- Track whether a workspace has completed the onboarding wizard.
-- Defaults to false so all existing orgs (apply flow) are routed through
-- the wizard on first login.
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
