import Anthropic from "@anthropic-ai/sdk";
import { PASSPORT_GENERATION_PROMPT } from "./prompts";

export interface AIGenerateRequest {
  productDescription: string;
  brandContext?: string;
  existingData?: Record<string, unknown>;
  fieldsToGenerate?: string[];
}

export interface AIGenerateResponse {
  [key: string]: string | undefined;
}

export async function* generatePassportContentAnthropic(
  request: AIGenerateRequest
): AsyncGenerator<string> {
  const userMessage = [
    request.brandContext ? `Brand context: ${request.brandContext}` : "",
    `Product description: ${request.productDescription}`,
    request.existingData ? `Existing data: ${JSON.stringify(request.existingData, null, 2)}` : "",
    request.fieldsToGenerate?.length
      ? `Generate only these fields: ${request.fieldsToGenerate.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: PASSPORT_GENERATION_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
