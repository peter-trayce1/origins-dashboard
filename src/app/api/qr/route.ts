import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { passportId, label, styleConfig } = await request.json();
  if (!passportId) return NextResponse.json({ error: "passportId required" }, { status: 400 });

  // Verify passport belongs to user's brand
  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  if (!member) return NextResponse.json({ error: "No organisation" }, { status: 403 });

  const { data: passport } = await supabase
    .from("passports")
    .select("id, passport_code, brand_id, brands(organisation_id)")
    .eq("id", passportId)
    .single();

  if (!passport) return NextResponse.json({ error: "Passport not found" }, { status: 404 });

  const brand = passport.brands as unknown as { organisation_id: string } | null;
  if (brand?.organisation_id !== member.organisation_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const publicPassportUrl = process.env.NEXT_PUBLIC_PUBLIC_PASSPORT_URL ?? "";
  const targetUrl = `${publicPassportUrl}/c/${passport.passport_code}`;

  const { data: qr, error } = await supabase
    .from("qr_codes")
    .insert({
      passport_id: passportId,
      brand_id: passport.brand_id,
      label: label ?? "Default",
      target_url: targetUrl,
      style_config: styleConfig ?? {},
      is_active: true,
      scan_count: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(qr, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const passportId = request.nextUrl.searchParams.get("passportId");
  if (!passportId) return NextResponse.json({ error: "passportId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("passport_id", passportId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
