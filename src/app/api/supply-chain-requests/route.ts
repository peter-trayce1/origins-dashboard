import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectMissingSections, TIER1_SECTIONS } from "@/lib/supply-chain-sections";
import type { RequestSection } from "@/types/supply-chain-request";

function generateRequestCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

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
    .select("id")
    .eq("organisation_id", member.organisation_id)
    .single();
  if (!brand) return NextResponse.json({ error: "No brand" }, { status: 403 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("supply_chain_requests")
    .select("*, passports(product_name, passport_code)")
    .eq("brand_id", brand.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
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
    .select("id")
    .eq("organisation_id", member.organisation_id)
    .single();
  if (!brand) return NextResponse.json({ error: "No brand" }, { status: 403 });

  const body = await request.json();
  const { passport_id, supplier_name, supplier_email, message, sections: sectionIds, request_type = "tier1_manufacturer" } = body;

  // Build sections array from supplied IDs (or auto-detect from passport gaps)
  let resolvedSections: RequestSection[];
  if (sectionIds && Array.isArray(sectionIds)) {
    resolvedSections = sectionIds.map((id: string) => ({ id, included: true }));
  } else if (passport_id) {
    // Fetch passport to detect gaps
    const { data: passport } = await supabase
      .from("passports")
      .select("country_of_origin, sku, product_facilities(*), product_materials(*), product_certifications(*), product_care_instructions(*)")
      .eq("id", passport_id)
      .single();

    const missing = passport ? detectMissingSections({
      country_of_origin: (passport as Record<string, unknown>).country_of_origin as string,
      sku: (passport as Record<string, unknown>).sku as string,
      product_facilities: (passport as Record<string, unknown>).product_facilities as unknown[],
      product_materials: (passport as Record<string, unknown>).product_materials as unknown[],
      product_certifications: (passport as Record<string, unknown>).product_certifications as unknown[],
      product_care_instructions: (passport as Record<string, unknown>).product_care_instructions as unknown[],
    }) : TIER1_SECTIONS.map((s) => s.id);

    resolvedSections = TIER1_SECTIONS.map((s) => ({
      id: s.id,
      included: missing.includes(s.id) || s.id === "factory_info",
    }));
  } else {
    // Default: all sections included
    resolvedSections = TIER1_SECTIONS.map((s) => ({ id: s.id, included: true }));
  }

  // Generate unique request code
  let request_code = generateRequestCode();
  // Retry on collision (extremely rare)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any).from("supply_chain_requests").select("id").eq("request_code", request_code).single();
  if (existing) request_code = generateRequestCode();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("supply_chain_requests")
    .insert({
      brand_id: brand.id,
      passport_id: passport_id ?? null,
      request_code,
      request_type,
      supplier_name: supplier_name ?? null,
      supplier_email: supplier_email ?? null,
      message: message ?? null,
      sections: resolvedSections,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
