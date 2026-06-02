import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PassportBuilderShell } from "@/components/passport/builder/PassportBuilderShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit passport" };

export default async function EditPassportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: passport } = await supabase
    .from("passports")
    .select("id, brand_id, product_name")
    .eq("id", id)
    .single();

  if (!passport) notFound();

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name, sustainability_story")
    .eq("id", passport.brand_id)
    .single();

  if (!brand) notFound();

  return (
    <PassportBuilderShell
      brandId={brand.id}
      brandName={brand.name}
      passportId={passport.id}
      brandStory={brand.sustainability_story ?? ""}
    />
  );
}
