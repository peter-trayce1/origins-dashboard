import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured, stripePriceId } from "@/lib/stripe";
import { parseCurrency, resolveCurrency, CURRENCY_COOKIE } from "@/lib/currency";
import type { BillingPlan, BillingInterval } from "@/types/billing";

// Stripe Price IDs (per plan/interval/currency) live in src/lib/stripe.ts.
// The currency shown on the pricing page and the currency charged here must
// always match — see currency resolution below.

// Only these plans are self-serve checkout; trial/enterprise/none have no price.
const CHECKOUT_PLANS = new Set<BillingPlan>(["essentials", "growth"]);

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

  const { plan, interval, currency: bodyCurrency }: {
    plan: BillingPlan; interval: BillingInterval; currency?: string;
  } = await request.json();

  if (!CHECKOUT_PLANS.has(plan)) {
    return NextResponse.json(
      { error: `Plan "${plan}" is not available for self-serve checkout.` },
      { status: 400 }
    );
  }

  // Currency priority: the currency the client is currently displaying (so the
  // charged price always matches what the user saw) → manual-override cookie →
  // Vercel geolocation → GBP. All fall back through the shared resolver.
  const currency = parseCurrency(bodyCurrency) ?? resolveCurrency({
    cookie: request.cookies.get(CURRENCY_COOKIE)?.value,
    country: request.headers.get("x-vercel-ip-country"),
  });

  const priceId = stripePriceId(plan as "essentials" | "growth", interval, currency);
  if (!priceId) {
    return NextResponse.json(
      { error: `No ${currency} price configured for ${plan}/${interval}. Set the STRIPE_PRICE_*_${currency} env var.` },
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

  try {
    // Validate stored customer ID — seed/demo data may contain a fake value
    if (customerId) {
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if ((existing as { deleted?: boolean }).deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }

    const orgName = (org?.name as string) ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: orgName,
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
      customer_update: { name: "auto", address: "auto" },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing?success=true&plan=${plan}`,
      cancel_url: `${appUrl}/billing?cancelled=true`,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      subscription_data: {
        metadata: { organisation_id: member.organisation_id, plan, interval, currency },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
