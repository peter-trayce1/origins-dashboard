"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useWizardStore } from "@/stores/wizardStore";
import { useOrganisation } from "@/hooks/useOrganisation";
import type { BuilderSection } from "./BuilderNavSidebar";
import {
  MapPin, Leaf, ShieldCheck, RefreshCw,
  Droplets, Wind, Zap, ExternalLink, ShoppingBag,
  Info, BookOpen, ChevronDown, CheckCircle, AlertCircle,
  Truck, Trash2, Package, TreePine, Wrench, BarChart3,
  Check, Paperclip, Shield, EyeOff,
} from "lucide-react";
import type { MetricType } from "@/types/wizard";
import { CareSymbolIcon, CARE_LABELS } from "@/components/shared/care-icons";
import { SUPPLIER_TYPE_ORDER, normalizeProcessStage } from "@/components/passport/wizard/steps/Step3SupplyChain";

function formatMonthYear(value: string): string {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

// ── Tab / section mapping ────────────────────────────────────────────────────

type Tab = "Product" | "Impact" | "Story" | "Actions";
const TABS: Tab[] = ["Product", "Impact", "Story", "Actions"];

const TAB_ICONS: Record<Tab, React.ElementType> = {
  Product: Info,
  Impact:  Leaf,
  Story:   BookOpen,
  Actions: RefreshCw,
};

const TAB_TO_SECTION: Record<Tab, BuilderSection> = {
  Product: "product",
  Impact:  "impact",
  Story:   "story",
  Actions: "circularity",
};

const SECTION_TO_TAB: Record<BuilderSection, Tab> = {
  product:        "Product",
  materials:      "Product",
  care:           "Product",
  impact:         "Impact",
  supply_chain:   "Story",
  certifications: "Impact",
  story:          "Story",
  circularity:    "Actions",
};

const MATERIAL_PALETTE = [
  "#333333", "#8b8b8b", "#0e6dea", "#00933e",
  "#e74c3c", "#f39c12", "#8e44ad",
];

const COUNTRY_FLAGS: Record<string, string> = {
  "Bangladesh": "🇧🇩", "Belgium": "🇧🇪", "Brazil": "🇧🇷", "Cambodia": "🇰🇭",
  "China": "🇨🇳", "Denmark": "🇩🇰", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Ethiopia": "🇪🇹",
  "France": "🇫🇷", "Germany": "🇩🇪", "India": "🇮🇳", "Indonesia": "🇮🇩", "Italy": "🇮🇹",
  "Japan": "🇯🇵", "Morocco": "🇲🇦", "Northern Ireland": "🇬🇧", "Pakistan": "🇵🇰", "Peru": "🇵🇪",
  "Portugal": "🇵🇹", "Romania": "🇷🇴", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Spain": "🇪🇸", "Sri Lanka": "🇱🇰",
  "Sweden": "🇸🇪", "Taiwan": "🇹🇼", "Thailand": "🇹🇭", "Turkey": "🇹🇷", "United Kingdom": "🇬🇧",
  "United States": "🇺🇸", "Vietnam": "🇻🇳", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Other": "🌍",
};


interface Props {
  passportId: string;
  status: "draft" | "published";
  brandName: string;
  activeSection?: BuilderSection;
  onSectionChange?: (section: BuilderSection) => void;
}

type S1 = ReturnType<typeof useWizardStore.getState>["step1"];
type S2 = ReturnType<typeof useWizardStore.getState>["step2"];
type S3Facility = ReturnType<typeof useWizardStore.getState>["step3"]["facilities"][0];

// ── Small sub-components ─────────────────────────────────────────────────────

function SmallDataRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-2 py-2 border-b border-[#f0f0ee] last:border-0">
      <span className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] shrink-0">{label}</span>
      <span className="text-[10px] text-[#333] text-right">{value}</span>
    </div>
  );
}

function SmallMaterialBar({ materials }: { materials: S2["materials"] }) {
  const sorted = [...materials]
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
    .filter((m) => (m.percentage ?? 0) > 0);
  if (!sorted.length) return null;
  return (
    <div className="px-3 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
      <p className="text-[7px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">Composition</p>
      <div className="h-1.5 rounded-full flex overflow-hidden mb-2 bg-[#f0f0ee]">
        {sorted.map((m, i) => (
          <div key={i} style={{ width: `${m.percentage}%`, background: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length] }} />
        ))}
      </div>
      {sorted.map((m, i) => (
        <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#f5f5f3] last:border-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length] }} />
            <span className="text-[9.5px] text-[#333] truncate">{m.material_name}</span>
            {(m.recycled_content_pct ?? 0) > 0 && (
              <span className="text-[6.5px] text-[#00933e] bg-[#cff2dd] px-1 py-0.5 rounded shrink-0">{m.recycled_content_pct}% rec.</span>
            )}
          </div>
          <span className="text-[9.5px] font-medium text-[#333] tabular-nums shrink-0 ml-1">{m.percentage}%</span>
        </div>
      ))}
    </div>
  );
}

