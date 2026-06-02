import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendWorkspaceApproved } from "@/lib/email";

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  if (adminEmails.some((e) => e && e === email.toLowerCase())) return true;
  return email.toLowerCase().endsWith("@originsid.com");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !isAdmin(user.email)) {
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
    const trialStart = new Date();
    const trialEnd   = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { data: org, error } = await serviceSupabase
      .from("organisations")
      .update({
        organisation_status: "approved",
        billing_plan:        "trial",
        billing_status:      "trialing",
        passport_limit:      3,
        trial_start_date:    trialStart.toISOString(),
        trial_end_date:      trialEnd.toISOString(),
        current_period_end:  trialEnd.toISOString(),
      })
      .eq("id", id)
      .select("name")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send approval email
    const { data: members } = await serviceSupabase
      .from("organisation_members")
      .select("user_id")
      .eq("organisation_id", id)
      .limit(1);

    if (members?.[0]?.user_id) {
      const { data: authUser } = await serviceSupabase.auth.admin.getUserById(members[0].user_id);
      if (authUser?.user?.email) {
        const trialEndFormatted = trialEnd.toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric",
        });
        sendWorkspaceApproved({
          to:           authUser.user.email,
          fullName:     authUser.user.user_metadata?.full_name ?? "",
          brandName:    org.name,
          trialEndDate: trialEndFormatted,
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
