import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role = "editor" } = await request.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id, role")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();

  if (!member) return NextResponse.json({ error: "No organisation" }, { status: 403 });
  if (member.role !== "admin") return NextResponse.json({ error: "Only admins can invite team members" }, { status: 403 });

  // Use service client to invite user
  const serviceClient = await createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: inviteData, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/api/auth/callback`,
    data: {
      organisation_id: member.organisation_id,
      invited_role: role,
    },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pre-create the membership record
  await serviceClient.from("organisation_members").insert({
    organisation_id: member.organisation_id,
    user_id: inviteData.user.id,
    role,
    accepted_at: null,
  });

  return NextResponse.json({ success: true });
}
