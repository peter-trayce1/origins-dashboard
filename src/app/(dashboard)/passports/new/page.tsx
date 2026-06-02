import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PassportBuilderShell } from "@/components/passport/builder/PassportBuilderShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create passport" };

export default async function NewPassportPage() {
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
    .select("id, name, sustainability_story")
    .eq("organisation_id", member.organisation_id)
    .limit(1)
    .single();

  if (!brand) redirect("/onboarding");

  return <PassportBuilderShell brandId={brand.id} brandName={brand.name} brandStory={brand.sustainability_story ?? ""} />;
}
