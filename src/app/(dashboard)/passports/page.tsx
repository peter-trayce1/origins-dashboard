"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Upload, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PassportList } from "@/components/passport/PassportList";
import { createClient } from "@/lib/supabase/client";

export default function PassportsPage() {
  const [passports, setPassports] = useState<unknown[]>([]);
  const [brandId, setBrandId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.href = "/login"; return; }

        const { data: member } = await supabase
          .from("organisation_members")
          .select("organisation_id")
          .eq("user_id", user.id)
          .not("accepted_at", "is", null)
          .limit(1)
          .maybeSingle();

        if (!member) { setLoading(false); return; }

        const { data: brand } = await supabase
          .from("brands")
          .select("id")
          .eq("organisation_id", member.organisation_id)
          .limit(1)
          .maybeSingle();

        if (!brand) { setLoading(false); return; }

        setBrandId(brand.id);

        const { data } = await supabase
          .from("passports")
          .select(`
            id, product_name, sku, slug, status, completeness_score,
            primary_image_url, collection_name, passport_code, category, season,
            updated_at, published_at,
            qr_codes(id, scan_count)
          `)
          .eq("brand_id", brand.id)
          .order("updated_at", { ascending: false });

        setPassports(data ?? []);
      } catch (err) {
        console.error("[PassportsPage]", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const actions = (
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
  );

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <PageHeader title="Passports" description="Loading…" actions={actions} />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[#8C8C8C]" />
        </div>
      </div>
    );
  }

  if (passports.length === 0) {
    return (
      <div className="space-y-6 max-w-6xl">
        <PageHeader title="Passports" description="0 Digital Product Passports" actions={actions} />
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F4F4F3] flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-[#8C8C8C]" />
          </div>
          <h3 className="text-[15px] font-semibold text-black mb-1">No passports yet</h3>
          <p className="text-sm text-[#525252] mb-6">
            Create your first Digital Product Passport to get started.
          </p>
          <Link
            href="/passports/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create passport
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Passports"
        description={`${passports.length} Digital Product Passport${passports.length !== 1 ? "s" : ""}`}
        actions={actions}
      />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PassportList initialPassports={passports as any[]} brandId={brandId} />
    </div>
  );
}
