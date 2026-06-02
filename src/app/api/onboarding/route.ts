import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { makeSlug } from "@/lib/slugify";

export async function POST(request: NextRequest) {
  // Verify the user is authenticated via the regular (cookie-based) client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use the service client to bypass RLS for the privileged onboarding inserts
  const service = createServiceClient();

  // Ensure the user exists in public.users — the trigger may not have fired
  // if the account was created before migrations were applied
  await service.from("users").upsert(
    {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id" }
  );

  const body = await request.json();
  const { organisation_name, brand_name, website_url, industry, product_category, country, default_theme } = body;

  if (!organisation_name?.trim() || !brand_name?.trim()) {
    return NextResponse.json({ error: "organisation_name and brand_name are required" }, { status: 400 });
  }

  const orgSlug = makeSlug(organisation_name) + "-" + Date.now().toString(36);
  const { data: org, error: orgError } = await service
    .from("organisations")
    .insert({ name: organisation_name.trim(), slug: orgSlug })
    .select()
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: orgError?.message ?? "Failed to create organisation" }, { status: 500 });
  }

  const { error: memberError } = await service
    .from("organisation_members")
    .insert({
      organisation_id: org.id,
      user_id: user.id,
      role: "admin",
      accepted_at: new Date().toISOString(),
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const brandSlug = makeSlug(brand_name) + "-" + Date.now().toString(36);
  const { data: brand, error: brandError } = await service
    .from("brands")
    .insert({
      organisation_id: org.id,
      name: brand_name.trim(),
      slug: brandSlug,
      website_url: website_url?.trim() || null,
      industry: industry || null,
      product_category: product_category || null,
      country: country || null,
      default_theme: default_theme || "origins_standard",
    })
    .select()
    .single();

  if (brandError || !brand) {
    return NextResponse.json({ error: brandError?.message ?? "Failed to create brand" }, { status: 500 });
  }

  return NextResponse.json({ organisationId: org.id, brandId: brand.id }, { status: 201 });
}
