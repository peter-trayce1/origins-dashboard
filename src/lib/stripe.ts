import Stripe from "stripe";

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
