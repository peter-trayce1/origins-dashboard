import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendWorkspaceApproved } from "@/lib/email";
import { isSuperAdmin } from "@/lib/super-admin";

function generateTempPassword(): string {
  // 14-char alphanumeric — no ambiguous chars (0/O, 1/l/I)
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return adminEmails.some((e) => e && e === email.toLowerCase());
}

// Generate a fresh temp password, set it on the org's owner, and email the
// approval/credentials. Returns whether the email actually sent so the caller
// can surface failures (rather than silently swallowing them).
async function issueCredentialsAndEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  serviceSupabase: any,
  orgId: string,
  brandName: string,
  opts?: { onlyIfNeedsSetup?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const { data: members } = await serviceSupabase
    .from("organisation_members")
    .select("user_id")
    .eq("organisation_id", orgId)
    .limit(1);

  const userId = members?.[0]?.user_id;
  if (!userId) return { ok: false, error: "No member found for this workspace" };

  const { data: authUser } = await serviceSupabase.auth.admin.getUserById(userId);
  if (!authUser?.user?.email) return { ok: false, error: "No email on the account" };

  // Don't reset the password of someone who has already completed setup
  if (opts?.onlyIfNeedsSetup && authUser.user.user_metadata?.must_change_password === false) {
    return { ok: false, error: "This user has already set their own password — ask them to use 'Forgot password' instead." };
  }

  const tempPassword = generateTempPassword();
  await serviceSupabase.auth.admin.updateUserById(userId, {
    password:      tempPassword,
    user_metadata: { ...authUser.user.user_metadata, must_change_password: true },
  });

  return sendWorkspaceApproved({
    to:        authUser.user.email,
    fullName:  authUser.user.user_metadata?.full_name ?? "",
    brandName,
    tempPassword,
    loginUrl:  `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.knownobjects.io"}/login`,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isAdminEmail(user.email ?? "") && !await isSuperAdmin(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await request.json();
  if (!["approve", "reject", "suspend", "resend"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  if (action === "approve") {
    // Trial dates left null — clock starts on first dashboard login.
    const { data: org, error } = await serviceSupabase
      .from("organisations")
      .update({
        organisation_status: "approved",
        billing_plan:        "trial",
        billing_status:      "trialing",
        passport_limit:      3,
        trial_start_date:    null,
        trial_end_date:      null,
        current_period_end:  null,
      })
      .eq("id", id)
      .select("name")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Generate a temp password, set it on the account, and email it — awaited so
    // we can tell the admin if the email failed instead of silently swallowing it.
    const emailResult = await issueCredentialsAndEmail(serviceSupabase, id, org.name);

    return NextResponse.json({
      success:    true,
      action:     "approved",
      emailSent:  emailResult.ok,
      emailError: emailResult.error,
    });
  }

  if (action === "resend") {
    const { data: org, error } = await serviceSupabase
      .from("organisations")
      .select("name, organisation_status")
      .eq("id", id)
      .single();

    if (error || !org) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    if (org.organisation_status !== "approved") {
      return NextResponse.json({ error: "Only approved workspaces can have their email re-sent" }, { status: 400 });
    }

    const emailResult = await issueCredentialsAndEmail(serviceSupabase, id, org.name, { onlyIfNeedsSetup: true });

    if (!emailResult.ok) {
      return NextResponse.json({ error: emailResult.error ?? "Email failed" }, { status: 502 });
    }
    return NextResponse.json({ success: true, action: "resent", emailSent: true });
  }

  if (action === "reject") {
    const { error } = await serviceSupabase
      .from("organisations")
      .update({ organisation_status: "suspended" })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: "rejected" });
  }

  if (action === "suspend") {
    const { error } = await serviceSupabase
      .from("organisations")
      .update({ organisation_status: "suspended", billing_status: "cancelled" })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action: "suspended" });
  }
}
