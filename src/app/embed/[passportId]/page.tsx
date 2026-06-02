import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmbedBadge } from "@/components/embed/EmbedBadge";
import { EmbedCard } from "@/components/embed/EmbedCard";
import { EmbedFull } from "@/components/embed/EmbedFull";
import { EmbedSustainability } from "@/components/embed/EmbedSustainability";

type EmbedType = "badge" | "card" | "full" | "sustainability";

async function getPassport(passportId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("passports")
    .select(`
      *,
      brands(id, name, logo_url, primary_colour),
      product_materials(*),
      product_certifications(*),
      care_instructions(*),
      circularity_actions(*),
      impact_metrics(*)
    `)
    .eq("id", passportId)
    .eq("status", "published")
    .single();
  return data;
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ passportId: string }>;
  searchParams: Promise<{ type?: string; theme?: string }>;
}) {
  const { passportId } = await params;
  const { type = "card", theme = "light" } = await searchParams;

  const passport = await getPassport(passportId);
  if (!passport) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://originsid.com";
  const publicUrl = `${appUrl}/p/${passport.slug}`;

  const embedType = (["badge", "card", "full", "sustainability"].includes(type) ? type : "card") as EmbedType;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', -apple-system, sans-serif; background: transparent; }
        `}</style>
      </head>
      <body>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {embedType === "badge" && <EmbedBadge passport={passport as any} publicUrl={publicUrl} theme={theme} />}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {embedType === "card" && <EmbedCard passport={passport as any} publicUrl={publicUrl} theme={theme} />}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {embedType === "full" && <EmbedFull passport={passport as any} publicUrl={publicUrl} theme={theme} />}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {embedType === "sustainability" && <EmbedSustainability passport={passport as any} publicUrl={publicUrl} theme={theme} />}
      </body>
    </html>
  );
}
