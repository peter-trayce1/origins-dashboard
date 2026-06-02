import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicPassportPage } from "@/components/public-passport/PublicPassportPage";
import type { PassportWithRelations } from "@/types/passport";
import Link from "next/link";

async function getPassportForPreview(id: string) {
  const supabase = await createClient();
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
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as unknown as PassportWithRelations;
}

export default async function PassportPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const passport = await getPassportForPreview(id);
  if (!passport) notFound();

  return (
    <>
      {/* Draft preview banner — fixed at top, z above passport header */}
      <div className="fixed top-0 left-0 right-0 z-[200] bg-[#111] text-white flex items-center justify-between px-4 h-8 text-[11px] font-mono">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          Draft preview — not visible to the public
        </span>
        <Link
          href={`/passports/${id}`}
          className="text-[#888] hover:text-white transition-colors"
        >
          ← Back to builder
        </Link>
      </div>

      {/* Passport renders below the banner */}
      <div className="pt-8">
        <PublicPassportPage passport={passport} previewMode />
      </div>
    </>
  );
}
