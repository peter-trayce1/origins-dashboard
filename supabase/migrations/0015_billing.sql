-- Add billing fields to organisations table
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS stripe_customer_id      text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  text,
  ADD COLUMN IF NOT EXISTS billing_plan            text NOT NULL DEFAULT 'none'
    CHECK (billing_plan IN ('none', 'essentials', 'growth', 'enterprise')),
  ADD COLUMN IF NOT EXISTS billing_interval        text
    CHECK (billing_interval IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS billing_status          text NOT NULL DEFAULT 'none'
    CHECK (billing_status IN ('none', 'trialing', 'active', 'past_due', 'cancelled', 'unpaid', 'incomplete')),
  ADD COLUMN IF NOT EXISTS current_period_end      timestamptz,
  ADD COLUMN IF NOT EXISTS passport_limit          integer NOT NULL DEFAULT 0;

-- Unique index on stripe_customer_id for webhook lookups
CREATE UNIQUE INDEX IF NOT EXISTS organisations_stripe_customer_id_idx
  ON public.organisations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
