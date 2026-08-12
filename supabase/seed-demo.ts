/**
 * Demo seed script — creates a test login for the Origins billing page.
 *
 * Usage:
 *   npx tsx supabase/seed-demo.ts
 *
 * Safe to rerun — all steps check for existing records before inserting.
 *
 * Credentials created:
 *   Email:    demo@origins-id.com
 *   Password: OriginsDemo123!
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local from the project root
config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Config ────────────────────────────────────────────────────────────────────

const DEMO_EMAIL    = "demo@origins-id.com";
const DEMO_PASSWORD = "OriginsDemo123!";
const ORG_NAME      = "Origins Demo Brand";
const ORG_SLUG      = "origins-demo-brand";
const BRAND_NAME    = "Origins Demo Brand";

const now              = new Date();
const periodEnd        = new Date(now);
periodEnd.setFullYear(periodEnd.getFullYear() + 1);

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`  ${msg}`); }
function ok(msg: string)  { console.log(`  ✓ ${msg}`); }

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱  Origins demo seed\n");

  // ── 1. Auth user ─────────────────────────────────────────────────────────────
  // The handle_new_user trigger auto-creates the public.users row.

  let userId: string;

  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingAuthUser = allUsers.find((u) => u.email === DEMO_EMAIL);

  if (existingAuthUser) {
    userId = existingAuthUser.id;
    ok("Auth user already exists");

    // Ensure password is correct (reset it in case it drifted)
    await supabase.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD });
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo User" },
    });
    if (error) throw new Error(`Failed to create auth user: ${error.message}`);
    userId = data.user.id;
    ok(`Auth user created — ${DEMO_EMAIL}`);
  }

  // ── 2. Organisation ───────────────────────────────────────────────────────────

  type OrgRow = { id: string };
  let orgId: string;

  const { data: existingOrg } = await (supabase as unknown as {
    from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: OrgRow | null }> } } };
  }).from("organisations").select("id").eq("slug", ORG_SLUG).maybeSingle();

  if (existingOrg) {
    orgId = existingOrg.id;
    ok("Organisation already exists — updating billing fields");

    await (supabase as unknown as {
      from: (t: string) => { update: (d: object) => { eq: (k: string, v: string) => Promise<unknown> } };
    }).from("organisations").update({
      billing_plan:      "essentials",
      billing_status:    "active",
      billing_interval:  "monthly",
      passport_limit:    100,
      current_period_end: periodEnd.toISOString(),
      // Clearly fake values — no real Stripe subscription needed
      stripe_customer_id:     "cus_demo_test_only",
      stripe_subscription_id: "sub_demo_test_only",
    }).eq("id", orgId);
  } else {
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        insert: (d: object) => { select: (c: string) => { single: () => Promise<{ data: OrgRow | null; error: unknown }> } };
      };
    }).from("organisations").insert({
      name:              ORG_NAME,
      slug:              ORG_SLUG,
      billing_plan:      "essentials",
      billing_status:    "active",
      billing_interval:  "monthly",
      passport_limit:    100,
      current_period_end: periodEnd.toISOString(),
      stripe_customer_id:     "cus_demo_test_only",
      stripe_subscription_id: "sub_demo_test_only",
    }).select("id").single();

    if (error || !data) throw new Error(`Failed to create organisation: ${JSON.stringify(error)}`);
    orgId = data.id;
    ok("Organisation created — Origins Demo Brand");
  }

  // ── 3. Organisation member ────────────────────────────────────────────────────

  type MemberRow = { id: string };
  const { data: existingMember } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: MemberRow | null }> };
        };
      };
    };
  }).from("organisation_members").select("id").eq("user_id", userId).eq("organisation_id", orgId).maybeSingle();

  if (!existingMember) {
    const { error } = await (supabase as unknown as {
      from: (t: string) => { insert: (d: object) => Promise<{ error: unknown }> };
    }).from("organisation_members").insert({
      user_id:         userId,
      organisation_id: orgId,
      role:            "admin",
      accepted_at:     now.toISOString(),
    });
    if (error) throw new Error(`Failed to create member: ${JSON.stringify(error)}`);
    ok("Organisation member created (admin)");
  } else {
    ok("Organisation member already exists");
  }

  // ── 4. Brand ──────────────────────────────────────────────────────────────────

  type BrandRow = { id: string };
  let brandId: string;

  const { data: existingBrand } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: BrandRow | null }> };
      };
    };
  }).from("brands").select("id").eq("organisation_id", orgId).maybeSingle();

  if (existingBrand) {
    brandId = existingBrand.id;
    ok("Brand already exists");
  } else {
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        insert: (d: object) => { select: (c: string) => { single: () => Promise<{ data: BrandRow | null; error: unknown }> } };
      };
    }).from("brands").insert({
      organisation_id: orgId,
      name:            BRAND_NAME,
      slug:            ORG_SLUG,
    }).select("id").single();

    if (error || !data) throw new Error(`Failed to create brand: ${JSON.stringify(error)}`);
    brandId = data.id;
    ok("Brand created — Origins Demo Brand");
  }

  // ── 5. Draft sample passports ─────────────────────────────────────────────────
  // None are published — active passport count stays at 0.

  type PassportRow = { id: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const countResult: any = await (supabase as any).from("passports").select("id", { count: "exact", head: true }).eq("brand_id", brandId).eq("status", "draft");

  const existingCount: number = countResult?.count ?? 0;

  if (existingCount >= 3) {
    ok("Sample draft passports already exist");
  } else {
    const demoPassports = [
      {
        brand_id:            brandId,
        product_name:        "Organic Cotton Essential Tee",
        category:            "Tops",
        product_description: "A classic everyday tee made from 100% GOTS-certified organic cotton grown without synthetic pesticides.",
        country_of_origin:   "India",
        collection_name:     "Core Collection",
        season:              "SS26",
        slug:                `organic-cotton-essential-tee-${orgId.slice(0, 6)}`,
        status:              "draft",
        wizard_step:         3,
        passport_code:       "KO-DEMO0001",
        completeness_score:  42,
        completeness_detail: {},
      },
      {
        brand_id:            brandId,
        product_name:        "Recycled Denim Jacket",
        category:            "Outerwear",
        product_description: "Structured denim jacket made from 80% post-consumer recycled denim fibre.",
        country_of_origin:   "Portugal",
        collection_name:     "Core Collection",
        season:              "SS26",
        slug:                `recycled-denim-jacket-${orgId.slice(0, 6)}`,
        status:              "draft",
        wizard_step:         2,
        passport_code:       "KO-DEMO0002",
        completeness_score:  28,
        completeness_detail: {},
      },
      {
        brand_id:            brandId,
        product_name:        "Linen Wide-Leg Trousers",
        category:            "Bottoms",
        product_description: "Relaxed wide-leg trousers woven from 100% European Flax linen.",
        country_of_origin:   "Belgium",
        collection_name:     "Resort 2026",
        season:              "SS26",
        slug:                `linen-wide-leg-trousers-${orgId.slice(0, 6)}`,
        status:              "draft",
        wizard_step:         2,
        passport_code:       "KO-DEMO0003",
        completeness_score:  24,
        completeness_detail: {},
      },
    ];

    const { error } = await (supabase as unknown as {
      from: (t: string) => { insert: (d: object) => Promise<{ error: unknown }> };
    }).from("passports").insert(demoPassports);

    if (error) throw new Error(`Failed to create sample passports: ${JSON.stringify(error)}`);
    ok("3 draft sample passports created (none published — usage stays at 0)");
  }

  // ── Done ──────────────────────────────────────────────────────────────────────

  console.log(`
✅  Demo seed complete

    URL:      ${SUPABASE_URL.replace("supabase.co", "supabase.co")}
    Email:    ${DEMO_EMAIL}
    Password: ${DEMO_PASSWORD}

    Plan:     Essentials · active · monthly
    Usage:    0 / 100 Active Product Passports this year
    Resets:   ${periodEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}

    Stripe:   No real Stripe account required.
              stripe_customer_id  = cus_demo_test_only
              stripe_subscription_id = sub_demo_test_only
`);
}

seed().catch((err) => {
  console.error("\n❌  Seed failed:", err.message ?? err);
  process.exit(1);
});
