import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_KINDS = new Set(["suppliers", "care_instructions"]);

async function resolveBrand(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .maybeSingle();
  if (!member) return { error: "No organisation", status: 403 as const };

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("organisation_id", member.organisation_id)
    .limit(1)
    .maybeSingle();
  if (!brand) return { error: "No brand", status: 403 as const };

  return { brandId: brand.id as string };
}

// GET /api/brand-memory?kind=suppliers → returns the stored array (or [])
export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind") ?? "";
  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const supabase = await createClient();
  const resolved = await resolveBrand(supabase);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("brand_memory")
    .select("data")
    .eq("brand_id", resolved.brandId)
    .eq("kind", kind)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data?.data ?? [] });
}

// PUT /api/brand-memory  body: { kind, data } → upserts the whole array
export async function PUT(request: NextRequest) {
  let body: { kind?: string; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { kind, data } = body;
  if (!kind || !ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (!Array.isArray(data)) {
    return NextResponse.json({ error: "data must be an array" }, { status: 400 });
  }

  const supabase = await createClient();
  const resolved = await resolveBrand(supabase);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("brand_memory")
    .upsert(
      { brand_id: resolved.brandId, kind, data, updated_at: new Date().toISOString() },
      { onConflict: "brand_id,kind" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
