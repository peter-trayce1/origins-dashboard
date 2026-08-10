import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data } = await supabase
    .from("passports")
    .select("slug, status, product_name")
    .eq("passport_code", code)
    .single();

  if (!data) redirect("/");

  if (data.status === "published" && data.slug) {
    redirect(`/p/${data.slug}`);
  }

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
