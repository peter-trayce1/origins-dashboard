export type BillingPlan = "none" | "trial" | "essentials" | "growth" | "enterprise";
export type BillingInterval = "monthly" | "annual";
export type BillingStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "unpaid"
  | "incomplete";

export interface BillingInfo {
  organisationId: string;
  billingPlan: BillingPlan;
  billingInterval: BillingInterval | null;
  billingStatus: BillingStatus;
  currentPeriodEnd: string | null;
  passportLimit: number | null; // null = unlimited (enterprise)
  stripeCustomerId: string | null;
  activePassportCount: number;
  trialEndDate?: string | null;
  trialDaysRemaining?: number | null;
}

export interface PlanConfig {
  id: BillingPlan;
  label: string;
  passportLimit: number | null;
  monthlyPrice: number | null;
  annualPrice: number | null;
  monthlyPriceId: string | undefined;
  annualPriceId: string | undefined;
  features: string[];
  highlighted?: boolean;
}

export const PLAN_CONFIG: Record<Exclude<BillingPlan, "none" | "trial">, PlanConfig> = {
  essentials: {
    id: "essentials",
    label: "Essentials",
    passportLimit: 100,
    monthlyPrice: 150,
    annualPrice: 1500,
    monthlyPriceId: process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL,
    features: [
      "Up to 100 Active Product Passports per year",
      "Unlimited QR scans",
      "AI Passport Builder",
      "Public Passport Pages",
      "QR Code Generation",
      "Product Storytelling",
      "Certification Management",
      "CSV Import / Export",
      "Basic Analytics",
      "Email Support",
    ],
  },
  growth: {
    id: "growth",
    label: "Growth",
    passportLimit: 500,
    monthlyPrice: 450,
    annualPrice: 4500,
    monthlyPriceId: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_GROWTH_ANNUAL,
    highlighted: true,
    features: [
      "Up to 500 Active Product Passports per year",
      "Everything in Essentials",
      "Supplier Data Requests",
      "Advanced Analytics",
      "Team Members",
      "Custom Branding",
      "Passport Templates",
      "Priority Support",
    ],
  },
  enterprise: {
    id: "enterprise",
    label: "Enterprise",
    passportLimit: null,
    monthlyPrice: null,
    annualPrice: null,
    monthlyPriceId: undefined,
    annualPriceId: undefined,
    features: [
      "Custom / unlimited Active Product Passports per year",
      "ERP / PLM Integrations",
      "API Access",
      "Supplier Portal",
      "White Label Options",
      "Dedicated Success Manager",
      "Custom Compliance Workflows",
    ],
  },
};

// Fallback limits for when passport_limit is not set on the organisation.
// Note: The webhook sets passport_limit based on the actual price ID,
// so these are only used as fallbacks. New subscriptions will have 100/500,
// while legacy subscriptions will keep 250/750.
export const PASSPORT_LIMITS: Record<BillingPlan, number | null> = {
  none: 0,
  trial: 3,
  essentials: 100,
  growth: 500,
  enterprise: null,
};
