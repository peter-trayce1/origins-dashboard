import { createClient } from "@/lib/supabase/server";
import type { BillingInfo, BillingPlan, BillingStatus, BillingInterval } from "@/types/billing";
import { PASSPORT_LIMITS } from "@/types/billing";

// Only published passports count toward billing.
// Drafts and archived passports are always free to create.
export async function getActivePassportCount(brandId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("passports")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId)
    .eq("status", "published");
  return count ?? 0;
}

export async function getOrganisationBilling(organisationId: string) {
  const supabase = await createClient();
  const { data } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          single: () => Promise<{ data: Record<string, unknown> | null }>;
        };
      };
    };
  }).from("organisations")
    .select("billing_plan, billing_interval, billing_status, current_period_end, passport_limit, stripe_customer_id, stripe_subscription_id, trial_end_date")
    .eq("id", organisationId)
    .single();

  const row = data as Record<string, unknown> | null;
  const trialEndDate = (row?.trial_end_date as string | null) ?? null;
  const trialDaysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((new Date(trialEndDate).getTime() - Date.now()) / 86_400_000))
    : null;

  return {
    billingPlan:          (row?.billing_plan          as BillingPlan)         ?? "none",
    billingInterval:      (row?.billing_interval      as BillingInterval)     ?? null,
    billingStatus:        (row?.billing_status        as BillingStatus)       ?? "none",
    currentPeriodEnd:     (row?.current_period_end    as string | null)       ?? null,
    passportLimit:        (row?.passport_limit        as number | null)       ?? 0,
    stripeCustomerId:     (row?.stripe_customer_id    as string | null)       ?? null,
    stripeSubscriptionId: (row?.stripe_subscription_id as string | null)      ?? null,
    trialEndDate,
    trialDaysRemaining,
  };
}

export async function getBillingInfo(
  organisationId: string,
  brandId: string
): Promise<BillingInfo> {
  const [billing, activePassportCount] = await Promise.all([
    getOrganisationBilling(organisationId),
    getActivePassportCount(brandId),
  ]);
  return { organisationId, ...billing, activePassportCount };
}

export async function canPublishPassport(
  organisationId: string,
  brandId: string
): Promise<{ allowed: boolean; plan: BillingPlan; limit: number | null; current: number }> {
  const billing = await getOrganisationBilling(organisationId);
  const current = await getActivePassportCount(brandId);
  const limit = billing.passportLimit ?? PASSPORT_LIMITS[billing.billingPlan];

  if (limit === null) {
    return { allowed: true, plan: billing.billingPlan, limit: null, current };
  }
  return { allowed: current < limit, plan: billing.billingPlan, limit, current };
}

export function planFromPriceId(priceId: string): { plan: BillingPlan; interval: BillingInterval } {
  // Current (new) currency-specific prices — GBP and EUR map to the same plan.
  if (priceId === process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY_GBP || priceId === process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY_EUR) return { plan: "essentials", interval: "monthly" };
  if (priceId === process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL_GBP  || priceId === process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL_EUR)  return { plan: "essentials", interval: "annual" };
  if (priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY_GBP     || priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY_EUR)     return { plan: "growth",     interval: "monthly" };
  if (priceId === process.env.STRIPE_PRICE_GROWTH_ANNUAL_GBP      || priceId === process.env.STRIPE_PRICE_GROWTH_ANNUAL_EUR)      return { plan: "growth",     interval: "annual" };

  // Current (new) single-currency prices
  if (priceId === process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY) return { plan: "essentials", interval: "monthly" };
  if (priceId === process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL)  return { plan: "essentials", interval: "annual" };
  if (priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY)     return { plan: "growth",     interval: "monthly" };
  if (priceId === process.env.STRIPE_PRICE_GROWTH_ANNUAL)      return { plan: "growth",     interval: "annual" };

  // Legacy prices (existing subscriptions must continue to map correctly)
  if (priceId === process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY_LEGACY) return { plan: "essentials", interval: "monthly" };
  if (priceId === process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL_LEGACY)  return { plan: "essentials", interval: "annual" };
  if (priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY_LEGACY)     return { plan: "growth",     interval: "monthly" };
  if (priceId === process.env.STRIPE_PRICE_GROWTH_ANNUAL_LEGACY)      return { plan: "growth",     interval: "annual" };

  return { plan: "none", interval: "monthly" };
}

export function passportLimitForPlan(plan: BillingPlan): number | null {
  return PASSPORT_LIMITS[plan];
}
