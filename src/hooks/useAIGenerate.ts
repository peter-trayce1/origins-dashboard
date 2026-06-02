"use client";

import { useState, useCallback } from "react";

interface AIGenerateOptions {
  productDescription: string;
  brandContext?: string;
  passportId?: string;
  fieldsToGenerate?: string[];
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export function useAIGenerate() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawOutput, setRawOutput] = useState("");
  const [parsedOutput, setParsedOutput] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (options: AIGenerateOptions) => {
    setIsGenerating(true);
    setRawOutput("");
    setParsedOutput(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: options.productDescription,
          brandContext: options.brandContext,
          passportId: options.passportId,
          fieldsToGenerate: options.fieldsToGenerate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setRawOutput(accumulated);
        options.onChunk?.(chunk);
      }

      // Try to parse JSON from the response
      const jsonMatch = accumulated.match(/```json\n?([\s\S]*?)\n?```/) ??
        accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
          setParsedOutput(json);
          options.onComplete?.(accumulated);
        } catch {
          setParsedOutput(null);
        }
      }

      options.onComplete?.(accumulated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      options.onError?.(msg);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  function reset() {
    setRawOutput("");
    setParsedOutput(null);
    setError(null);
  }

  return { generate, isGenerating, rawOutput, parsedOutput, error, reset };
}
