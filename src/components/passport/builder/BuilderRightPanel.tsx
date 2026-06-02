"use client";

import { useState, useEffect } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { Download, Link2, ExternalLink, Share2, Copy, Sparkles, Loader2, QrCode, Send } from "lucide-react";
import { toast } from "sonner";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import type { BuilderSection } from "./BuilderNavSidebar";

// ── Strength computation ──────────────────────────────────────────────────────

function computeScore(store: ReturnType<typeof useWizardStore.getState>): number {
  const { step1: s1, step2: s2, step3: s3, step4: s4, step5: s5, step6: s6, step7: s7 } = store;
  let pts = 0;
  if (s1.product_name)             pts += 10;
  if (s1.primary_image_url)        pts += 8;
  if (s1.product_description)      pts += 7;
  if (s1.category)                 pts += 5;
  if (s2.materials.length)         pts += 15;
  if (s3.facilities.length)        pts += 10;
  if (s3.facilities.length >= 2)   pts += 5;
  if (s4.sustainability_summary)   pts += 5;
  if (s4.sustainability_claims.length) pts += 5;
  if (s4.carbon_footprint_kg !== "") pts += 5;
  if (s5.certifications.length)    pts += 10;
  if (s6.care_instructions.length) pts += 5;
  if (s7.product_story)            pts += 5;
  if (s7.maker_story || s7.design_notes) pts += 5;
  return Math.min(pts, 100);
}

type StrengthLabel = "Getting started" | "Building up" | "Strong" | "Trusted" | "Best-in-class";

function getStrength(score: number): { label: StrengthLabel; color: string; stroke: string } {
  if (score >= 81) return { label: "Best-in-class", color: "text-emerald-700", stroke: "#10B981" };
  if (score >= 61) return { label: "Trusted",       color: "text-blue-700",   stroke: "#3B82F6" };
  if (score >= 41) return { label: "Strong",         color: "text-violet-700", stroke: "#8B5CF6" };
  if (score >= 21) return { label: "Building up",    color: "text-amber-700",  stroke: "#F59E0B" };
  return             { label: "Getting started",   color: "text-[#8C8C8C]", stroke: "#E8E8E6" };
}

function getWeakestSection(store: ReturnType<typeof useWizardStore.getState>): BuilderSection {
  const { step1: s1, step2: s2, step3: s3, step4: s4, step5: s5, step7: s7 } = store;
  if (!s1.primary_image_url) return "product";
  if (!s2.materials.length)  return "materials";
  if (!s3.facilities.length) return "supply_chain";
  if (!s4.sustainability_summary) return "impact";
  if (!s5.certifications.length)  return "certifications";
  if (!s7.product_story)     return "story";
  return "product";
}

function getNudge(store: ReturnType<typeof useWizardStore.getState>): string {
  const { step1: s1, step2: s2, step3: s3, step4: s4, step5: s5, step7: s7 } = store;
  if (!s1.primary_image_url) return "Add a product image to make your passport stand out.";
  if (!s2.materials.length)  return "Add materials to unlock the composition section.";
  if (!s3.facilities.length) return "Add a supply chain step to show where this was made.";
  if (!s4.sustainability_summary) return "Write a sustainability summary for the Impact tab.";
  if (!s5.certifications.length)  return "Add certifications to build customer trust.";
  if (!s7.product_story)     return "Tell the story behind this product.";
  return "Almost there — keep adding detail to reach Best-in-class.";
}

// ── Donut ring ────────────────────────────────────────────────────────────────

