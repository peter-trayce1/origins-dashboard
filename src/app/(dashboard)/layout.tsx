import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getOrganisationBilling, getActivePassportCount } from "@/lib/billing";
import { isSuperAdmin } from "@/lib/super-admin";

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

  // Super admins bypass all org/billing checks — they have no organisation.
  const superAdmin = await isSuperAdmin(user.id);

  if (!superAdmin) {
    // Redirects must be outside try/catch — Next.js redirect() throws internally
    // and a catch block will swallow it, breaking the page.
    const { data: member } = await supabase
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .limit(1)
      .maybeSingle();

    if (!member) redirect("/apply");

    // Check org status — if this fails for any reason, skip the status check
    // rather than crashing the entire layout with a 500.
    let orgStatus: string | null = null;
    let trialEndDate: string | null = null;
    let onboardingCompleted = false;

    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (serviceKey && supabaseUrl) {
        const service = createServiceClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: orgRow } = await (service as any)
          .from("organisations")
          .select("organisation_status, trial_end_date, onboarding_completed")
          .eq("id", member.organisation_id)
          .maybeSingle();

        orgStatus = (orgRow?.organisation_status as string) ?? null;
        trialEndDate = (orgRow?.trial_end_date as string) ?? null;
        onboardingCompleted = (orgRow?.onboarding_completed as boolean) ?? false;
      }
    } catch (err) {
      console.error("[DashboardLayout] org status check failed:", err);
    }

    if (orgStatus === "pending")   redirect("/pending");
    if (orgStatus === "suspended") redirect("/pending");

    // Route approved users through brand setup wizard on first login
    if (orgStatus === "approved" && !onboardingCompleted) redirect("/onboarding");

    // Start the 14-day trial on first login if not yet started
    if (orgStatus === "approved") {
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (serviceKey && supabaseUrl) {
          const service = createServiceClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: billingRow } = await (service as any)
            .from("organisations")
            .select("billing_plan, trial_start_date")
            .eq("id", member.organisation_id)
            .maybeSingle();

          if (billingRow?.billing_plan === "trial" && !billingRow?.trial_start_date) {
            const trialStart = new Date();
            const trialEnd   = new Date(trialStart);
            trialEnd.setDate(trialEnd.getDate() + 14);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (service as any)
              .from("organisations")
              .update({
                trial_start_date:   trialStart.toISOString(),
                trial_end_date:     trialEnd.toISOString(),
                current_period_end: trialEnd.toISOString(),
              })
              .eq("id", member.organisation_id);
            trialEndDate = trialEnd.toISOString();
          }
        }
      } catch (err) {
        console.error("[DashboardLayout] trial activation failed:", err);
      }
    }

    // Non-critical: billing/usage
    try {
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

        const isTrial = billing.billingPlan === "trial";
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
      console.error("[DashboardLayout] billing query failed:", err);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F8]">
      <Sidebar usageInfo={usageInfo} isSuperAdmin={superAdmin} />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Topbar />
        <main className="flex-1 px-4 lg:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
