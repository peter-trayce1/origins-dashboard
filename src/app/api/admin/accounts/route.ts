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

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = service();
  const { orgIds } = await request.json() as { orgIds: string[] };
  if (!Array.isArray(orgIds) || orgIds.length === 0) {
    return NextResponse.json({ error: "orgIds required" }, { status: 400 });
  }

  // Find auth users who belong ONLY to the orgs being deleted (no other memberships)
  const { data: members } = await db
    .from("organisation_members")
    .select("user_id, organisation_id")
    .in("organisation_id", orgIds);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];

  // Filter to users who have no memberships outside the orgs being deleted
  const usersToDelete: string[] = [];
  for (const uid of userIds) {
    const { data: otherMemberships } = await db
      .from("organisation_members")
      .select("id")
      .eq("user_id", uid)
      .not("organisation_id", "in", `(${orgIds.join(",")})`)
      .limit(1);
    if (!otherMemberships?.length) usersToDelete.push(uid);
  }

  // Collect brand and passport IDs so we can delete FK-constrained tables first.
  const { data: brands } = await db.from("brands").select("id").in("organisation_id", orgIds);
  const brandIds = (brands ?? []).map((b) => b.id);

  if (brandIds.length > 0) {
    const { data: passports } = await db.from("passports").select("id").in("brand_id", brandIds);
    const passportIds = (passports ?? []).map((p) => p.id);

    // Delete tables that reference brand_id or passport_id without CASCADE
    if (passportIds.length > 0) {
      await db.from("scans").delete().in("passport_id", passportIds);
    }
    await db.from("scans").delete().in("brand_id", brandIds);
    await db.from("qr_codes").delete().in("brand_id", brandIds);
    await db.from("ai_generation_logs").delete().in("brand_id", brandIds);
    await db.from("files").delete().in("brand_id", brandIds);
    await db.from("data_connections").delete().in("brand_id", brandIds);
  }

  await db.from("audit_logs").delete().in("organisation_id", orgIds);

  // Now delete the orgs — cascade handles brands, passports, members, etc.
  const { error: orgError } = await db.from("organisations").delete().in("id", orgIds);
  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 });

  // Delete auth users (best-effort — don't fail if some can't be deleted)
  await Promise.allSettled(
    usersToDelete.map((uid) => db.auth.admin.deleteUser(uid))
  );

  return NextResponse.json({ deleted: orgIds.length, usersDeleted: usersToDelete.length });
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
