import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { email: string; full_name: string | null } | null }> };
        };
      };
    }).from("users").select("email, full_name").eq("id", user.id).maybeSingle();

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (err) {
    console.error("GET /api/account failed:", err);
    return NextResponse.json({ error: "Failed to fetch account details" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name } = body;

    if (typeof full_name !== "string" || full_name.trim().length === 0) {
      return NextResponse.json({ error: "Invalid full_name" }, { status: 400 });
    }

    const { error } = await (supabase as unknown as {
      from: (t: string) => {
        update: (d: object) => {
          eq: (k: string, v: string) => Promise<{ error: unknown }>;
        };
      };
    }).from("users").update({ full_name: full_name.trim() }).eq("id", user.id);

    if (error) {
      console.error("Failed to update full_name:", error);
      return NextResponse.json({ error: "Failed to update full name" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/account failed:", err);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
