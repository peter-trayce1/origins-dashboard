import { NextRequest, NextResponse } from "next/server";
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

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("organisation_id", member.organisation_id)
    .single();

  return NextResponse.json(brand ?? {});
}

export async function PATCH(request: NextRequest) {
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

  const body = await request.json();
  const { name, website_url, sustainability_story, primary_colour, logo_url } = body as {
    name?: string;
    website_url?: string;
    sustainability_story?: string;
    primary_colour?: string;
    logo_url?: string | null;
  };

  const { data, error } = await supabase
    .from("brands")
    .update({
      ...(name !== undefined && { name }),
      ...(website_url !== undefined && { website_url }),
      ...(sustainability_story !== undefined && { sustainability_story }),
      ...(primary_colour !== undefined && { primary_colour }),
      ...(logo_url !== undefined && { logo_url }),
    })
    .eq("organisation_id", member.organisation_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
