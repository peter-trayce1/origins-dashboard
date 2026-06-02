import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePassportContent } from "@/lib/ai";
import { aiGenerateSchema } from "@/schemas/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = aiGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { productDescription, brandContext, passportId, fieldsToGenerate } = parsed.data;

  // Get brand context if not provided
  let resolvedBrandContext = brandContext;
  if (!resolvedBrandContext) {
    const { data: member } = await supabase
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null)
      .single();

    if (member) {
      const { data: brand } = await supabase
        .from("brands")
        .select("name, sustainability_story")
        .eq("organisation_id", member.organisation_id)
        .single();
      if (brand) {
        resolvedBrandContext = [brand.name, brand.sustainability_story].filter(Boolean).join(". ");
      }
    }
  }

  // Log usage
  if (passportId) {
    supabase.from("ai_generation_logs").insert({
      user_id: user.id,
      passport_id: passportId,
      provider: process.env.AI_PROVIDER ?? "anthropic",
      model: process.env.AI_PROVIDER === "openai" ? "gpt-4o" : "claude-sonnet-4-6",
      input_text: productDescription,
    });
  }

  const generator = generatePassportContent({
    productDescription,
    brandContext: resolvedBrandContext,
    fieldsToGenerate,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}
