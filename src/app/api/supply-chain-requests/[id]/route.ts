import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAuthorisedRequest(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, supabase: null, req: null };

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  if (!member) return { error: "No organisation", status: 403, supabase: null, req: null };

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("organisation_id", member.organisation_id)
    .single();
  if (!brand) return { error: "No brand", status: 403, supabase: null, req: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from("supply_chain_requests")
    .select("*, passports(product_name, passport_code)")
    .eq("id", id)
    .eq("brand_id", brand.id)
    .single();

  if (!req) return { error: "Not found", status: 404, supabase: null, req: null };
  return { error: null, status: 200, supabase, req };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, status, req } = await getAuthorisedRequest(id);
  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json(req);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, status, supabase, req } = await getAuthorisedRequest(id);
  if (error || !supabase || !req) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const allowed = ["supplier_name", "supplier_email", "message", "sections", "expires_at"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: updateError } = await (supabase as any)
    .from("supply_chain_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, status, supabase } = await getAuthorisedRequest(id);
  if (error || !supabase) return NextResponse.json({ error }, { status });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("supply_chain_requests").delete().eq("id", id);
  return new NextResponse(null, { status: 204 });
}
