import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Upload, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { PassportList } from "@/components/passport/PassportList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Passports" };

export default async function PassportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  if (!member) redirect("/onboarding");

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("organisation_id", member.organisation_id)
    .limit(1)
    .single();

  if (!brand) redirect("/onboarding");

  const { data: passports } = await supabase
    .from("passports")
    .select(`
      id, product_name, sku, slug, status, completeness_score,
      primary_image_url, collection_name, passport_code, category, wizard_step,
      created_at, updated_at, published_at,
      qr_codes(id, scan_count)
    `)
    .eq("brand_id", brand.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Passports"
        description={`${passports?.length ?? 0} Digital Product Passports`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/bulk-upload"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#E8E8E6] bg-background px-2.5 text-[0.8rem] font-medium text-foreground transition-all hover:bg-muted"
            >
              <Upload className="h-3.5 w-3.5" />
              Bulk upload
            </Link>
            <Link
              href="/passports/new"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              New passport
            </Link>
          </div>
        }
      />

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PassportList initialPassports={(passports ?? []) as any[]} brandId={brand.id} />
    </div>
  );
}
