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

  // List all auth users (max 1000 — paginate if needed in future)
  const { data: authData, error: authError } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // Get role from the public.users table
  const { data: profileRows } = await db.from("users").select("id, role");
  const roleMap = Object.fromEntries((profileRows ?? []).map((r) => [r.id, r.role]));

  // Get org memberships
  const { data: members } = await db
    .from("organisation_members")
    .select("user_id, role, accepted_at, organisations(name)")
    .not("accepted_at", "is", null);

  const memberMap: Record<string, { orgName: string; memberRole: string }> = {};
  for (const m of members ?? []) {
    const org = m.organisations as unknown as { name: string } | null;
    if (org) memberMap[m.user_id] = { orgName: org.name, memberRole: m.role };
  }

  const users = (authData?.users ?? []).map((u) => ({
    id:            u.id,
    email:         u.email ?? "—",
    full_name:     u.user_metadata?.full_name ?? "—",
    role:          roleMap[u.id] ?? "user",
    org_name:      memberMap[u.id]?.orgName ?? "—",
    org_role:      memberMap[u.id]?.memberRole ?? "—",
    created_at:    u.created_at,
    last_sign_in:  u.last_sign_in_at ?? null,
  }));

  return NextResponse.json(users);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isSuperAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = service();
  const { userId, role } = await request.json() as { userId: string; role: string };

  const allowed = ["user", "platform_admin", "super_admin"];
  if (!allowed.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const { error } = await db.from("users").update({ role }).eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
