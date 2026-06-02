import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  // Service role bypasses RLS — needed for unauthenticated supplier submissions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  const { data: scr } = await supabase
    .from("supply_chain_requests")
    .select("id, status")
    .eq("request_code", code)
    .neq("status", "draft")
    .single();

  if (!scr) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (scr.status === "expired" || scr.status === "completed") {
    return NextResponse.json({ error: "This request is no longer accepting responses" }, { status: 410 });
  }

  const body = await request.json();
  const { response_data } = body;
  if (!response_data || typeof response_data !== "object") {
    return NextResponse.json({ error: "response_data required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("supply_chain_requests")
    .update({
      response_data,
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", scr.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
