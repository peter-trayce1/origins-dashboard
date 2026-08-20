import Stripe from "stripe";
import type { Currency, CurrencyPlan, CurrencyInterval } from "@/lib/currency";

// TODO: Set STRIPE_SECRET_KEY in your environment variables
// Get it from: https://dashboard.stripe.com/apikeys
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set. Add it to your .env.local file.");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export const PRICE_IDS = {
  essentials: {
    monthly: process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY,
    annual:  process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL,
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    annual:  process.env.STRIPE_PRICE_GROWTH_ANNUAL,
  },
  // Expansion packs (recurring monthly add-ons)
  pack100: {
    monthly: process.env.STRIPE_PRICE_PACK_100_MONTHLY,
  },
  pack250: {
    monthly: process.env.STRIPE_PRICE_PACK_250_MONTHLY,
  },
} as const;

// Currency-specific Stripe Price IDs. Selection is [plan][interval][currency].
// GBP falls back to the legacy single-currency var so existing GBP checkout
// keeps working even if the *_GBP var has not been set yet.
export const PRICE_IDS_BY_CURRENCY: Record<
  CurrencyPlan,
  Record<CurrencyInterval, Record<Currency, string | undefined>>
> = {
  essentials: {
    monthly: {
      GBP: process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY_GBP ?? process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY,
      EUR: process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY_EUR,
    },
    annual: {
      GBP: process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL_GBP ?? process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL,
      EUR: process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL_EUR,
    },
  },
  growth: {
    monthly: {
      GBP: process.env.STRIPE_PRICE_GROWTH_MONTHLY_GBP ?? process.env.STRIPE_PRICE_GROWTH_MONTHLY,
      EUR: process.env.STRIPE_PRICE_GROWTH_MONTHLY_EUR,
    },
    annual: {
      GBP: process.env.STRIPE_PRICE_GROWTH_ANNUAL_GBP ?? process.env.STRIPE_PRICE_GROWTH_ANNUAL,
      EUR: process.env.STRIPE_PRICE_GROWTH_ANNUAL_EUR,
    },
  },
};

// Resolve the Stripe Price ID for a plan + interval + currency.
export function stripePriceId(
  plan: CurrencyPlan,
  interval: CurrencyInterval,
  currency: Currency
): string | undefined {
  return PRICE_IDS_BY_CURRENCY[plan]?.[interval]?.[currency];
}
