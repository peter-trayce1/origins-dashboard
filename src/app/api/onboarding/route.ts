import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { makeSlug } from "@/lib/slugify";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  // Ensure public.users row exists (trigger may not have fired for older accounts)
  await service.from("users").upsert(
    {
      id:        user.id,
      email:     user.email!,
      full_name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id" }
  );

  const body = await request.json();
  const {
    organisation_name, brand_name, website_url, industry,
    product_category, country, default_theme, logo_url,
    sustainability_story, has_existing_org,
  } = body;

  if (!brand_name?.trim()) {
    return NextResponse.json({ error: "brand_name is required" }, { status: 400 });
  }

  // ── Update mode: org already exists (apply-flow users) ────────────────────
  if (has_existing_org) {
    const { data: member } = await supabase
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .limit(1)
      .maybeSingle();

    if (!member) return NextResponse.json({ error: "No organisation found" }, { status: 403 });

    // Update the existing brand with all collected details
    const { data: brand } = await service
      .from("brands")
      .select("id")
      .eq("organisation_id", member.organisation_id)
      .limit(1)
      .maybeSingle();

    if (brand) {
      await service.from("brands").update({
        name:                 brand_name.trim(),
        website_url:          website_url?.trim() || null,
        industry:             industry || null,
        product_category:     product_category || null,
        country:              country || null,
        logo_url:             logo_url || null,
        sustainability_story: sustainability_story?.trim() || null,
      }).eq("id", brand.id);
    }

    // Mark onboarding complete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service.from("organisations") as any)
      .update({ onboarding_completed: true })
      .eq("id", member.organisation_id);

    return NextResponse.json({ organisationId: member.organisation_id, brandId: brand?.id }, { status: 200 });
  }

  // ── Create mode: no org yet (direct / non-apply signup) ───────────────────
  if (!organisation_name?.trim()) {
    return NextResponse.json({ error: "organisation_name is required" }, { status: 400 });
  }

  const orgSlug = makeSlug(organisation_name) + "-" + Date.now().toString(36);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org, error: orgError } = await (service.from("organisations") as any)
    .insert({
      name:                organisation_name.trim(),
      slug:                orgSlug,
      organisation_status: "approved",
      billing_plan:        "trial",
      billing_status:      "trialing",
      passport_limit:      3,
      onboarding_completed: true,
    })
    .select()
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: orgError?.message ?? "Failed to create organisation" }, { status: 500 });
  }

  const { error: memberError } = await service
    .from("organisation_members")
    .insert({
      organisation_id: org.id,
      user_id:         user.id,
      role:            "admin",
      accepted_at:     new Date().toISOString(),
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const brandSlug = makeSlug(brand_name) + "-" + Date.now().toString(36);
  const { data: brand, error: brandError } = await service
    .from("brands")
    .insert({
      organisation_id:      org.id,
      name:                 brand_name.trim(),
      slug:                 brandSlug,
      website_url:          website_url?.trim() || null,
      industry:             industry || null,
      product_category:     product_category || null,
      country:              country || null,
      default_theme:        default_theme || "origins_standard",
      logo_url:             logo_url || null,
      sustainability_story: sustainability_story?.trim() || null,
    })
    .select()
    .single();

  if (brandError || !brand) {
    return NextResponse.json({ error: brandError?.message ?? "Failed to create brand" }, { status: 500 });
  }

  return NextResponse.json({ organisationId: org.id, brandId: brand.id }, { status: 201 });
}
