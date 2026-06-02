import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  if (!member) return NextResponse.json({ error: "No organisation" }, { status: 403 });

  const { data } = await supabase
    .from("organisation_members")
    .select("id, user_id, role, accepted_at, users(email, full_name)")
    .eq("organisation_id", member.organisation_id)
    .order("created_at", { ascending: true });

  return NextResponse.json(data ?? []);
}
