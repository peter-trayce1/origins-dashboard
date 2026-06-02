import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateCompleteness } from "@/lib/completeness";
import { canPublishPassport } from "@/lib/billing";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const action: "publish" | "unpublish" | "archive" = body.action ?? "publish";

  const { data: fullPassport } = await supabase
    .from("passports")
    .select(`
      *,
      product_materials(id),
      product_facilities(id),
      product_certifications(id),
      care_instructions(id),
      circularity_actions(id)
    `)
    .eq("id", id)
    .single();

  if (!fullPassport) return NextResponse.json({ error: "Passport not found" }, { status: 404 });

  if (action === "publish") {
    const completeness = calculateCompleteness(fullPassport as unknown as Parameters<typeof calculateCompleteness>[0]);
    if (completeness.score < 40 || !fullPassport.product_name) {
      return NextResponse.json(
        { error: "Passport needs more information before publishing", detail: completeness.detail },
        { status: 422 }
      );
    }

    // Billing limit check — only published passports count
    const { data: member } = await supabase
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .single();

    if (member) {
      const { data: brand } = await supabase
        .from("brands")
        .select("id")
        .eq("organisation_id", member.organisation_id)
        .single();

      if (brand) {
        const check = await canPublishPassport(member.organisation_id, brand.id);
        if (!check.allowed) {
          return NextResponse.json(
            {
              error: "BILLING_LIMIT_REACHED",
              plan: check.plan,
              limit: check.limit,
              current: check.current,
            },
            { status: 402 }
          );
        }
      }
    }
  }

  const updates =
    action === "publish"
      ? { status: "published" as const, published_at: new Date().toISOString() }
      : action === "archive"
      ? { status: "archived" as const }
      : { status: "draft" as const, published_at: null };

  const { data, error } = await supabase
    .from("passports")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: `passport.${action}ed`,
    resource_type: "passport",
    resource_id: id,
  });

  return NextResponse.json(data);
}