function MetricVerifIcon({ status }: { status: string }) {
  const base = "flex items-center gap-0.5 text-[7px] font-medium rounded px-1 py-0.5";
  if (status === "third_party_verified") return (
    <span className={`${base} text-blue-700 bg-blue-50`}>
      <Shield className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />3rd party verified
    </span>
  );
  if (status === "verified") return (
    <span className={`${base} text-emerald-700 bg-emerald-50`}>
      <Check className="h-2.5 w-2.5 shrink-0" strokeWidth={2} />Verified
    </span>
  );
  if (status === "evidence_attached") return (
    <span className={`${base} text-[#555] bg-[#f4f4f2]`}>
      <Paperclip className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />Evidence provided
    </span>
  );
  return null;
}

function SmallMetricCard({
  label, value, unit, Icon, bg,
  scope, verification, evidenceUrl, explanation, benchmark, avoided, savings,
  isHidden,
}: {
  label: string;
  value: string;
  unit: string;
  Icon: React.ElementType;
  bg: string;
  scope?: string;
  verification?: string;
  evidenceUrl?: string;
  explanation?: string;
  benchmark?: number | null;
  avoided?: number | null;
  savings?: number | null;
  isHidden?: boolean;
}) {
  // "Evidence attached" only counts if an evidence URL has actually been provided
  const effectiveVerif = verification === "evidence_attached" && !evidenceUrl ? null : verification;
  const hasMeta = scope || (effectiveVerif && effectiveVerif !== "claimed") || explanation ||
    benchmark != null || avoided != null || savings != null;

  return (
    <div className={`rounded-xl px-3 py-3 ${isHidden ? "opacity-60 ring-1 ring-inset ring-black/10" : ""}`} style={{ background: bg }}>
      <div className="flex items-start justify-between mb-2">
        <Icon className="h-3.5 w-3.5 text-[#555]" strokeWidth={1.5} />
        <div className="flex items-center gap-1.5">
          {isHidden && (
            <span className="flex items-center gap-0.5 text-[7px] text-[#8b8b8b]">
              <EyeOff className="h-2.5 w-2.5" />hidden
            </span>
          )}
          {effectiveVerif && effectiveVerif !== "claimed" && <MetricVerifIcon status={effectiveVerif} />}
        </div>
      </div>
      <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#666] mb-0.5">{label}</p>
      <p className="text-[18px] font-light text-[#222] leading-none">{value}</p>
      <p className="text-[8px] text-[#666] mt-0.5">{unit}</p>

      {hasMeta && (
        <div className="mt-2 pt-2 border-t border-black/[0.06] space-y-1">
          {scope && (
            <span className="inline-block text-[7px] font-mono text-[#888] bg-black/[0.05] px-1.5 py-0.5 rounded">
              {scope}
            </span>
          )}
          {(benchmark != null || savings != null || avoided != null) && (
            <div className="space-y-0.5">
              {benchmark != null && (
                <p className="text-[7.5px] text-[#888]">Benchmark: {benchmark} {unit}</p>
              )}
              {savings != null && (
                <p className="text-[7.5px] font-medium text-emerald-700">{savings}% vs industry avg</p>
              )}
              {avoided != null && (
                <p className="text-[7.5px] text-emerald-700">Avoided: {avoided} {unit}</p>
              )}
            </div>
          )}
          {explanation && (
            <p className="text-[7.5px] text-[#777] leading-relaxed line-clamp-2 italic">{explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

function metricIcon(type: MetricType | null | undefined): React.ElementType {
  switch (type) {
    case "carbon":        return Leaf;
    case "water":         return Droplets;
    case "energy":        return Zap;
    case "transport":     return Truck;
    case "waste":         return Trash2;
    case "circularity":   return RefreshCw;
    case "packaging":     return Package;
    case "biodiversity":  return TreePine;
    case "repairability": return Wrench;
    default:              return BarChart3;
  }
}

const METRIC_TYPE_BG: Record<string, string> = {
  carbon:        "#edf2eb",
  water:         "#e8f0f5",
  energy:        "#fef6ed",
  transport:     "#eef0f9",
  waste:         "#fbeaea",
  circularity:   "#e8f5f3",
  packaging:     "#fdf1e8",
  biodiversity:  "#eaf2e8",
  repairability: "#f1eef9",
  other:         "#ebebeb",
};

// Certification logo map — key matches the CERTIFICATIONS dropdown values in Step5Certifications
// Note: gots.png is not present in public/cert-logos — omitted so GOTS gracefully shows the shield fallback
const CERT_LOGO: Record<string, string> = {
  "OEKO-TEX Standard 100":                  "/cert-logos/oeko-tex-100.png",
  "OEKO-TEX MADE IN GREEN":                 "/cert-logos/oeko-tex-made-in-green.png",
  "GRS (Global Recycled Standard)":         "/cert-logos/grs.png",
  "RCS (Recycled Content Standard)":        "/cert-logos/rcs.png",
  "Bluesign":                               "/cert-logos/bluesign.png",
  "B Corp":                                 "/cert-logos/bcorp.png",
  "Fair Trade":                             "/cert-logos/fair-trade.png",
  "Fairtrade Cotton":                       "/cert-logos/fairtrade-cotton.png",
  "FSC":                                    "/cert-logos/fsc.png",
  "ZDHC":                                   "/cert-logos/zdhc.png",
  "EU Ecolabel":                            "/cert-logos/eu-ecolabel.png",
  "European Flax":                          "/cert-logos/european-flax.png",
  "Cradle to Cradle":                       "/cert-logos/cradle-to-cradle.png",
  "Leather Working Group":                  "/cert-logos/leather-working-group.png",
  "Better Cotton (BCI)":                    "/cert-logos/better-cotton.png",
  "SA8000":                                 "/cert-logos/sa8000.png",
  "ISO 14001":                              "/cert-logos/iso-14001.png",
  "ISO 9001":                               "/cert-logos/iso-9001.png",
  "USDA Organic":                           "/cert-logos/usda-organic.png",
  "Soil Association Organic":               "/cert-logos/soil-association.png",
  "Nordic Swan":                            "/cert-logos/nordic-swan.png",
  "REACH Declaration":                      "/cert-logos/reach.png",
};

function SmallCertLogo({ name, customLogoUrl }: { name: string; customLogoUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const logoPath = customLogoUrl || CERT_LOGO[name];
  if (!logoPath || imgError) return <ShieldCheck className="h-4 w-4 text-[#00933e]" strokeWidth={1.5} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoPath} alt={name} className="w-7 h-7 object-contain" onError={() => setImgError(true)} />
  );
}

function SmallTimelineNode({ facility, isLast, index }: {
  facility: S3Facility; isLast: boolean; index: number;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex flex-col items-center self-stretch pt-1">
        <div className="w-2 h-2 rounded-full bg-[#333] ring-2 ring-[#f5f5f3] shrink-0" />
        {!isLast && <div className="flex-1 mt-0.5" style={{ width: 1, borderLeft: "2px dashed #cccccc", minHeight: 28 }} />}
      </div>
      <div className="flex-1 pb-3">
        <div className="bg-white border border-[#e8e8e8] rounded-xl p-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {facility.country && (
                <span className="text-sm leading-none shrink-0">{COUNTRY_FLAGS[facility.country] ?? "🌍"}</span>
              )}
              <p className="text-[10px] font-medium text-[#333] leading-snug truncate">
                {facility.facility_name || [facility.city, facility.country].filter(Boolean).join(", ") || "Unnamed facility"}
              </p>
            </div>
            {(facility.city || facility.country) && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <MapPin className="h-2.5 w-2.5 text-[#8b8b8b] shrink-0" />
                <span className="font-mono text-[7.5px] uppercase tracking-wider text-[#8b8b8b]">
                  {[facility.city, facility.country].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {facility.process_stage && (
              <span className="text-[7.5px] font-mono text-[#333] border border-[#cccccc] rounded px-1.5 py-0.5">
                {normalizeProcessStage(facility.process_stage)}
              </span>
            )}
            {(facility.facility_certifications ?? []).filter(c => c.name).map((c, i) => (
              <span key={i} className="text-[6.5px] font-mono text-[#555] border border-[#e0e0e0] rounded px-1 py-0.5">
                {c.name}
              </span>
            ))}
            {facility.website_url && (
              <span className="text-[7px] text-[#0e6dea] underline truncate max-w-[80px]">Visit website</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Care accordion ───────────────────────────────────────────────────────────

function SmallCareAccordion({ s6 }: { s6: ReturnType<typeof useWizardStore.getState>["step6"] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  if (!s6.care_instructions.length) return null;

  return (
    <div className="bg-white border-t border-[#f0f0ee] mt-0.5">
      <p className="px-3 pt-3 pb-2 text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b]">
        Care Instructions
      </p>
      <div className="px-3 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {s6.care_instructions.map((c, i) => {
          const label = CARE_LABELS[c.type] ?? c.type;
          const isOpen = openIdx === i;
          return (
            <button
              key={i}
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className={`flex flex-col items-center gap-1 shrink-0 transition-colors ${isOpen ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                isOpen ? "border-[#333] bg-[#333]" : "border-[#e1e1e1] bg-white"
              }`}>
                <CareSymbolIcon type={c.type} active={isOpen} className="w-4 h-4" />
              </div>
              <span className="text-[6.5px] font-mono text-[#8b8b8b] uppercase tracking-wide max-w-[32px] text-center leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {openIdx !== null && s6.care_instructions[openIdx] && (
        <div className="mx-3 mb-3 px-3 py-2.5 bg-[#f5f5f3] rounded-xl border border-[#e8e8e8]">
          <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-1">
            {CARE_LABELS[s6.care_instructions[openIdx].type] ?? s6.care_instructions[openIdx].type}
          </p>
          <p className="text-[9.5px] text-[#444] leading-relaxed">
            {s6.care_instructions[openIdx].instruction}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Product identity strip ───────────────────────────────────────────────────

function ProductStrip({ s1 }: { s1: S1 }) {
  return (
    <div className="px-3.5 pt-4 pb-3 bg-white border-b border-[#f0f0ee]">
      <h1 className="text-[15px] font-medium text-[#111] leading-tight tracking-tight">
        {s1.product_name || <span className="text-[#D4D4D1]">Product name</span>}
      </h1>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {s1.passport_code && (
          <span className="font-mono text-[8px] text-[#8b8b8b]">{s1.passport_code}</span>
        )}
        <span className="flex items-center gap-0.5 text-[8px] text-[#00933e] font-medium">
          <ShieldCheck className="h-2 w-2" strokeWidth={2} />
          AUTHENTIC
        </span>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function LivePassportPreview({
  passportId, status, brandName, activeSection, onSectionChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Product");
  const { org } = useOrganisation();

  const s1 = useWizardStore((s) => s.step1);
  const s2 = useWizardStore((s) => s.step2);
  const s3 = useWizardStore((s) => s.step3);
  const s4 = useWizardStore((s) => s.step4);
  const s5 = useWizardStore((s) => s.step5);
  const s6 = useWizardStore((s) => s.step6);
  const s7 = useWizardStore((s) => s.step7);

  void passportId;

  useEffect(() => {
    if (activeSection) {
      setActiveTab(SECTION_TO_TAB[activeSection]);
    }
  }, [activeSection]);

  function handleTabClick(tab: Tab) {
    setActiveTab(tab);
    onSectionChange?.(TAB_TO_SECTION[tab]);
  }

  const sortedFacilities = [...s3.facilities].sort((a, b) => {
    const stageA = normalizeProcessStage(a.process_stage);
    const stageB = normalizeProcessStage(b.process_stage);
    return (SUPPLIER_TYPE_ORDER[stageA] ?? 99) - (SUPPLIER_TYPE_ORDER[stageB] ?? 99);
  });
  const originCountry = [...s3.facilities]
    .sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99))[0]?.country ?? "";

  const composition = s2.materials.length > 0
    ? s2.materials
        .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
        .map((m) => `${m.percentage ?? "?"}% ${m.material_name}`)
        .join(", ")
    : "";

  const impactEmpty =
    s4.carbon_footprint_kg === "" &&
    s4.water_usage_litres === "" &&
    s4.energy_use_kwh === "" &&
    s4.impact_metrics.filter((m) => m.metric_value != null).length === 0 &&
    !s4.sustainability_summary &&
    s4.sustainability_claims.length === 0 &&
    s5.certifications.length === 0;

  const trimNotes = s2.trim_notes;
  const hasTrimData = trimNotes.buttons || trimNotes.zips || trimNotes.labels || trimNotes.packaging || s2.dyeing_notes || s2.finishing_notes;
  const hasChemData = s2.restricted_substances_ok || s2.pfas_free || s2.animal_derived;
  const hasDurabilityData = s6.repairability_score !== "" || s6.spare_parts_available || s6.warranty_info || s6.repair_instructions;
  const hasEndOfLife = s6.recyclability || s6.recycling_instructions || s6.end_of_life_guidance;
  const galleryUrls = (s7.gallery_image_urls ?? []).filter(Boolean);

  const REPAIRABILITY_LABELS: Record<number, string> = {
    5: "Fully repairable", 4: "Mostly repairable", 3: "Partially repairable",
    2: "Difficult to repair", 1: "Not repairable",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F2F2F0] flex flex-col items-center justify-start py-8 px-4">
      {/* Status label */}
      <div className="mb-5 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
          status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-[#E8E8E6] text-[#525252]"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status === "published" ? "bg-emerald-500" : "bg-[#8C8C8C]"}`} />
          {status === "published" ? "Live" : "Draft preview"}
        </span>
        <span className="text-[11px] text-[#8C8C8C]">Clicking tabs navigates the builder</span>
      </div>

      {/* ── Phone shell ── */}
      <div style={{ width: 320, height: 660, backgroundColor: "#1A1A1A", borderRadius: 42, padding: 10, boxShadow: "0 28px 72px rgba(0,0,0,0.42)", flexShrink: 0, position: "relative" }}>
        {/* Screen */}
        <div className="relative flex flex-col overflow-hidden" style={{ width: "100%", height: "100%", borderRadius: 34, background: "#fdfaf7" }}>
          {/* Punch-hole */}
          <div style={{ position: "absolute", top: 14, left: 16, width: 11, height: 11, borderRadius: "50%", background: "#1A1A1A", zIndex: 20 }} />

          {/* Brand header */}
          <div className="shrink-0 flex items-center justify-between px-3.5 bg-white border-b border-[#f0f0ee] z-10" style={{ paddingTop: 38, paddingBottom: 8 }}>
            {org?.brandLogoUrl ? (
              <Image src={org.brandLogoUrl} alt={brandName} width={80} height={24} className="object-contain max-h-5 max-w-[72px]" />
            ) : (
              <span className="text-[12px] font-bold text-black tracking-tight uppercase">{brandName}</span>
            )}
            <span className="text-[7px] text-[#BDBDBB] tracking-wide font-mono">ID by Origins</span>
          </div>

          {/* Product identity strip — always visible */}
          <div className="shrink-0">
            <ProductStrip s1={s1} />
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", paddingBottom: 56 }}>

            {/* ── PRODUCT TAB ── */}
            {activeTab === "Product" && (
              <div>
                {/* Hero image */}
                <div className="w-full aspect-[4/5] bg-[#fafaf8] flex items-center justify-center overflow-hidden p-5">
                  {s1.primary_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s1.primary_image_url} alt={s1.product_name}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <ShoppingBag className="h-7 w-7 text-[#D4D4D1]" />
                      <span className="text-[8px] text-[#D4D4D1]">Add a product image</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {s1.product_description && (
                  <div className="px-3.5 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
                    <p className="text-[10px] text-[#444] leading-relaxed">{s1.product_description}</p>
                  </div>
                )}

                {/* Gallery images */}
                {galleryUrls.length > 0 && (
                  <div className="px-3 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
                    <p className="text-[7px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">Gallery</p>
                    <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                      {galleryUrls.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt=""
                          className="w-16 h-16 object-cover rounded-lg shrink-0 border border-[#e8e8e8]"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Care instructions */}
                <SmallCareAccordion s6={s6} />

                {/* Durability & repair */}
                {hasDurabilityData && (
                  <div className="px-3.5 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
                    <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">Durability & Repair</p>
                    {s6.repairability_score !== "" && (
                      <SmallDataRow label="Repairability" value={`${s6.repairability_score}/5 — ${REPAIRABILITY_LABELS[Number(s6.repairability_score)] ?? ""}`} />
                    )}
                    {s6.spare_parts_available && (
                      <div className="flex items-center gap-1.5 py-1.5">
                        <CheckCircle className="h-2.5 w-2.5 text-[#00933e] shrink-0" strokeWidth={2} />
                        <span className="text-[9px] text-[#333]">Spare parts available</span>
                      </div>
                    )}
                    {s6.warranty_info && <SmallDataRow label="Warranty" value={s6.warranty_info} />}
                    {s6.repair_instructions && <SmallDataRow label="Repair guide" value="Link provided" />}
                  </div>
                )}

                {/* Materials */}
                {s2.materials.length > 0 && <SmallMaterialBar materials={s2.materials} />}

                {/* Data rows */}
                <div className="px-3.5 py-1 bg-white border-t border-[#f0f0ee] mt-0.5">
                  <SmallDataRow label="Category"    value={s1.category ?? ""} />
                  <SmallDataRow label="Collection"  value={s1.collection_name ?? ""} />
                  <SmallDataRow label="Colour"      value={s1.colour ?? ""} />
                  <SmallDataRow label="Size"        value={s1.size_range ?? ""} />
                  <SmallDataRow label="Gender"      value={s1.gender ?? ""} />
                  <SmallDataRow label="Composition" value={composition} />
                  <SmallDataRow label="Origin"      value={originCountry || s1.country_of_origin} />
                  <SmallDataRow label="Season"      value={s1.season ?? ""} />
                  {s1.product_weight_g !== "" && <SmallDataRow label="Weight" value={`${s1.product_weight_g} g`} />}
                  {s1.product_lifetime_years !== "" && <SmallDataRow label="Est. lifetime" value={`${s1.product_lifetime_years} yr`} />}
                  <SmallDataRow label="GTIN"     value={s1.gtin ?? ""} />
                  <SmallDataRow label="Batch ID" value={s1.batch_id ?? ""} />
                  {s1.manufacturing_date && (
                    <SmallDataRow label="Made" value={formatMonthYear(s1.manufacturing_date)} />
                  )}
                </div>

                {/* Trims & finishing */}
                {hasTrimData && (
                  <div className="px-3.5 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
                    <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">Trims & Finishing</p>
                    {trimNotes.buttons && <SmallDataRow label="Buttons" value={trimNotes.buttons} />}
                    {trimNotes.zips && <SmallDataRow label="Zips" value={trimNotes.zips} />}
                    {trimNotes.labels && <SmallDataRow label="Labels" value={trimNotes.labels} />}
                    {trimNotes.packaging && <SmallDataRow label="Packaging" value={trimNotes.packaging} />}
                    {s2.dyeing_notes && <SmallDataRow label="Dyeing" value={s2.dyeing_notes} />}
                    {s2.finishing_notes && <SmallDataRow label="Finishing" value={s2.finishing_notes} />}
                  </div>
                )}

                {/* Chemical compliance */}
                {hasChemData && (
                  <div className="px-3.5 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
                    <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">Chemical Compliance</p>
                    <div className="space-y-1.5">
                      {s2.restricted_substances_ok && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-[#00933e] shrink-0" strokeWidth={2} />
                          <span className="text-[9px] text-[#333]">REACH / restricted substances compliant</span>
                        </div>
                      )}
                      {s2.pfas_free && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-[#00933e] shrink-0" strokeWidth={2} />
                          <span className="text-[9px] text-[#333]">No PFAS / fluorochemical treatments</span>
                        </div>
                      )}
                      {s2.animal_derived && (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3 text-[#f39c12] shrink-0" strokeWidth={2} />
                          <span className="text-[9px] text-[#333]">Contains animal-derived materials</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!s1.product_name && !s1.product_description && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-[8px] text-[#BDBDBB]">Fill in product details to see a preview.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── IMPACT TAB ── */}
            {activeTab === "Impact" && (
              <div className="pb-4">
                {/* Sustainability summary — top of Impact */}
                {s4.sustainability_summary && (
                  <div className="mx-3 mt-3 rounded-xl bg-[#f0faf5] border border-[#cff2dd] px-3 py-3">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Leaf className="h-2.5 w-2.5 text-[#00933e] shrink-0" strokeWidth={2} />
                      <p className="text-[6.5px] font-mono uppercase tracking-widest text-[#00933e]">Our Impact</p>
                    </div>
                    <p className="text-[9px] text-[#1a4a2e] leading-relaxed">{s4.sustainability_summary}</p>
                  </div>
                )}

                <div className="px-3 pt-3 space-y-2">
                  {s4.carbon_footprint_kg !== "" && (
                    <SmallMetricCard
                      label="Carbon footprint"
                      value={String(s4.carbon_footprint_kg)}
                      unit="kg CO₂e"
                      Icon={Wind}
                      bg="#ebebeb"
                      scope={s4.carbon_meta.scope || undefined}
                      verification={s4.carbon_meta.verification_status}
                      evidenceUrl={s4.carbon_meta.evidence_url || undefined}
                      explanation={s4.carbon_meta.explanation || undefined}
                      benchmark={s4.carbon_meta.benchmark_value}
                      avoided={s4.carbon_meta.avoided_value}
                      savings={s4.carbon_meta.savings_percentage}
                      isHidden={!s4.carbon_meta.display_public}
                    />
                  )}
                  {s4.water_usage_litres !== "" && (
                    <SmallMetricCard
                      label="Water usage"
                      value={String(s4.water_usage_litres)}
                      unit="litres"
                      Icon={Droplets}
                      bg="#e8f0f5"
                      scope={s4.water_meta.scope || undefined}
                      verification={s4.water_meta.verification_status}
                      evidenceUrl={s4.water_meta.evidence_url || undefined}
                      explanation={s4.water_meta.explanation || undefined}
                      benchmark={s4.water_meta.benchmark_value}
                      avoided={s4.water_meta.avoided_value}
                      savings={s4.water_meta.savings_percentage}
                      isHidden={!s4.water_meta.display_public}
                    />
                  )}
                  {s4.energy_use_kwh !== "" && (
                    <SmallMetricCard
                      label="Energy use"
                      value={String(s4.energy_use_kwh)}
                      unit={s4.energy_unit || "kWh"}
                      Icon={Zap}
                      bg="#fef6ed"
                      scope={s4.energy_meta.scope || undefined}
                      verification={s4.energy_meta.verification_status}
                      evidenceUrl={s4.energy_meta.evidence_url || undefined}
                      explanation={s4.energy_meta.explanation || undefined}
                      benchmark={s4.energy_meta.benchmark_value}
                      avoided={s4.energy_meta.avoided_value}
                      savings={s4.energy_meta.savings_percentage}
                      isHidden={!s4.energy_meta.display_public}
                    />
                  )}
                  {s4.impact_metrics
                    .filter((m) => m.metric_value != null)
                    .map((m, i) => (
                      <SmallMetricCard
                        key={i}
                        label={m.metric_name || m.metric_key}
                        value={String(m.metric_value)}
                        unit={m.metric_unit}
                        Icon={metricIcon(m.metric_type)}
                        bg={METRIC_TYPE_BG[m.metric_type] ?? "#ebebeb"}
                        scope={m.metric_scope || undefined}
                        verification={m.verification_status}
                        evidenceUrl={m.evidence_url || undefined}
                        explanation={m.explanation || undefined}
                        benchmark={m.benchmark_value}
                        avoided={m.avoided_value}
                        savings={m.savings_percentage}
                        isHidden={!m.display_public}
                      />
                    ))}
                </div>

                {(() => {
                  const EVIDENCE_REQUIRED = new Set([
                    "Carbon-neutral production", "Made from organic materials",
                    "Contains recycled content", "Renewable energy used in production",
                    "Fair wages paid", "Zero waste manufacturing",
                  ]);
                  // Verified = predefined evidence-required claim WITH url, OR custom claim that
                  // has a key in claim_evidence_urls (even "") AND has a non-empty url.
                  const verifiedClaims = s4.sustainability_claims.filter(
                    (c) =>
                      (EVIDENCE_REQUIRED.has(c) || Object.prototype.hasOwnProperty.call(s4.claim_evidence_urls, c)) &&
                      s4.claim_evidence_urls[c]
                  );
                  // Self-declared = no key in claim_evidence_urls and not a predefined verified claim
                  const selfDeclaredClaims = s4.sustainability_claims.filter(
                    (c) =>
                      !EVIDENCE_REQUIRED.has(c) &&
                      !Object.prototype.hasOwnProperty.call(s4.claim_evidence_urls, c)
                  );
                  return (
                    <>
                      {verifiedClaims.length > 0 && (
                        <div className="px-3.5 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
                          <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">Verified claims</p>
                          <div className="flex flex-wrap gap-1.5">
                            {verifiedClaims.map((claim, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-[8px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                                <ShieldCheck className="h-2 w-2 shrink-0" strokeWidth={2} />
                                {claim}
                                <span className="flex items-center gap-0.5 ml-0.5 text-[6.5px] text-[#555] bg-[#f4f4f2] border border-[#e8e8e6] px-1 py-0.5 rounded">
                                  <Paperclip className="h-1.5 w-1.5" />Evidence provided
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selfDeclaredClaims.length > 0 && (
                        <div className="px-3.5 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
                          <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">Self-declared claims</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selfDeclaredClaims.map((claim, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-[8px] text-[#00933e] bg-[#f0faf5] border border-[#cff2dd] px-2 py-1 rounded-full">
                                <Leaf className="h-2 w-2 shrink-0" strokeWidth={2} />
                                {claim}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {s5.certifications.length > 0 && (
                  <div className="px-3 pt-3 space-y-2">
                    <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] px-0.5">Certifications</p>
                    {s5.certifications.map((cert, i) => {
                      const isEvidenced = !!(cert.document_url || cert.verification_url);
                      return (
                        <div key={i}>
                          <div className={`bg-white border rounded-xl p-2.5 flex items-center gap-2 ${isEvidenced ? "border-[#e8e8e8]" : "border-red-200 opacity-70"}`}>
                            <div className="w-7 h-7 rounded-lg bg-[#f5f5f3] flex items-center justify-center shrink-0 overflow-hidden">
                              <SmallCertLogo name={cert.certification_name} customLogoUrl={cert.custom_logo_url} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9.5px] font-medium text-[#333] leading-snug truncate">{cert.certification_name}</p>
                              {cert.description && (
                                <p className="text-[8px] text-[#8b8b8b] leading-snug mt-0.5 line-clamp-2">{cert.description}</p>
                              )}
                            </div>
                          </div>
                          {!isEvidenced && (
                            <p className="text-[7.5px] text-red-600 mt-0.5 px-1">Upload certificate or add URL to show on passport</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {impactEmpty && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-[8px] text-[#BDBDBB]">Add sustainability data to see the Impact tab.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── STORY TAB ── */}
            {activeTab === "Story" && (
              <div className="pb-4">
                {/* Origins timeline */}
                {sortedFacilities.length > 0 && (
                  <div className="px-3 pt-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-3 px-0.5">Product Origins</p>
                    <div>
                      {sortedFacilities.map((f, idx) => (
                        <SmallTimelineNode key={idx} facility={f} isLast={idx === sortedFacilities.length - 1} index={idx} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Our Story — editorial hero block */}
                {s7.product_story && (
                  <div className="px-3.5 pt-5 pb-4 mt-2 bg-white border-t border-[#f0f0ee]">
                    <h2 className="text-[18px] font-medium text-[#111] tracking-tight leading-snug mb-2">Our story</h2>
                    <div className="w-6 h-[1.5px] bg-[#333] mb-3" />
                    <p className="text-[9px] text-[#444] leading-relaxed">{s7.product_story}</p>
                  </div>
                )}

                {/* Product story image */}
                {s7.product_story_image_url && (
                  <div className="mt-0.5 w-full aspect-[4/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s7.product_story_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* The Makers — same title style as Our Story */}
                {s7.maker_story && (
                  <div className="px-3.5 pt-5 pb-4 bg-white border-t border-[#f0f0ee] mt-0.5">
                    <h2 className="text-[18px] font-medium text-[#111] tracking-tight leading-snug mb-2">The makers</h2>
                    <div className="w-6 h-[1.5px] bg-[#333] mb-3" />
                    <p className="text-[9px] text-[#444] leading-relaxed">{s7.maker_story}</p>
                  </div>
                )}

                {/* Makers image */}
                {s7.makers_image_url && (
                  <div className="mt-0.5 w-full aspect-[4/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s7.makers_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Video */}
                {s7.video_url && (
                  <div className="px-3.5 py-3.5 bg-white border-t border-[#f0f0ee] mt-0.5">
                    <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">See the journey</p>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-[#111] flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <ExternalLink className="h-3.5 w-3.5 text-white ml-0.5" />
                      </div>
                      <span className="absolute bottom-1.5 left-2 text-[7px] text-white/60 truncate max-w-[80%]">{s7.video_url}</span>
                    </div>
                  </div>
                )}

                {sortedFacilities.length === 0 && !s7.product_story && !s7.maker_story &&
                  !s7.product_story_image_url && !s7.makers_image_url && !s7.video_url && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-[8px] text-[#BDBDBB]">Add story content or supply chain steps.</p>
                    </div>
                  )}
              </div>
            )}

            {/* ── ACTIONS TAB ── */}
            {activeTab === "Actions" && (
              <div className="pb-4">
                {s6.circularity_actions.length === 0 && !hasEndOfLife ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-[8px] text-[#BDBDBB]">Add circularity actions to see the Actions tab.</p>
                  </div>
                ) : (
                  <div>
                    {s6.circularity_actions.length > 0 && (
                      <>
                        <div className="px-3.5 pt-4 pb-2">
                          <p className="text-[14px] font-medium text-[#111] tracking-tight leading-snug">Give it a<br />new life.</p>
                        </div>
                        {s6.circularity_actions.map((action, i) => (
                          <div key={i} className="px-3.5 pt-4 pb-3.5 bg-white border-t border-[#f0f0ee] mt-0.5 first:mt-0">
                            <h2 className="text-[12px] font-medium text-[#111] capitalize mb-1">{action.title}</h2>
                            {action.description && (
                              <p className="text-[9px] text-[#555] leading-relaxed mb-2.5">{action.description}</p>
                            )}
                            {action.url && (
                              <span className="inline-flex items-center gap-1 h-7 px-3 rounded-full bg-[#0e6dea] text-white text-[8px] font-medium">
                                Get started <ExternalLink className="h-2 w-2" />
                              </span>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    {hasEndOfLife && (
                      <div className="px-3.5 py-3 bg-white border-t border-[#f0f0ee] mt-0.5">
                        <p className="text-[7.5px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">End of Life</p>
                        {s6.recyclability && (
                          <span className={`inline-flex items-center gap-1 text-[8px] font-medium px-2 py-1 rounded-full mb-2 ${
                            s6.recyclability === "recyclable" ? "bg-[#f0faf5] text-[#00933e]"
                            : s6.recyclability === "partially_recyclable" ? "bg-[#fffbeb] text-[#d97706]"
                            : "bg-[#f5f5f3] text-[#8b8b8b]"
                          }`}>
                            {s6.recyclability === "recyclable" ? "Recyclable"
                              : s6.recyclability === "partially_recyclable" ? "Partially recyclable"
                              : "Not currently recyclable"}
                          </span>
                        )}
                        {s6.recycling_instructions && <p className="text-[9px] text-[#444] leading-relaxed mt-1">{s6.recycling_instructions}</p>}
                        {s6.end_of_life_guidance && <p className="text-[9px] text-[#444] leading-relaxed mt-1">{s6.end_of_life_guidance}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mini footer */}
            <div className="bg-[#111] px-3.5 pt-6 pb-4 mt-0.5">
              {org?.brandLogoUrl ? (
                <Image src={org.brandLogoUrl} alt={brandName} width={70} height={20} className="h-5 w-auto object-contain brightness-0 invert mb-2.5" />
              ) : (
                <p className="text-[11px] font-bold text-white uppercase tracking-tight mb-2.5">{brandName}</p>
              )}
              <p className="text-[7px] text-[#888] font-mono">◉ Digital Product Passport by Origins</p>
            </div>
          </div>

          {/* ── Bottom nav ── */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E8E8E6] z-10">
            <div className="grid grid-cols-4">
              {TABS.map((tab) => {
                const Icon = TAB_ICONS[tab];
                const active = activeTab === tab;
                return (
                  <button key={tab} onClick={() => handleTabClick(tab)}
                    className="relative flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
                  >
                    {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#0e6dea]" />}
                    <Icon className={`h-4 w-4 ${active ? "text-[#111]" : "text-[#aaa]"}`} strokeWidth={active ? 2 : 1.5} />
                    <span className={`text-[7.5px] font-medium ${active ? "text-[#111]" : "text-[#aaa]"}`}>{tab}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-1 py-1 border-t border-[#f5f5f3]">
              <ShieldCheck className="h-2.5 w-2.5 text-[#aaa]" strokeWidth={1.5} />
              <span className="text-[7px] font-mono text-[#bbb]">Origins.ID</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
