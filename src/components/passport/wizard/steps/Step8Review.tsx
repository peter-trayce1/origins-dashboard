"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  QrCode,
  Copy,
  Globe,
  Loader2,
} from "lucide-react";
import { CompletenessScore } from "@/components/shared/CompletenessScore";

interface ReviewData {
  completeness_score: number;
  completeness_detail: {
    required: { key: string; label: string; met: boolean; weight: number }[];
    recommended: { key: string; label: string; met: boolean; weight: number }[];
  };
  slug: string | null;
  status: string;
}

export function Step8Review({ passportId }: { passportId: string }) {
  const router = useRouter();
  const store = useWizardStore();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!passportId) return;
      const res = await fetch(`/api/passports/${passportId}`);
      if (res.ok) {
        const data = await res.json();
        setReviewData({
          completeness_score: data.completeness_score ?? 0,
          completeness_detail: data.completeness_detail ?? { required: [], recommended: [] },
          slug: data.slug,
          status: data.status,
        });
      }
      setIsLoading(false);
    }
    load();
  }, [passportId]);

  async function handlePublish() {
    setIsPublishing(true);
    const res = await fetch(`/api/passports/${passportId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });

    if (res.ok) {
      const data = await res.json();
      setReviewData((prev) => prev ? { ...prev, status: data.status } : null);
      toast.success("Passport published! Your product now has a live Digital Product Passport.");
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Failed to publish. Check required fields.");
    }
    setIsPublishing(false);
  }

  function copyUrl() {
    if (!reviewData?.slug) return;
    const url = `${window.location.origin}/p/${reviewData.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#8C8C8C]" />
      </div>
    );
  }

  const publicUrl = reviewData?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${reviewData.slug}`
    : null;

  const isPublished = reviewData?.status === "published";
  const score = reviewData?.completeness_score ?? 0;
  const canPublish = score >= 40;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-black">Review & publish</h2>
        <p className="text-sm text-[#525252] mt-0.5">
          Check your passport is complete, then publish it to generate a live public page and QR code.
        </p>
      </div>

      {/* Completeness */}
      <div className="border border-[#E8E8E6] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-black">Passport completeness</p>
            <p className="text-xs text-[#525252] mt-0.5">
              {score >= 90
                ? "Best-in-class — your passport is exceptional"
                : score >= 70
                ? "Ready to publish"
                : score >= 40
                ? "Good start — consider adding more detail"
                : "Needs more information before publishing"}
            </p>
          </div>
          <CompletenessScore score={score} size="lg" />
        </div>

        {/* Required fields */}
        <div>
          <p className="text-xs font-semibold text-[#525252] uppercase tracking-wide mb-2">Required fields</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {(reviewData?.completeness_detail?.required ?? []).map((field) => (
              <div key={field.key} className="flex items-center gap-2 text-sm">
                {field.met ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <span className={field.met ? "text-[#525252]" : "text-red-600 font-medium"}>
                  {field.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended fields */}
        <div>
          <p className="text-xs font-semibold text-[#525252] uppercase tracking-wide mb-2">Recommended fields</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {(reviewData?.completeness_detail?.recommended ?? []).map((field) => (
              <div key={field.key} className="flex items-center gap-2 text-sm">
                {field.met ? (
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-[#E8E8E6] shrink-0" />
                )}
                <span className={field.met ? "text-[#525252]" : "text-[#8C8C8C]"}>
                  {field.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Public URL */}
      {publicUrl && (
        <div className="border border-[#E8E8E6] rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-black">Public passport URL</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#F4F4F3] rounded-lg px-3 py-2 text-sm font-mono text-[#525252] overflow-hidden">
              <Globe className="h-3.5 w-3.5 shrink-0 text-[#8C8C8C]" />
              <span className="truncate">{publicUrl}</span>
            </div>
            <Button variant="outline" size="sm" onClick={copyUrl}>
              {copied ? "Copied!" : <><Copy className="h-3.5 w-3.5 mr-1" />Copy</>}
            </Button>
            {isPublished && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-black hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border border-[#E8E8E6] rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-black">Next steps</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href={`/passports/${passportId}/qr`}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-[#E8E8E6] hover:border-black/30 transition-colors"
          >
            <QrCode className="h-5 w-5 text-[#525252]" />
            <div>
              <p className="text-sm font-medium text-black">Generate QR code</p>
              <p className="text-xs text-[#8C8C8C]">Download for swing tags</p>
            </div>
          </Link>
          {isPublished && publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-lg border border-[#E8E8E6] hover:border-black/30 transition-colors"
            >
              <ExternalLink className="h-5 w-5 text-[#525252]" />
              <div>
                <p className="text-sm font-medium text-black">View public passport</p>
                <p className="text-xs text-[#8C8C8C]">See how customers see it</p>
              </div>
            </a>
          )}
          <Link
            href="/passports"
            className="flex items-center gap-2.5 p-3 rounded-lg border border-[#E8E8E6] hover:border-black/30 transition-colors"
          >
            <Globe className="h-5 w-5 text-[#525252]" />
            <div>
              <p className="text-sm font-medium text-black">All passports</p>
              <p className="text-xs text-[#8C8C8C]">Back to passport list</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Publish button */}
      <div className="flex items-center gap-3 justify-end pt-2">
        <Link
          href="/passports"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E8E8E6] bg-background px-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
        >
          Save draft &amp; exit
        </Link>
        {isPublished ? (
          <Button variant="outline" className="text-green-700 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Published
          </Button>
        ) : (
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !canPublish}
          >
            {isPublishing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing…</>
            ) : (
              "Publish passport"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
