import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { makeUniqueSlug } from "@/lib/slugify";
import { calculateCompleteness } from "@/lib/completeness";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("passports")
    .select(`
      id, product_name, sku, slug, status, completeness_score,
      primary_image_url, collection_name, category, wizard_step,
      created_at, updated_at, published_at, brand_id,
      qr_codes(id, scan_count)
    `)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

function generatePassportCode(): string {
  const digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `ORI-${digits}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { brand_id, product_name } = body;

  if (!brand_id) return NextResponse.json({ error: "brand_id required" }, { status: 400 });

  // Generate unique slug if product name provided
  let slug: string | undefined;
  if (product_name) {
    slug = await makeUniqueSlug(product_name, async (s) => {
      const { data } = await supabase.from("passports").select("id").eq("slug", s).single();
      return Boolean(data);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("passports") as any)
    .insert({
      brand_id,
      product_name: product_name ?? "",
      slug,
      status: "draft",
      wizard_step: 1,
      passport_code: generatePassportCode(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create a QR code immediately — tied to the ORI passport code, not the slug
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("qr_codes") as any).insert({
    passport_id: data.id,
    brand_id,
    label: "Default",
    target_url: `${appUrl}/c/${data.passport_code}`,
    is_active: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("audit_logs") as any).insert({
    user_id: user.id,
    action: "passport.created",
    resource_type: "passport",
    resource_id: data.id,
  });

  return NextResponse.json(data, { status: 201 });
}
