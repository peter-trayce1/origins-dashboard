import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Public endpoint: the Origins marketing website posts demo requests here.
// Allowed origin is configurable; defaults to "*" so any marketing form works.
const ALLOWED_ORIGIN = process.env.MARKETING_SITE_ORIGIN || "*";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500, headers: corsHeaders() });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders() });
  }

  // Accept a few common field-name variants so the marketing form is flexible
  const email = String(body.email ?? "").trim();
  const fullName = String(body.full_name ?? body.name ?? "").trim();
  const company = String(body.company ?? body.brand_name ?? body.brand ?? "").trim();
  const jobTitle = String(body.job_title ?? body.role ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const website = String(body.website ?? "").trim();
  const message = String(body.message ?? body.notes ?? "").trim();
  const source = String(body.source ?? "marketing_site").trim();

  // Honeypot: if a hidden field is filled, silently accept and drop (bot)
  if (body.hp_field) {
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400, headers: corsHeaders() });
  }

  const supabase = createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("demo_requests") as any).insert({
    email,
    full_name: fullName || null,
    company: company || null,
    job_title: jobTitle || null,
    phone: phone || null,
    website: website || null,
    message: message || null,
    source: source || "marketing_site",
  });

  if (error) {
    console.error("[demo-request] insert failed:", error.message);
    return NextResponse.json({ error: "Could not submit request" }, { status: 500, headers: corsHeaders() });
  }

  return NextResponse.json({ success: true }, { headers: corsHeaders() });
}
