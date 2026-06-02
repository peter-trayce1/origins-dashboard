import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupplyChainResponseData } from "@/types/supply-chain-request";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const { data: scr } = await (supabase as any)
    .from("supply_chain_requests")
    .select("*")
    .eq("id", id)
    .eq("brand_id", brand.id)
    .single();

  if (!scr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!scr.passport_id) return NextResponse.json({ error: "No passport linked to this request" }, { status: 400 });
  if (!scr.response_data) return NextResponse.json({ error: "No response data to import" }, { status: 400 });

  const data = scr.response_data as SupplyChainResponseData;
  const passportId = scr.passport_id as string;
  const imported: string[] = [];

  // ── Factory info → product_facilities ────────────────────────────────────
  if (data.factory_info) {
    const f = data.factory_info;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("product_facilities").insert({
      passport_id: passportId,
      facility_name: f.factory_name,
      tier: 1,
      process_stage: "Cut & Sew",
      country: f.country,
      city: f.city,
      website_url: f.website || null,
      facility_address: f.address,
      ownership_relationship: "tier1_supplier",
      confidence_level: "supplier_declared",
    });
    imported.push("factory_info");
  }

  // ── Manufacturing info → passports table ─────────────────────────────────
  if (data.manufacturing_info) {
    const m = data.manufacturing_info;
    const updates: Record<string, unknown> = {};
    if (m.country_of_manufacture) updates.country_of_origin = m.country_of_manufacture;
    if (m.style_id) updates.sku = m.style_id;
    if (m.manufacturing_date) updates.manufacturing_date = m.manufacturing_date;
    if (Object.keys(updates).length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("passports").update(updates).eq("id", passportId);
    }
    imported.push("manufacturing_info");
  }

  // ── Materials → product_materials ────────────────────────────────────────
  if (data.materials?.length) {
    const rows = data.materials.map((mat) => ({
      passport_id: passportId,
      material_name: mat.material_name,
      percentage: mat.composition_pct,
      supplier_name: mat.supplier_name || null,
      fibre_origin: mat.country_of_origin || null,
      recycled_content_pct: 0,
      bio_based_pct: 0,
      confidence_level: "supplier_declared",
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("product_materials").insert(rows);
    imported.push("materials");
  }

  // ── Trims → passports.trim_notes ─────────────────────────────────────────
  if (data.trims) {
    const t = data.trims;
    const trim_notes = {
      buttons: t.buttons || "",
      zips: t.zips || "",
      labels: t.labels || "",
      packaging: t.packaging || "",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("passports").update({ trim_notes }).eq("id", passportId);
    imported.push("trims");
  }

  // ── Chemical compliance → passports ──────────────────────────────────────
  if (data.chemical_compliance) {
    const c = data.chemical_compliance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("passports").update({
      restricted_substances_ok: c.reach_compliant ? true : null,
      pfas_free: c.no_pfas ? true : null,
      animal_derived: c.animal_derived ?? false,
    }).eq("id", passportId);
    imported.push("chemical_compliance");
  }

  // ── Certifications → product_certifications ───────────────────────────────
  if (data.certifications?.length) {
    const rows = data.certifications.map((cert) => ({
      passport_id: passportId,
      certification_name: cert.certification_name,
      certificate_number: cert.certificate_number || null,
      issued_at: cert.issue_date || null,
      expires_at: cert.expiry_date || null,
      document_url: cert.document_url || null,
      confidence_level: "supplier_declared",
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("product_certifications").insert(rows);
    imported.push("certifications");
  }

  // ── Care → product_care_instructions ─────────────────────────────────────
  if (data.care) {
    const c = data.care;
    const rows = [
      c.washing  && { passport_id: passportId, type: "wash",    instruction: c.washing,  icon_code: "", sort_order: 0 },
      c.drying   && { passport_id: passportId, type: "dry",     instruction: c.drying,   icon_code: "", sort_order: 1 },
      c.ironing  && { passport_id: passportId, type: "iron",    instruction: c.ironing,  icon_code: "", sort_order: 2 },
      c.storage  && { passport_id: passportId, type: "storage", instruction: c.storage,  icon_code: "", sort_order: 3 },
    ].filter(Boolean);
    if (rows.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("product_care_instructions").insert(rows);
    }
    imported.push("care");
  }

  // ── Sustainability → passports core metrics ───────────────────────────────
  if (data.sustainability) {
    const s = data.sustainability;
    const updates: Record<string, unknown> = {};
    if (s.carbon_footprint != null) updates.carbon_footprint_kg = s.carbon_footprint;
    if (s.water_use != null) updates.water_usage_litres = s.water_use;
    if (s.energy_use != null) updates.energy_use_kwh = s.energy_use;
    if (Object.keys(updates).length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("passports").update(updates).eq("id", passportId);
    }
    imported.push("sustainability");
  }

  return NextResponse.json({ imported, passport_id: passportId });
}
