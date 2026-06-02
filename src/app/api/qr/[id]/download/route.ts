export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQR, generateQRSvg } from "@/lib/qr/generate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "png"; // png | svg
  const size = parseInt(request.nextUrl.searchParams.get("size") ?? "400", 10);

  const supabase = await createClient();

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, target_url, label, passports(slug, product_name)")
    .eq("id", id)
    .single();

  if (!qr) return NextResponse.json({ error: "QR code not found" }, { status: 404 });

  const passport = qr.passports as unknown as { slug: string; product_name: string } | null;
  const filename = passport?.product_name
    ? `${passport.product_name.toLowerCase().replace(/\s+/g, "-")}-qr`
    : "passport-qr";

  if (format === "svg") {
    const svg = await generateQRSvg(qr.target_url, size);
    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${filename}.svg"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const { pngBuffer } = await generateQR({ url: qr.target_url, size });
  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
