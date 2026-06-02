import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getOrganisationBilling, getActivePassportCount } from "@/lib/billing";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let usageInfo: {
    used: number;
    limit: number | null;
    isTrial: boolean;
    daysRemaining: number | null;
    trialEndDate: string | null;
  } | null = null;

  try {
    const { data: member } = await supabase
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .limit(1)
      .maybeSingle();

    if (!member) redirect("/apply");

    // Use service client to check org status (bypasses RLS)
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orgRow } = await (service as any)
      .from("organisations")
      .select("organisation_status, trial_end_date")
      .eq("id", member.organisation_id)
      .maybeSingle();

    if (orgRow?.organisation_status === "pending")   redirect("/pending");
    if (orgRow?.organisation_status === "suspended") redirect("/pending");

    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("organisation_id", member.organisation_id)
      .limit(1)
      .maybeSingle();

    if (brand) {
      const [billing, used] = await Promise.all([
        getOrganisationBilling(member.organisation_id),
        getActivePassportCount(brand.id),
      ]);

      const isTrial      = billing.billingPlan === "trial";
      const trialEndDate = (orgRow?.trial_end_date as string | null) ?? null;
      const daysRemaining = trialEndDate
        ? Math.max(0, Math.ceil((new Date(trialEndDate).getTime() - Date.now()) / 86_400_000))
        : null;

      if (billing.passportLimit !== null && billing.passportLimit > 0) {
        usageInfo = { used, limit: billing.passportLimit, isTrial, daysRemaining, trialEndDate };
      } else if (isTrial) {
        usageInfo = { used, limit: 3, isTrial, daysRemaining, trialEndDate };
      }
    }
  } catch (err) {
    // If any org/billing query fails, render the layout without usage info
    // rather than crashing every dashboard page.
    console.error("[DashboardLayout] non-fatal error:", err);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F8]">
      <Sidebar usageInfo={usageInfo} />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Topbar />
        <main className="flex-1 px-4 lg:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
