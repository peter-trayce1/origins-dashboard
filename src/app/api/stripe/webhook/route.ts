import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { planFromPriceId, passportLimitForPlan } from "@/lib/billing";
import type Stripe from "stripe";

// Determine if a Stripe price ID is a legacy price (pre-migration)
function isLegacyPrice(priceId: string): boolean {
  return !!(
    priceId === process.env.STRIPE_PRICE_ESSENTIALS_MONTHLY_LEGACY ||
    priceId === process.env.STRIPE_PRICE_ESSENTIALS_ANNUAL_LEGACY ||
    priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY_LEGACY ||
    priceId === process.env.STRIPE_PRICE_GROWTH_ANNUAL_LEGACY
  );
}

// Determine passport allowance based on plan and whether it's a legacy subscription
function getPassportLimitForPriceId(priceId: string): number | null {
  const { plan } = planFromPriceId(priceId);
  const isLegacy = isLegacyPrice(priceId);

  // Legacy subscriptions retain their original allowances
  if (isLegacy) {
    if (plan === "essentials") return 250;
    if (plan === "growth") return 750;
  }

  // New subscriptions use the new allowances
  if (plan === "essentials") return 100;
  if (plan === "growth") return 500;

  // Trial and enterprise
  if (plan === "trial") return 3;
  if (plan === "enterprise") return null; // unlimited

  return 0; // no plan
}

// Must run in Node.js runtime for Stripe signature verification
export const runtime = "nodejs";

// TODO: Set STRIPE_WEBHOOK_SECRET in your .env.local
// Get it from: Stripe Dashboard → Developers → Webhooks → signing secret

function adminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function updateOrgByCustomer(customerId: string, updates: Record<string, unknown>) {
  const db = adminSupabase() as unknown as {
    from: (t: string) => { update: (d: object) => { eq: (k: string, v: string) => Promise<unknown> } };
  };
  return db.from("organisations").update(updates).eq("stripe_customer_id", customerId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing stripe-signature or webhook secret" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        // customer ID is already saved during checkout session creation
        // subscription details come via subscription.created event
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const { plan, interval } = planFromPriceId(priceId);
        // Determine passport limit based on price ID (legacy vs current)
        const limit = getPassportLimitForPriceId(priceId);

        await updateOrgByCustomer(customerId, {
          stripe_subscription_id: sub.id,
          billing_plan:           plan,
          billing_interval:       interval,
          billing_status:         sub.status,
          current_period_end:     new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
          passport_limit:         limit,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateOrgByCustomer(sub.customer as string, {
          billing_plan:    "none",
          billing_status:  "cancelled",
          billing_interval: null,
          current_period_end: null,
          passport_limit:  0,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer) break;
        await updateOrgByCustomer(invoice.customer as string, {
          billing_status: "active",
          current_period_end: invoice.lines?.data[0]?.period?.end
            ? new Date(invoice.lines.data[0].period.end * 1000).toISOString()
            : undefined,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer) break;
        await updateOrgByCustomer(invoice.customer as string, { billing_status: "past_due" });
        break;
      }

      default:
        // Unhandled event type — return 200 so Stripe doesn't retry
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
