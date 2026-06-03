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

  const { data: orgs, error } = await db
    .from("organisations")
    .select(`
      id, name, slug, organisation_status,
      billing_plan, billing_interval, billing_status,
      stripe_customer_id, passport_limit, created_at,
      organisation_members(user_id, accepted_at),
      brands(
        id,
        passports(id, status)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with owner email from auth
  const enriched = await Promise.all(
    (orgs ?? []).map(async (org) => {
      const members = (org.organisation_members as { user_id: string; accepted_at: string | null }[]) ?? [];
      const acceptedMember = members.find((m) => m.accepted_at) ?? members[0];
      let ownerEmail = "—";
      if (acceptedMember?.user_id) {
        const { data: authUser } = await db.auth.admin.getUserById(acceptedMember.user_id);
        ownerEmail = authUser?.user?.email ?? "—";
      }

      const brands = (org.brands as { id: string; passports: { id: string; status: string }[] }[]) ?? [];
      const allPassports = brands.flatMap((b) => b.passports ?? []);
      const totalPassports     = allPassports.length;
      const publishedPassports = allPassports.filter((p) => p.status === "published").length;
      const userCount          = members.filter((m) => m.accepted_at).length;

      return {
        id:                  org.id,
        name:                org.name,
        slug:                org.slug,
        organisation_status: org.organisation_status,
        billing_plan:        org.billing_plan,
        billing_interval:    org.billing_interval,
        billing_status:      org.billing_status,
        stripe_customer_id:  org.stripe_customer_id,
        passport_limit:      org.passport_limit,
        created_at:          org.created_at,
        owner_email:         ownerEmail,
        user_count:          userCount,
        total_passports:     totalPassports,
        published_passports: publishedPassports,
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = service();
  const { orgId, updates } = await request.json() as { orgId: string; updates: Record<string, unknown> };

  const allowed = ["billing_plan", "billing_status", "passport_limit", "organisation_status"];
  const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const { error } = await db.from("organisations").update(safe).eq("id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
