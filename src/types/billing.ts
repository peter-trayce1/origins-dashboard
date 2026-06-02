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

export const PLAN_CONFIG: Record<Exclude<BillingPlan, "none">, PlanConfig> = {
  essentials: {
    id: "essentials",
    label: "Essentials",
    passportLimit: 250,
    monthlyPrice: 375,
    annualPrice: 3750,
    monthlyPriceId: process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL,
    features: [
      "Up to 250 Active Product Passports per year",
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
    passportLimit: 750,
    monthlyPrice: 795,
    annualPrice: 7950,
    monthlyPriceId: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    annualPriceId: process.env.STRIPE_PRICE_GROWTH_ANNUAL,
    highlighted: true,
    features: [
      "Up to 750 Active Product Passports per year",
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
      "Unlimited Active Product Passports per year",
      "ERP / PLM Integrations",
      "API Access",
      "Supplier Portal",
      "White Label Options",
      "Dedicated Success Manager",
      "Custom Compliance Workflows",
    ],
  },
};

export const PASSPORT_LIMITS: Record<BillingPlan, number | null> = {
  none: 0,
  trial: 3,
  essentials: 250,
  growth: 750,
  enterprise: null,
};
