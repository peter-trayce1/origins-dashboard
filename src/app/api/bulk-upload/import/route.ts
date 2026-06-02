import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyMapping } from "@/lib/csv/mapper";
import { validateRows } from "@/lib/csv/validator";
import { parseMaterials, parseSemicolonList, inferCareType } from "@/lib/csv/parser";
import { makeUniqueSlug } from "@/lib/slugify";
import { calculateCompleteness } from "@/lib/completeness";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows, mappings } = await request.json();
  if (!rows?.length || !mappings?.length) {
    return NextResponse.json({ error: "rows and mappings required" }, { status: 400 });
  }

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

  const mappedRows = applyMapping(rows, mappings);
  const validationErrors = validateRows(mappedRows);

  if (validationErrors.length > 0) {
    return NextResponse.json({ error: "Validation failed", validationErrors }, { status: 422 });
  }

  const created: string[] = [];
  const failed: { rowIndex: number; error: string }[] = [];

  for (let i = 0; i < mappedRows.length; i++) {
    const row = mappedRows[i];
    try {
      const slug = await makeUniqueSlug(row.product_name, async (s) => {
        const { data } = await supabase.from("passports").select("id").eq("slug", s).single();
        return !!data;
      });

      const passportData = {
        brand_id: brand.id,
        product_name: row.product_name,
        sku: row.internal_product_reference || null,
        gtin: row.gtin || null,
        category: row.category || null,
        season: row.season || null,
        collection_name: row.collection_name || null,
        product_description: row.product_description || null,
        product_url: row.product_url || null,
        primary_image_url: row.primary_image_url || null,
        country_of_origin: row.country_of_origin || null,
        product_weight_g: row.product_weight_g ? parseFloat(row.product_weight_g) : null,
        product_lifetime_years: row.product_lifetime_years ? parseFloat(row.product_lifetime_years) : null,
        product_story: row.product_story || null,
        sustainability_summary: row.sustainability_summary || null,
        carbon_footprint_kg: row.carbon_footprint_kg ? parseFloat(row.carbon_footprint_kg) : null,
        water_usage_litres: row.water_usage_litres ? parseFloat(row.water_usage_litres) : null,
        gender: row.gender || null,
        colour: row.colour || null,
        size_range: row.size_range || null,
        consumer_transparency_summary: row.consumer_transparency_summary || null,
        slug,
        status: "draft" as const,
        wizard_step: 1,
      };

      const score = calculateCompleteness({
        ...passportData,
        product_materials: [],
        product_facilities: [],
        care_instructions: [],
        product_certifications: [],
        circularity_actions: [],
        impact_metrics: [],
      } as unknown as Parameters<typeof calculateCompleteness>[0]);

      const { data: passport, error } = await supabase
        .from("passports")
        .insert({
          ...passportData,
          completeness_score: score.score,
          completeness_detail: score.detail as unknown as import("@/lib/supabase/types").Json,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      const passportId = passport.id;

      // ── Insert related records ────────────────────────────────────────────

      // Materials: "98% Organic Cotton; 2% Elastane"
      if (row.material_composition) {
        const materials = parseMaterials(row.material_composition);
        if (materials.length > 0) {
          await supabase.from("product_materials").insert(
            materials.map((m, idx) => ({
              passport_id: passportId,
              material_name: m.name,
              percentage: m.percentage,
              confidence_level: "brand_declared" as const,
              sort_order: idx,
            }))
          );
        }
      }

      // Facilities: factory name + infer country from country_of_origin
      if (row.factory_name) {
        await supabase.from("product_facilities").insert({
          passport_id: passportId,
          facility_name: row.factory_name,
          tier: 1,
          process_stage: "Manufacturing",
          country: row.country_of_origin || null,
          confidence_level: "brand_declared" as const,
          sort_order: 0,
        });
      }

      // Certifications: "GOTS; OEKO-TEX; GRS"
      if (row.certifications) {
        const certs = parseSemicolonList(row.certifications);
        if (certs.length > 0) {
          await supabase.from("product_certifications").insert(
            certs.map((name) => ({
              passport_id: passportId,
              certification_name: name,
              confidence_level: "brand_declared" as const,
            }))
          );
        }
      }

      // Care instructions: "Machine wash 30°C; Do not tumble dry"
      if (row.care_instructions) {
        const instructions = parseSemicolonList(row.care_instructions);
        if (instructions.length > 0) {
          await supabase.from("care_instructions").insert(
            instructions.map((instruction, idx) => ({
              passport_id: passportId,
              type: inferCareType(instruction),
              instruction,
              sort_order: idx,
            }))
          );
        }
      }

      created.push(passportId);
    } catch (err) {
      failed.push({ rowIndex: i, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  return NextResponse.json({ created: created.length, failed, passportIds: created });
}
