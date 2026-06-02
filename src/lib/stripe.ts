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
  // Optional expansion packs
  // TODO: Set these in .env.local when Stripe prices are created
  pack250: {
    monthly: process.env.STRIPE_PRICE_PACK_250_MONTHLY,
  },
  pack500: {
    monthly: process.env.STRIPE_PRICE_PACK_500_MONTHLY,
  },
} as const;
