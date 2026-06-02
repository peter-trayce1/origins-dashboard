import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { BillingPageClient } from "@/components/billing/BillingPageClient";
import { getBillingInfo } from "@/lib/billing";
import { isStripeConfigured } from "@/lib/stripe";
import type { Metadata } from "next";
import type { BillingInfo } from "@/types/billing";

export const metadata: Metadata = { title: "Billing — Origins" };

// Demo fallback shown when Stripe is not yet configured
const DEMO_BILLING: BillingInfo = {
  organisationId: "demo",
  billingPlan: "essentials",
  billingInterval: "monthly",
  billingStatus: "active",
  currentPeriodEnd: "2026-07-01T00:00:00.000Z",
  passportLimit: 250,
  stripeCustomerId: null,
  activePassportCount: 187,
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const success = params.success === "true";
  const cancelled = params.cancelled === "true";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  if (!member) redirect("/onboarding");

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("organisation_id", member.organisation_id)
    .single();
  if (!brand) redirect("/onboarding");

  // Use demo data if Stripe is not yet configured (safe for local dev)
  let billing: BillingInfo;
  if (!isStripeConfigured()) {
    const activeCount = await import("@/lib/billing").then((m) =>
      m.getActivePassportCount(brand.id)
    );
    billing = { ...DEMO_BILLING, organisationId: member.organisation_id, activePassportCount: activeCount };
  } else {
    billing = await getBillingInfo(member.organisation_id, brand.id);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing"
        description="Manage your Origins subscription, payment method and Active Product Passport usage."
      />
      <BillingPageClient billing={billing} success={success} cancelled={cancelled} />
    </div>
  );
}
