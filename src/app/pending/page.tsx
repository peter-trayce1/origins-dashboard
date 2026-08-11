import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Workspace under review — Known Objects" };

const PLAN_LABELS: Record<string, string> = {
  essentials: "Essentials (£150/month)",
  growth:     "Growth (£450/month)",
  enterprise: "Enterprise",
  guidance:   "I'd like guidance",
};

const VOLUME_LABELS: Record<string, string> = {
  "up-to-250": "Up to 250 styles / year",
  "250-750":   "250–750 styles / year",
  "750-plus":  "750+ styles / year",
  "not-sure":  "Not sure yet",
};

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load the user's org via service client to read billing fields
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: member } = await service
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .maybeSingle();

  if (!member) redirect("/apply");

  const { data: org } = await (service as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: Record<string, unknown> | null }> };
      };
    };
  }).from("organisations")
    .select("name, website, organisation_status, plan_interest, expected_passport_volume, created_at")
    .eq("id", member.organisation_id)
    .maybeSingle();

  if (!org) redirect("/apply");

  // If approved, let them into the dashboard
  if (org.organisation_status === "approved") redirect("/dashboard");

  const onboardingUrl = process.env.NEXT_PUBLIC_ONBOARDING_URL ?? "";
  const appliedAt = org.created_at
    ? new Date(org.created_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const planLabel   = PLAN_LABELS[(org.plan_interest   as string) ?? ""] ?? (org.plan_interest as string) ?? "—";
  const volumeLabel = VOLUME_LABELS[(org.expected_passport_volume as string) ?? ""] ?? (org.expected_passport_volume as string) ?? "—";

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <Image src="/logo-dark.png" alt="Known Objects" width={110} height={24} style={{ height: 24, width: "auto" }} priority />
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E8E6] p-8 space-y-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>

          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-black mb-2">Workspace under review</h1>
            <p className="text-[14px] text-[#525252] leading-relaxed">
              We're currently reviewing your application. Most workspaces are approved within
              one business day. We'll notify you as soon as your workspace is activated.
            </p>
          </div>

          <div className="border border-[#F0F0EE] rounded-xl p-4 space-y-3">
            {[
              ["Brand",              org.name as string],
              ["Applied",            appliedAt],
              ["Plan interest",      planLabel],
              ["Passport volume",    volumeLabel],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-4">
                <span className="text-[12px] text-[#8C8C8C] w-32 shrink-0 pt-0.5">{label}</span>
                <span className="text-[13px] text-black font-medium">{value ?? "—"}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {onboardingUrl && (
              <a
                href={onboardingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl bg-black text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#1C1C1E] transition-colors"
              >
                Book onboarding call
              </a>
            )}
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full h-11 rounded-xl border border-[#E8E8E6] text-[13px] font-medium text-[#525252] flex items-center justify-center hover:bg-[#F7F6F4] transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[12px] text-[#8C8C8C] mt-6">
          Questions?{" "}
          <a href="mailto:hello@knownobjects.io" className="underline hover:text-black">Contact our team</a>
        </p>
      </div>
    </div>
  );
}
