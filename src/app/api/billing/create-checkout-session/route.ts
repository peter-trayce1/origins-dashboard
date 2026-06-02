import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import type { BillingPlan, BillingInterval } from "@/types/billing";

// TODO: Set these environment variables in .env.local:
//   STRIPE_SECRET_KEY=sk_live_...
//   STRIPE_PRICE_ESSENTIALS_MONTHLY=price_...
//   STRIPE_PRICE_ESSENTIALS_ANNUAL=price_...
//   STRIPE_PRICE_GROWTH_MONTHLY=price_...
//   STRIPE_PRICE_GROWTH_ANNUAL=price_...
//   NEXT_PUBLIC_APP_URL=https://your-domain.com

const PRICE_MAP: Record<BillingPlan, Record<BillingInterval, string | undefined>> = {
  none:       { monthly: undefined,                                        annual: undefined },
  essentials: { monthly: process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY,     annual: process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL },
  growth:     { monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,         annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL },
  enterprise: { monthly: undefined,                                        annual: undefined },
};

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, interval }: { plan: BillingPlan; interval: BillingInterval } = await request.json();

  const priceId = PRICE_MAP[plan]?.[interval];
  if (!priceId) {
    return NextResponse.json(
      { error: `No price configured for ${plan}/${interval}. Set the STRIPE_PRICE_* env vars.` },
      { status: 400 }
    );
  }

  // Get organisation
  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  if (!member) return NextResponse.json({ error: "No organisation" }, { status: 403 });

  // Get or create Stripe customer ID
  const { data: org } = await (supabase as unknown as {
    from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { single: () => Promise<{ data: Record<string, unknown> | null }> } } };
  }).from("organisations")
    .select("stripe_customer_id, name")
    .eq("id", member.organisation_id)
    .single();

  let customerId = (org?.stripe_customer_id as string | null) ?? null;

  const stripe = getStripe();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: (org?.name as string) ?? undefined,
      metadata: { organisation_id: member.organisation_id },
    });
    customerId = customer.id;

    // Persist customer ID immediately
    await (supabase as unknown as {
      from: (t: string) => { update: (d: object) => { eq: (k: string, v: string) => Promise<unknown> } };
    }).from("organisations")
      .update({ stripe_customer_id: customerId })
      .eq("id", member.organisation_id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true&plan=${plan}`,
    cancel_url: `${appUrl}/billing?cancelled=true`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { organisation_id: member.organisation_id, plan, interval },
    },
  });

  return NextResponse.json({ url: session.url });
}
