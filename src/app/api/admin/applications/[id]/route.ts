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
  if (!["approve", "reject", "suspend"].includes(action)) {
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

    // Generate a temporary password, set it on the account, and email it.
    const { data: members } = await serviceSupabase
      .from("organisation_members")
      .select("user_id")
      .eq("organisation_id", id)
      .limit(1);

    if (members?.[0]?.user_id) {
      const { data: authUser } = await serviceSupabase.auth.admin.getUserById(members[0].user_id);
      if (authUser?.user?.email) {
        const tempPassword = generateTempPassword();

        // Set the temporary password and keep the must_change_password flag
        await serviceSupabase.auth.admin.updateUserById(members[0].user_id, {
          password:      tempPassword,
          user_metadata: {
            ...authUser.user.user_metadata,
            must_change_password: true,
          },
        });

        sendWorkspaceApproved({
          to:           authUser.user.email,
          fullName:     authUser.user.user_metadata?.full_name ?? "",
          brandName:    org.name,
          tempPassword,
          loginUrl:     `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.origins-id.com"}/login`,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, action: "approved" });
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
