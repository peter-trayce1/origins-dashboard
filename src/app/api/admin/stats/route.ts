import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isSuperAdmin } from "@/lib/super-admin";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = service();

  const [orgsRes, passportsRes, qrRes] = await Promise.all([
    db.from("organisations").select("organisation_status, billing_plan, billing_status, billing_interval, passport_limit"),
    db.from("passports").select("status, created_at"),
    db.from("qr_codes").select("id"),
  ]);

  const orgs = orgsRes.data ?? [];
  const passports = passportsRes.data ?? [];
  const qrCodes = qrRes.data ?? [];

  const totalOrgs       = orgs.length;
  const pendingOrgs     = orgs.filter((o) => o.organisation_status === "pending").length;
  const approvedOrgs    = orgs.filter((o) => o.organisation_status === "approved").length;
  const trialOrgs       = orgs.filter((o) => o.billing_plan === "trial" || o.billing_status === "trialing").length;
  const essentialsOrgs  = orgs.filter((o) => o.billing_plan === "essentials" && o.billing_status === "active").length;
  const growthOrgs      = orgs.filter((o) => o.billing_plan === "growth" && o.billing_status === "active").length;
  const enterpriseOrgs  = orgs.filter((o) => o.billing_plan === "enterprise" && o.billing_status === "active").length;

  const totalPassports     = passports.length;
  const publishedPassports = passports.filter((p) => p.status === "published").length;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear  = new Date(now.getFullYear(), 0, 1).toISOString();
  const passportUsageMonth = passports.filter((p) => p.created_at >= startOfMonth).length;
  const passportUsageYear  = passports.filter((p) => p.created_at >= startOfYear).length;

  // MRR/ARR estimated from subscription data in the DB
  // TODO: sync with live Stripe data via webhook for accuracy
  const MRR_BY_PLAN: Record<string, number> = { essentials: 375, growth: 795 };
  const ARR_FACTOR: Record<string, number>  = { monthly: 12, annual: 1 };

  let mrr = 0;
  let arr = 0;
  for (const org of orgs) {
    if (org.billing_status !== "active") continue;
    const monthly = MRR_BY_PLAN[org.billing_plan] ?? 0;
    if (!monthly) continue;
    const annualFactor = org.billing_interval === "annual" ? ARR_FACTOR.annual : ARR_FACTOR.monthly;
    mrr += monthly;
    arr += monthly * annualFactor;
  }

  return NextResponse.json({
    totalOrgs, pendingOrgs, approvedOrgs, trialOrgs,
    essentialsOrgs, growthOrgs, enterpriseOrgs,
    totalPassports, publishedPassports,
    totalQRCodes: qrCodes.length,
    passportUsageMonth, passportUsageYear,
    mrr, arr,
  });
}
