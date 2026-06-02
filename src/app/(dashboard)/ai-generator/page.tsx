"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAIGenerate } from "@/hooks/useAIGenerate";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check, ArrowRight, AlertCircle } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  product_description: "Product description",
  sustainability_summary: "Sustainability summary",
  product_story: "Product story",
  maker_story: "Maker story",
  design_notes: "Design notes",
  consumer_transparency_summary: "Transparency summary",
  brand_impact_statement: "Brand impact statement",
};

export default function AIGeneratorPage() {
  const router = useRouter();
  const [productDescription, setProductDescription] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const { generate, isGenerating, parsedOutput, rawOutput, error, reset } = useAIGenerate();

  async function handleGenerate() {
    if (!productDescription.trim()) {
      toast.error("Please describe your product first");
      return;
    }
    await generate({ productDescription });
  }

  function copyField(key: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${FIELD_LABELS[key] ?? key} copied`);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="AI content generator"
        description="Describe your product and let AI draft passport content. All output is marked as AI-suggested — review and edit before publishing."
      />

      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>AI-generated content requires verification.</strong> The AI will not fabricate specific facts, but you should review all output for accuracy before publishing. Claims about certifications, materials, or environmental data must be verified by your team.
        </div>
      </div>

      <div className="border border-[#E8E8E6] rounded-xl p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Describe your product</Label>
          <Textarea
            rows={6}
            placeholder="e.g. A women's relaxed-fit shirt made from 100% Belgian linen, manufactured at a family-run factory in northern Portugal. The linen is OEKO-TEX certified. Designed for warm weather and intended to last 10+ years. The shirt features a slightly oversized silhouette, mother-of-pearl buttons, and a raw hem finish…"
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
          />
          <p className="text-xs text-[#8C8C8C]">
            The more detail you provide, the better the output. Include materials, origin, manufacturing, and any certifications you hold.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleGenerate} disabled={isGenerating || !productDescription.trim()}>
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Generate content</>
            )}
          </Button>
          {(parsedOutput || rawOutput) && (
            <Button variant="outline" onClick={reset}>Start over</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isGenerating && !parsedOutput && (
        <div className="border border-[#E8E8E6] rounded-xl p-5">
          <p className="text-sm text-[#525252] font-mono whitespace-pre-wrap leading-relaxed">
            {rawOutput || <span className="animate-pulse">Thinking…</span>}
          </p>
        </div>
      )}

      {parsedOutput && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-black">Generated content</p>
            <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
              AI suggested — verify before publishing
            </span>
          </div>

          {Object.entries(parsedOutput).map(([key, value]) => (
            <div key={key} className="border border-[#E8E8E6] rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-[#525252] uppercase tracking-wide">
                  {FIELD_LABELS[key] ?? key}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyField(key, value)}
                >
                  {copied === key ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-[#0A0A0A] leading-relaxed whitespace-pre-wrap">{value}</p>
            </div>
          ))}

          <div className="pt-2">
            <p className="text-xs text-[#8C8C8C] mb-3">
              Copy individual fields above, then paste them into your passport wizard. Content is marked as AI-suggested and can be edited at any time.
            </p>
            <Button variant="outline" onClick={() => router.push("/passports/new")}>
              <ArrowRight className="h-4 w-4 mr-1.5" />
              Create a new passport
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
