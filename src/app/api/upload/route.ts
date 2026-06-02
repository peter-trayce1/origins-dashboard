import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUploadUrl } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { filename, mimeType, purpose, passportId } = body;

  if (!filename || !mimeType || !purpose) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get user's organisation and brand
  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  if (!member) return NextResponse.json({ error: "No organisation found" }, { status: 403 });

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("organisation_id", member.organisation_id)
    .limit(1)
    .single();

  if (!brand) return NextResponse.json({ error: "No brand found" }, { status: 403 });

  const result = await getUploadUrl({
    organisationId: member.organisation_id,
    brandId: brand.id,
    purpose,
    filename,
    mimeType,
  });

  return NextResponse.json(result);
}
