import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { RequestsList } from "@/components/supply-chain-requests/RequestsList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Supply Chain Requests" };

export default async function SupplyChainRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  if (!member) redirect("/onboarding");

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("organisation_id", member.organisation_id)
    .single();
  if (!brand) redirect("/onboarding");

  return (
    <div className="space-y-8 max-w-6xl">
      <PageHeader
        title="Supply Chain Requests"
        description="Collect passport data from suppliers without emails or spreadsheets"
      />
      <Suspense>
        <RequestsList brandId={brand.id} />
      </Suspense>
    </div>
  );
}
