import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PublicPassportPage } from "@/components/public-passport/PublicPassportPage";
import type { PassportWithRelations } from "@/types/passport";
import type { Metadata } from "next";

export const revalidate = 60;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getPassport(slug: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("passports")
    .select(`
      *,
      brands(id, name, logo_url, website_url, sustainability_story, primary_colour, default_cta_links),
      product_materials(*),
      product_facilities(*),
      product_certifications(*),
      care_instructions(*),
      circularity_actions(*),
      impact_metrics(*),
      passport_material_extras(*),
      qr_codes(id, target_url, scan_count)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return data as unknown as PassportWithRelations;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const passport = await getPassport(slug);
  if (!passport) return { title: "Passport not found" };

  const brand = passport.brands as { name: string; logo_url: string | null };

  return {
    title: `${passport.product_name} — ${brand?.name}`,
    description:
      passport.consumer_transparency_summary ??
      passport.product_description ??
      `Digital Product Passport for ${passport.product_name}`,
    openGraph: {
      title: `${passport.product_name} — ${brand?.name}`,
      description: passport.product_description ?? undefined,
      images: passport.primary_image_url ? [passport.primary_image_url] : [],
      type: "website",
    },
  };
}

export default async function ManorsGolfSS25PassportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ qr?: string }>;
}) {
  const { slug } = await params;
  const { qr: qrCodeId } = await searchParams;
  const passport = await getPassport(slug);

  if (!passport) notFound();

  // Record scan non-blocking; scan_count maintained by DB trigger
  const supabase = getServiceClient();
  supabase.from("scans").insert({
    passport_id: passport.id,
    brand_id: passport.brand_id,
    qr_code_id: qrCodeId ?? null,
    device_type: "unknown",
  });

  return <PublicPassportPage passport={passport} />;
}
