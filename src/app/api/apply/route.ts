import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendApplicationReceived } from "@/lib/email";

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function makeUniqueOrgSlug(base: string, checkExists: (slug: string) => Promise<boolean>): Promise<string> {
  let i = 0;
  while (true) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    if (!(await checkExists(candidate))) return candidate;
    i++;
  }
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const body = await request.json();
  const {
    full_name,
    email,
    password,
    job_title,
    brand_name,
    website,
    country,
    expected_passport_volume,
    plan_interest,
  } = body;

  // Basic server-side validation
  if (!full_name || !email || !password || !brand_name || !website || !country) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user.id;

  try {
    // 2. Create organisation (status: pending)
    const slug = await makeUniqueOrgSlug(makeSlug(brand_name), async (s) => {
      const { data } = await supabase.from("organisations").select("id").eq("slug", s).maybeSingle();
      return Boolean(data);
    });

    const { data: org, error: orgError } = await supabase
      .from("organisations")
      .insert({
        name: brand_name,
        slug,
        organisation_status: "pending",
        billing_plan: "none",
        billing_status: "none",
        passport_limit: 0,
        website,
        country,
        job_title:                job_title ?? null,
        expected_passport_volume: expected_passport_volume ?? null,
        plan_interest:            plan_interest ?? null,
      })
      .select("id")
      .single();

    if (orgError || !org) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
    }

    // 3. Create brand (mirrors org)
    await supabase.from("brands").insert({
      organisation_id: org.id,
      name: brand_name,
      slug,
    });

    // 4. Create organisation member
    await supabase.from("organisation_members").insert({
      user_id: userId,
      organisation_id: org.id,
      role: "admin",
      accepted_at: new Date().toISOString(),
    });

    // 5. Send confirmation email (non-blocking)
    sendApplicationReceived({ to: email, fullName: full_name, brandName: brand_name }).catch(console.error);

    return NextResponse.json({
      success: true,
      brand_name,
      website,
      plan_interest: plan_interest ?? null,
      expected_passport_volume: expected_passport_volume ?? null,
    });
  } catch (err) {
    // Roll back auth user if workspace setup fails
    await supabase.auth.admin.deleteUser(userId);
    console.error("[apply] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
