import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Set up your brand" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find the user's org (may already exist from the apply flow)
  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .maybeSingle();

  // If they have a completed org, send them straight to the dashboard
  if (member?.organisation_id) {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (service as any)
      .from("organisations")
      .select("onboarding_completed")
      .eq("id", member.organisation_id)
      .maybeSingle();

    if (org?.onboarding_completed) redirect("/dashboard");
  }

  // Load any existing brand data for pre-filling (apply-flow users already have a brand)
  let existingBrand: {
    name: string;
    website_url: string | null;
    logo_url: string | null;
    sustainability_story: string | null;
    industry: string | null;
    product_category: string | null;
    country: string | null;
  } | null = null;

  if (member?.organisation_id) {
    const { data: brand } = await supabase
      .from("brands")
      .select("name, website_url, logo_url, sustainability_story, industry, product_category, country")
      .eq("organisation_id", member.organisation_id)
      .limit(1)
      .maybeSingle();
    existingBrand = brand ?? null;
  }

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo-dark.png" alt="Known Objects" width={100} height={22} className="object-contain" style={{ height: 22, width: "auto" }} priority />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Set up your brand
          </h1>
          <p className="text-[#525252] mt-1.5 text-sm">
            Tell us about your brand to get started. This takes about 2 minutes.
          </p>
        </div>
        <OnboardingWizard existingBrand={existingBrand} hasExistingOrg={!!member?.organisation_id} />
      </div>
    </div>
  );
}