function StrengthRing({ score, stroke }: { score: number; stroke: string }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#EBEBEA" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="8"
        strokeDasharray={`${filled} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  passportId: string;
  status: "draft" | "published";
  onNavigate?: (section: BuilderSection) => void;
}

export function BuilderRightPanel({ passportId, status, onNavigate }: Props) {
  const [qrCode, setQrCode] = useState<{ id: string; target_url: string } | null>(null);
  const [loadingQR, setLoadingQR] = useState(true);

  const score    = useWizardStore((s) => computeScore(s));
  const nudge    = useWizardStore((s) => getNudge(s));
  const strength = getStrength(score);
  const slug     = useWizardStore((s) => s.step1.slug);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://originsid.com";
  const passportUrl = slug ? `${appUrl}/p/${slug}` : null;

  useEffect(() => {
    if (!passportId) return;
    setLoadingQR(true);
    fetch(`/api/qr?passportId=${passportId}`)
      .then((r) => r.json())
      .then(async (list: { id: string; target_url: string }[]) => {
        if (list.length > 0) {
          setQrCode(list[0]);
        } else {
          const res = await fetch("/api/qr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ passportId, label: "Default" }),
          });
          if (res.ok) setQrCode(await res.json());
        }
      })
      .catch(() => {})
      .finally(() => setLoadingQR(false));
  }, [passportId]);

  function downloadQRFile(format: "png" | "svg") {
    if (!qrCode) return;
    const url = `/api/qr/${qrCode.id}/download?format=${format}${format === "png" ? "&size=1000" : ""}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-code.${format}`;
    a.click();
  }

  function copyLink() {
    if (!passportUrl) {
      toast.error("Publish your passport to get a shareable link");
      return;
    }
    navigator.clipboard.writeText(passportUrl);
    toast.success("Link copied to clipboard");
  }

  async function sharePassport() {
    if (!passportUrl) {
      toast.error("Publish your passport to get a shareable link");
      return;
    }
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Digital Product Passport",
          url: passportUrl,
        });
        return;
      } catch {
        // user cancelled or not supported — fall through to copy
      }
    }
    copyLink();
  }

  function improvePassport() {
    if (!onNavigate) return;
    const section = getWeakestSection(useWizardStore.getState());
    onNavigate(section);
  }

  const passportUrlDisplay = passportUrl
    ? passportUrl.replace(/^https?:\/\//, "")
    : null;

  return (
    <div className="w-[272px] shrink-0 bg-white border-l border-[#EBEBEA] flex flex-col overflow-y-auto">

      {/* ── Passport strength ── */}
      <div className="px-5 py-5 border-b border-[#EBEBEA]">
        <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-4">
          Passport status
        </p>

        <div className="flex flex-col items-center">
          <div className="relative">
            <StrengthRing score={score} stroke={strength.stroke} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-bold text-black leading-none">{score}%</span>
            </div>
          </div>
          <p className={`text-sm font-semibold mt-3 ${strength.color}`}>
            {strength.label}
          </p>
          <p className="text-[11px] text-[#525252] text-center mt-1.5 leading-relaxed max-w-[200px]">
            {nudge}
          </p>
        </div>

        <button
          onClick={improvePassport}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-black text-white text-[11px] font-semibold py-2.5 rounded-xl hover:bg-[#1C1C1E] transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Improve passport
        </button>
      </div>

      {/* ── QR code ── */}
      <div className="px-5 py-4 border-b border-[#EBEBEA]">
        <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-3">
          QR code
        </p>
        {loadingQR ? (
          <div className="flex items-center justify-center h-[120px]">
            <Loader2 className="h-5 w-5 text-[#BDBDBB] animate-spin" />
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border border-[#E8E8E6] p-2 bg-white">
              <QRCodeDisplay url={qrCode.target_url} size={120} />
            </div>
            <p className="font-mono text-[10px] text-[#8C8C8C] text-center leading-relaxed max-w-full truncate px-1">
              {qrCode.target_url.replace(/^https?:\/\//, "")}
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => downloadQRFile("png")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#E8E8E6] bg-white hover:bg-[#F7F6F4] transition-colors text-[11px] font-medium text-black"
              >
                <Download className="h-3 w-3" strokeWidth={2} />
                PNG
              </button>
              <button
                onClick={() => downloadQRFile("svg")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[#E8E8E6] bg-white hover:bg-[#F7F6F4] transition-colors text-[11px] font-medium text-black"
              >
                <Download className="h-3 w-3" strokeWidth={2} />
                SVG
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <QrCode className="h-8 w-8 text-[#BDBDBB]" />
            <p className="text-[11px] text-[#8C8C8C]">QR code unavailable</p>
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="px-5 py-4 border-b border-[#EBEBEA]">
        <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-3">
          Quick actions
        </p>
        <div className="space-y-0.5">
          {/* Copy link */}
          <button
            onClick={copyLink}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F7F6F4] transition-colors text-left group"
          >
            <Link2 className="h-3.5 w-3.5 text-[#525252] group-hover:text-black transition-colors" strokeWidth={1.75} />
            <span className="text-[12px] text-black">Copy passport link</span>
          </button>

          {/* Preview full page — always available, uses authenticated preview route */}
          <a
            href={`/passports/${passportId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F7F6F4] transition-colors group"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#525252] group-hover:text-black transition-colors" strokeWidth={1.75} />
            <span className="text-[12px] text-black">Preview full page</span>
          </a>

          {/* Share */}
          <button
            onClick={sharePassport}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F7F6F4] transition-colors text-left group"
          >
            <Share2 className="h-3.5 w-3.5 text-[#525252] group-hover:text-black transition-colors" strokeWidth={1.75} />
            <span className="text-[12px] text-black">Share preview</span>
          </button>

          {/* Request supplier data */}
          <a
            href={`/supply-chain-requests?passportId=${passportId}`}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F7F6F4] transition-colors group"
          >
            <Send className="h-3.5 w-3.5 text-[#525252] group-hover:text-black transition-colors" strokeWidth={1.75} />
            <span className="text-[12px] text-black">Request supplier data</span>
          </a>
        </div>
      </div>

      {/* ── Passport link ── */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-3">
          Passport link {status === "published" ? "(live)" : "(draft)"}
        </p>
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border ${
          status === "published"
            ? "bg-[#F0FDF4] border-emerald-200"
            : "bg-[#F7F6F4] border-[#EBEBEA]"
        }`}>
          <span className="text-[10px] text-[#525252] truncate flex-1 font-mono">
            {passportUrlDisplay ?? "Save a draft to get your link"}
          </span>
          {passportUrl && (
            <button
              onClick={copyLink}
              className="text-[#8C8C8C] hover:text-black transition-colors shrink-0"
              title="Copy link"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
