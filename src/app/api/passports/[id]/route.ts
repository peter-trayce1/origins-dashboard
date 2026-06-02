import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateCompleteness } from "@/lib/completeness";
import { makeUniqueSlug } from "@/lib/slugify";
import type { Json } from "@/lib/supabase/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("passports")
    .select(`
      *,
      product_materials(*),
      product_facilities(*),
      product_certifications(*),
      care_instructions(*),
      circularity_actions(*),
      impact_metrics(*),
      passport_material_extras(*),
      qr_codes(*)
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Generate slug from product_name if not yet set
    if (body.product_name && !body.slug) {
      const { data: existing } = await supabase
        .from("passports")
        .select("slug")
        .eq("id", id)
        .single();

      if (!existing?.slug) {
        body.slug = await makeUniqueSlug(body.product_name, async (s) => {
          const { data } = await supabase
            .from("passports")
            .select("id")
            .eq("slug", s)
            .neq("id", id)
            .single();
          return Boolean(data);
        });
      } else {
        body.slug = existing.slug;
      }
    }

    const { product_materials, product_facilities, product_certifications,
      care_instructions, circularity_actions, impact_metrics,
      passport_material_extras, claim_evidence_urls,
      ...passportData } = body;



    const { data: passport, error } = await supabase
      .from("passports")
      .update({ ...passportData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/passports/:id] update error:", error);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    // Save claim_evidence_urls separately — its column type must be jsonb (not jsonb[])
    if (claim_evidence_urls !== undefined) {
      await supabase
        .from("passports")
        .update({ claim_evidence_urls })
        .eq("id", id);
    }

    if (product_materials !== undefined) {
      await supabase.from("product_materials").delete().eq("passport_id", id);
      if (product_materials.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("product_materials") as any).insert(
          product_materials.map((m: Record<string, unknown>, idx: number) => ({
            passport_id: id,
            sort_order: idx,
            material_id: (m.material_id as string) || null,
            material_name: m.material_name,
            percentage: m.percentage ?? null,
            recycled_content_pct: m.recycled_content_pct ?? null,
            bio_based_pct: m.bio_based_pct ?? null,
            fibre_origin: (m.fibre_origin as string) || null,
            supplier_name: (m.supplier_name as string) || null,
            confidence_level: (m.confidence_level as string) || "brand_declared",
          }))
        );
      }
    }

    if (product_facilities !== undefined) {
      await supabase.from("product_facilities").delete().eq("passport_id", id);
      if (product_facilities.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("product_facilities") as any).insert(
          product_facilities.map((f: Record<string, unknown>, idx: number) => ({
            passport_id: id,
            sort_order: idx,
            facility_id: (f.facility_id as string) || null,
            facility_name: f.facility_name,
            tier: f.tier ?? null,
            process_stage: (f.process_stage as string) || null,
            country: (f.country as string) || null,
            city: (f.city as string) || null,
            website_url: (f.website_url as string) || null,
            facility_address: (f.facility_address as string) || null,
            ownership_relationship: (f.ownership_relationship as string) || null,
            confidence_level: (f.confidence_level as string) || "brand_declared",
          }))
        );
      }
    }

    if (product_certifications !== undefined) {
      await supabase.from("product_certifications").delete().eq("passport_id", id);
      if (product_certifications.length > 0) {
        await supabase.from("product_certifications").insert(
          product_certifications.map((c: Record<string, unknown>) => ({
            passport_id: id,
            certification_id: (c.certification_id as string) || null,
            certification_name: c.certification_name,
            certificate_number: (c.certificate_number as string) || null,
            issued_by: (c.issued_by as string) || null,
            issued_at: (c.issued_at as string) || null,
            expires_at: (c.expires_at as string) || null,
            document_url: (c.document_url as string) || null,
            verification_url: (c.verification_url as string) || null,
            claim_type: (c.claim_type as string) || null,
            confidence_level: (c.confidence_level as string) || "brand_declared",
          }))
        );
      }
    }

    if (care_instructions !== undefined) {
      await supabase.from("care_instructions").delete().eq("passport_id", id);
      if (care_instructions.length > 0) {
        await supabase.from("care_instructions").insert(
          care_instructions.map((c: Record<string, unknown>, idx: number) => ({
            passport_id: id,
            sort_order: idx,
            type: c.type,
            instruction: c.instruction,
            icon_code: (c.icon_code as string) || null,
          }))
        );
      }
    }

    if (circularity_actions !== undefined) {
      await supabase.from("circularity_actions").delete().eq("passport_id", id);
      if (circularity_actions.length > 0) {
        await supabase.from("circularity_actions").insert(
          circularity_actions.map((a: Record<string, unknown>, idx: number) => ({
            passport_id: id,
            sort_order: idx,
            type: a.type,
            title: a.title,
            description: (a.description as string) || null,
            url: (a.url as string) || null,
          }))
        );
      }
    }

    if (passport_material_extras !== undefined) {
      await supabase.from("passport_material_extras").delete().eq("passport_id", id);
      if (Object.keys(passport_material_extras).length > 0) {
        await supabase.from("passport_material_extras").insert({
          ...passport_material_extras,
          passport_id: id,
        });
      }
    }

    if (impact_metrics !== undefined) {
      await supabase.from("impact_metrics").delete().eq("passport_id", id);
      if (impact_metrics.length > 0) {
        await supabase.from("impact_metrics").insert(
          impact_metrics.map((m: Record<string, unknown>, idx: number) => ({
            passport_id: id,
            metric_key: (m.metric_key as string) || `metric_${idx}`,
            label: (m.metric_name as string) || (m.label as string) || null,
            metric_type: (m.metric_type as string) || "other",
            metric_value: m.metric_value ?? null,
            metric_unit: (m.metric_unit as string) || null,
            benchmark_value: m.benchmark_value ?? null,
            avoided_value: m.avoided_value ?? null,
            savings_percentage: m.savings_percentage ?? null,
            explanation: (m.explanation as string) || null,
            evidence_url: (m.evidence_url as string) || null,
            verification_status: (m.verification_status as string) || "claimed",
            display_public: m.display_public !== false,
            sort_order: (m.sort_order as number) ?? idx,
            source_name: (m.source_name as string) || null,
            source_method: (m.source_method as string) || null,
            metric_scope: (m.metric_scope as string) || null,
            confidence_level: (m.confidence_level as string) || "brand_declared",
          }))
        );
      }
    }

    const { data: fullPassport } = await supabase
      .from("passports")
      .select(`
        *,
        product_materials(id),
        product_facilities(id),
        product_certifications(id),
        care_instructions(id),
        circularity_actions(id)
      `)
      .eq("id", id)
      .single();

    if (fullPassport) {
      const completeness = calculateCompleteness(fullPassport as unknown as Parameters<typeof calculateCompleteness>[0]);
      await supabase
        .from("passports")
        .update({
          completeness_score: completeness.score,
          completeness_detail: completeness.detail as unknown as Json,
        })
        .eq("id", id);
    }

    const finalScore = fullPassport
      ? calculateCompleteness(fullPassport as unknown as Parameters<typeof calculateCompleteness>[0]).score
      : passport.completeness_score;

    return NextResponse.json({ ...passport, completeness_score: finalScore });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[PATCH /api/passports/:id] unhandled exception:", message);
    return NextResponse.json({ error: message, thrown: true }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("passports").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
