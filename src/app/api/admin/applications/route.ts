import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  if (adminEmails.some((e) => e && e === email.toLowerCase())) return true;
  return email.toLowerCase().endsWith("@originsid.com");
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch pending/all applications with applicant info via organisation_members → auth.users
  const { data, error } = await serviceSupabase
    .from("organisations")
    .select(`
      id, name, slug, website, country, organisation_status,
      expected_passport_volume, plan_interest, job_title,
      created_at, trial_start_date, trial_end_date,
      organisation_members(
        user_id, role, accepted_at
      )
    `)
    .in("organisation_status", ["pending", "approved", "suspended"])
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with auth user data for each application
  const enriched = await Promise.all(
    (data ?? []).map(async (org) => {
      const member = (org.organisation_members as { user_id: string }[])?.[0];
      let applicantName = "—";
      let applicantEmail = "—";

      if (member?.user_id) {
        const { data: authUser } = await serviceSupabase.auth.admin.getUserById(member.user_id);
        applicantName  = authUser?.user?.user_metadata?.full_name ?? "—";
        applicantEmail = authUser?.user?.email ?? "—";
      }

      return {
        id:                       org.id,
        brand_name:               org.name,
        website:                  org.website,
        country:                  org.country,
        status:                   org.organisation_status,
        expected_passport_volume: org.expected_passport_volume,
        plan_interest:            org.plan_interest,
        job_title:                org.job_title,
        applied_at:               org.created_at,
        trial_start_date:         org.trial_start_date,
        trial_end_date:           org.trial_end_date,
        applicant_name:           applicantName,
        applicant_email:          applicantEmail,
      };
    })
  );

  return NextResponse.json(enriched);
}
