import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { getOrganisationBilling } from "@/lib/billing";
import { Zap, AlertTriangle } from "lucide-react";

export default async function OrganizationSettingsPage() {
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

  const { data: org } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => { single: () => Promise<{ data: { name: string; billing_plan: string; passport_limit: number } }> };
      };
    };
  }).from("organisations").select("name, billing_plan, passport_limit").eq("id", member.organisation_id).single();

  const billing = await getOrganisationBilling(member.organisation_id);

  const planLabels: Record<string, { label: string; color: string }> = {
    trial: { label: "Trial", color: "amber" },
    essentials: { label: "Essentials", color: "blue" },
    growth: { label: "Growth", color: "violet" },
    enterprise: { label: "Enterprise", color: "black" },
    none: { label: "No plan", color: "gray" },
  };

  const planInfo = planLabels[billing.billingPlan] || { label: "Unknown", color: "gray" };

  return (
    <div className="space-y-8 max-w-xl">
      <PageHeader title="Organization" description="Overview and billing information." />

      {/* Organization name */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#8C8C8C] uppercase tracking-widest">Organization name</p>
        <p className="text-lg font-semibold text-black">{org.name}</p>
      </div>

      <div className="border-t border-[#F0F0EE]" />

      {/* Current plan card */}
      <div className="bg-white border border-[#E8E8E6] rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#8C8C8C] uppercase tracking-widest mb-1">Current plan</p>
            <p className="text-2xl font-semibold text-black">{planInfo.label}</p>
          </div>
          <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${
            planInfo.color === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
            planInfo.color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" :
            planInfo.color === "violet" ? "bg-violet-50 text-violet-700 border-violet-200" :
            planInfo.color === "black" ? "bg-black text-white border-black" :
            "bg-[#F4F4F3] text-[#525252] border-[#E8E8E6]"
          }`}>
            {billing.billingStatus.charAt(0).toUpperCase() + billing.billingStatus.slice(1)}
          </span>
        </div>

        {billing.passportLimit !== null && (
          <div>
            <p className="text-sm text-[#525252]">
              <strong>{billing.passportLimit.toLocaleString()}</strong> Active Product Passports per year
            </p>
          </div>
        )}

        {billing.currentPeriodEnd && (
          <div>
            <p className="text-xs text-[#8C8C8C]">
              Period ends <strong>{new Date(billing.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>
            </p>
          </div>
        )}

        <Link
          href="/billing"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-black text-white px-3 text-sm font-medium hover:bg-[#1C1C1E] transition-colors"
        >
          <Zap className="h-3.5 w-3.5" />
          Manage billing
        </Link>
      </div>

      <div className="border-t border-[#F0F0EE]" />

      {/* Danger zone */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#8C8C8C] uppercase tracking-widest">Danger zone</p>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 mb-1">Delete organization</p>
              <p className="text-sm text-red-800 mb-3">
                Permanently delete this organization and all associated passports, QR codes, and team members. This action cannot be undone.
              </p>
              <a
                href="mailto:hello@knownobjects.io?subject=Delete%20organization%20request"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 text-white px-3 text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
