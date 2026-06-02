import OpenAI from "openai";
import { PASSPORT_GENERATION_PROMPT } from "./prompts";
import type { AIGenerateRequest } from "./anthropic";

export async function* generatePassportContentOpenAI(
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

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [
      { role: "system", content: PASSPORT_GENERATION_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
