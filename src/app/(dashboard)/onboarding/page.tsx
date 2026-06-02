import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Set up your brand" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If already onboarded, redirect to dashboard
  const { data: member } = await supabase
    .from("organisation_members")
    .select("id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .single();

  if (member) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo-dark.png" alt="Origins" width={100} height={22} className="object-contain" style={{ height: 22, width: "auto" }} priority />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Set up your brand
          </h1>
          <p className="text-[#525252] mt-1.5 text-sm">
            Tell us about your brand to get started. This takes about 2 minutes.
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  );
}
