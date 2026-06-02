import { generatePassportContentAnthropic, type AIGenerateRequest } from "./anthropic";
import { generatePassportContentOpenAI } from "./openai";

export type { AIGenerateRequest };

export function generatePassportContent(request: AIGenerateRequest): AsyncGenerator<string> {
  const provider = process.env.AI_PROVIDER ?? "anthropic";
  if (provider === "openai") {
    return generatePassportContentOpenAI(request);
  }
  return generatePassportContentAnthropic(request);
}
