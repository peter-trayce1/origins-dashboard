import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: currentMember } = await supabase
    .from("organisation_members")
    .select("organisation_id, role")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  if (!currentMember || currentMember.role !== "admin") {
    return NextResponse.json({ error: "Only admins can remove team members" }, { status: 403 });
  }

  await supabase
    .from("organisation_members")
    .delete()
    .eq("id", memberId)
    .eq("organisation_id", currentMember.organisation_id)
    .neq("user_id", user.id); // can't remove yourself

  return new NextResponse(null, { status: 204 });
}
