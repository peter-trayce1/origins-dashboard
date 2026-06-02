import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TIER1_SECTIONS } from "@/lib/supply-chain-sections";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scr } = await (supabase as any)
    .from("supply_chain_requests")
    .select("id, request_code, request_type, supplier_name, status, sections, message, expires_at, passport_id, brand_id")
    .eq("request_code", code)
    .neq("status", "draft")
    .single();

  if (!scr) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (scr.status === "expired") {
    return NextResponse.json({ error: "This request has expired" }, { status: 410 });
  }

  // Fetch brand + passport info for display
  const { data: brand } = await supabase
    .from("brands")
    .select("name, logo_url")
    .eq("id", scr.brand_id)
    .single();

  let passport = null;
  if (scr.passport_id) {
    const { data: p } = await supabase
      .from("passports")
      .select("product_name, primary_image_url")
      .eq("id", scr.passport_id)
      .single();
    passport = p;
  }

  // Resolve section configs
  const includedSections = (scr.sections as { id: string; included: boolean }[])
    .filter((s) => s.included)
    .map((s) => TIER1_SECTIONS.find((c) => c.id === s.id))
    .filter(Boolean);

  // Mark as opened if it was just sent
  if (scr.status === "sent") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("supply_chain_requests")
      .update({ status: "opened", updated_at: new Date().toISOString() })
      .eq("id", scr.id);
  }

  return NextResponse.json({
    id: scr.id,
    request_code: scr.request_code,
    supplier_name: scr.supplier_name,
    status: scr.status,
    message: scr.message,
    expires_at: scr.expires_at,
    brand,
    passport,
    sections: includedSections,
  });
}
