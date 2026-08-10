import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  console.log(`[/c/[code]] Resolving passport code: ${code}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Primary lookup — exact match on whatever code was scanned.
  // Use .maybeSingle() instead of .single() because missing row is an expected condition
  // that we handle with the fallback lookup. .single() would throw an error.
  const { data: exactData, error: exactError } = await supabase
    .from("passports")
    .select("slug, status, product_name")
    .eq("passport_code", code)
    .maybeSingle();

  console.log(`[/c/[code]] Exact lookup (${code}):`, {
    foundRow: !!exactData,
    error: exactError ? exactError.message : null,
    data: exactData ? {
      status: exactData.status,
      slug: exactData.slug,
      product_name: exactData.product_name,
    } : null,
  });

  let data = exactData;

  // Backwards-compatibility for legacy ORI- QR codes that are already printed
  // and in the wild. The DB now stores KO-XXXXXXXX, but the physical label still
  // encodes /c/ORI-XXXXXXXX. We silently resolve it to the KO- equivalent so the
  // QR continues working without any URL change visible to the end user.
  if (!data && code.startsWith("ORI-")) {
    const koCode = "KO-" + code.slice(4); // "ORI-12345678" → "KO-12345678"
    console.log(`[/c/[code]] Fallback: Converting ${code} → ${koCode}`);

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("passports")
      .select("slug, status, product_name")
      .eq("passport_code", koCode)
      .maybeSingle();

    console.log(`[/c/[code]] Fallback lookup (${koCode}):`, {
      foundRow: !!fallbackData,
      error: fallbackError ? fallbackError.message : null,
      data: fallbackData ? {
        status: fallbackData.status,
        slug: fallbackData.slug,
        product_name: fallbackData.product_name,
      } : null,
    });

    data = fallbackData;
  }

  if (!data) {
    console.log(`[/c/[code]] No passport found for ${code}, redirecting to /`);
    redirect("/");
  }

  console.log(`[/c/[code]] Resolved passport:`, {
    code,
    status: data.status,
    slug: data.slug,
  });

  if (data.status === "published" && data.slug) {
    console.log(`[/c/[code]] Passport is published, redirecting to public domain`);
    const publicPassportUrl = process.env.NEXT_PUBLIC_PUBLIC_PASSPORT_URL ?? "https://passport.knownobjects.io";
    redirect(`${publicPassportUrl}/p/${data.slug}`);
  }

  console.log(`[/c/[code]] Passport status is "${data.status}" (not "published"), showing holding page`);

  // Draft — return a simple branded holding page
  const name = data.product_name ? `<strong>${data.product_name}</strong>` : "This product";
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Coming soon — Known Objects</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           background: #fdfaf7; color: #333; display: flex; flex-direction: column;
           align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center; }
    .code { font-family: monospace; font-size: 12px; color: #8c8c8c;
            background: #f4f4f2; border: 1px solid #e8e8e6; padding: 4px 10px;
            border-radius: 6px; display: inline-block; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 500; margin-bottom: 8px; }
    p { font-size: 14px; color: #666; line-height: 1.6; max-width: 320px; }
    .badge { font-size: 10px; font-family: monospace; letter-spacing: 0.1em;
             text-transform: uppercase; color: #8c8c8c; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="code">${code}</div>
  <h1>${name}'s passport is coming soon.</h1>
  <p>The brand is still preparing this product's digital passport. Check back soon.</p>
  <div class="badge">Powered by Known Objects</div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
