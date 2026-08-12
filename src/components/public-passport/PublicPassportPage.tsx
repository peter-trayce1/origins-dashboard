"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ExternalLink, ChevronDown, ChevronRight,
  Leaf, BookOpen, RefreshCw, Info,
  MapPin, ShieldCheck, Droplets, Wind, Zap,
  Play, CheckCircle, AlertCircle, Wrench,
  Truck, Trash2, Package, TreePine, BarChart3,
  Paperclip, Check, Shield,
} from "lucide-react";
import type { MetricType } from "@/types/wizard";
import type { ConfidenceLevel } from "@/types/passport";
import { CareSymbolIcon, CARE_LABELS } from "@/components/shared/care-icons";
import { SUPPLIER_TYPE_ORDER, normalizeProcessStage } from "@/components/passport/wizard/steps/Step3SupplyChain";

// ─── Data shape ────────────────────────────────────────────────────────────

interface ImpactMetric {
  id: string;
  metric_key: string;
  metric_value: number | string | null;
  metric_unit: string | null;
  label: string | null;
  metric_type: MetricType | null;
  benchmark_value: number | null;
  avoided_value: number | null;
  savings_percentage: number | null;
  explanation: string | null;
  evidence_url: string | null;
  verification_status: "claimed" | "evidence_attached" | "verified" | "third_party_verified" | null;
  display_public: boolean;
  source_name: string | null;
  source_method: string | null;
  metric_scope: string | null;
  confidence_level: ConfidenceLevel;
}

interface PassportData {
  id: string;
  passport_code: string | null;
  product_name: string;
  sku: string | null;
  gtin: string | null;
  batch_id: string | null;
  slug: string | null;
  product_description: string | null;
  product_url: string | null;
  primary_image_url: string | null;
  additional_image_urls: string[];
  gallery_image_urls: string[];
  category: string | null;
  colour: string | null;
  season: string | null;
  collection_name: string | null;
  gender: string | null;
  size_range: string | null;
  country_of_origin: string | null;
  product_weight_g: number | null;
  product_lifetime_years: number | null;
  manufacturing_date: string | null;
  carbon_footprint_kg: number | null;
  carbon_meta: unknown;
  water_usage_litres: number | null;
  water_meta: unknown;
  energy_use_kwh: number | null;
  energy_unit: string | null;
  energy_meta: unknown;
  sustainability_summary: string | null;
  sustainability_claims: unknown;
  claim_evidence_urls: unknown;
  impact_data_source: string;
  product_story: string | null;
  product_story_image_url: string | null;
  maker_story: string | null;
  makers_image_url: string | null;
  brand_story: string | null;
  design_notes: string | null;
  brand_impact_statement: string | null;
  designer_quote: string | null;
  consumer_transparency_summary: string | null;
  video_url: string | null;
  brand_name_override: string | null;
  brand_logo_override: string | null;
  updated_at: string;
  brands: {
    name: string;
    logo_url: string | null;
    website_url: string | null;
    sustainability_story: string | null;
    primary_colour: string;
    default_cta_links: unknown;
  };
  product_materials: {
    id: string;
    material_name: string;
    percentage: number | null;
    recycled_content_pct: number | null;
    bio_based_pct: number | null;
    fibre_origin: string | null;
    confidence_level: ConfidenceLevel;
  }[];
  product_facilities: {
    id: string;
    facility_name: string;
    process_stage: string | null;
    country: string | null;
    city: string | null;
    tier: number | null;
    website_url: string | null;
    confidence_level: ConfidenceLevel;
    facility_certifications: { name: string; url: string }[] | null;
  }[];
  product_certifications: {
    id: string;
    certification_name: string;
    issued_by: string | null;
    issued_at: string | null;
    expires_at: string | null;
    certificate_number: string | null;
    claim_type: string | null;
    confidence_level: ConfidenceLevel;
    document_url: string | null;
    verification_url: string | null;
    description: string | null;
    custom_logo_url: string | null;
  }[];
  care_instructions: {
    id: string;
    type: string;
    instruction: string;
    icon_code: string | null;
  }[];
  circularity_actions: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    url: string | null;
  }[];
  impact_metrics: ImpactMetric[];
  similar_products: { name: string; image_url: string; url: string; rrp: string }[] | null;
  made_to_order: boolean | null;
  warranty_info: string | null;
  repairability_score: number | null;
  spare_parts_available: boolean;
  repair_instructions: string | null;
  recyclability: string | null;
  recycling_instructions: string | null;
  end_of_life_guidance: string | null;
  passport_material_extras?: unknown;
}

// ─── Tab config ────────────────────────────────────────────────────────────

type Tab = "Product" | "Impact" | "Story" | "Actions";
const NAV_TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "Product", label: "Product", Icon: Info },
  { id: "Impact",  label: "Impact",  Icon: Leaf },
  { id: "Story",   label: "Story",   Icon: BookOpen },
  { id: "Actions", label: "Actions", Icon: RefreshCw },
];
const TAB_SEQUENCE: Tab[] = ["Product", "Impact", "Story", "Actions"];

// ─── Palette ───────────────────────────────────────────────────────────────

const MATERIAL_PALETTE = [
  "#333333", "#8b8b8b", "#0e6dea", "#00933e", "#e74c3c",
  "#f39c12", "#8e44ad", "#16a085",
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

// ─── Known Objects logomark ─────────────────────────────────────────────────

function OriginsLogo({ className = "w-4 h-4" }: { className?: string }) {
  // Minimal KO mark — two overlapping circles representing "Known Objects"
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="7"  cy="10" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="10" r="5.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// ─── Confidence badge ──────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  if (level === "verified") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-mono font-medium text-[#00933e] bg-[#cff2dd] px-1.5 py-0.5 rounded-md">
        <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2} />
        Verified
      </span>
    );
  }
  if (level === "brand_declared") {
    return (
      <span className="text-[9px] font-mono text-[#8b8b8b] bg-[#f4f4f4] px-1.5 py-0.5 rounded-md">
        Brand declared
      </span>
    );
  }
  return null;
}

// ─── DataRow ───────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-[#f0f0ee] last:border-0">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] shrink-0">
        {label}
      </span>
      <span className="text-sm text-[#333] text-right">{value}</span>
    </div>
  );
}

// ─── Material composition bar ──────────────────────────────────────────────

function MaterialBar({ materials }: { materials: PassportData["product_materials"] }) {
  const sorted = [...materials]
    .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
    .filter((m) => (m.percentage ?? 0) > 0);

  if (!sorted.length) return null;

  return (
    <div className="px-5 py-5 bg-white border-t border-[#f0f0ee]">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-3">
        Material Composition
      </p>
      {/* Bar */}
      <div className="h-2 rounded-full flex overflow-hidden mb-4 bg-[#f0f0ee]">
        {sorted.map((m, i) => (
          <div
            key={m.id}
            style={{ width: `${m.percentage}%`, background: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length] }}
            title={`${m.material_name}: ${m.percentage}%`}
          />
        ))}
      </div>
      {/* List */}
      <div className="space-y-0">
        {sorted.map((m, i) => (
          <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-[#f5f5f3] last:border-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length] }}
              />
              <span className="text-sm text-[#333] leading-snug">{m.material_name}</span>
              {m.fibre_origin && (
                <span className="text-[10px] text-[#8b8b8b] font-mono hidden sm:block">{m.fibre_origin}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(m.recycled_content_pct ?? 0) > 0 && (
                <span className="text-[9px] text-[#00933e] bg-[#cff2dd] px-1.5 py-0.5 rounded-md font-mono">
                  {m.recycled_content_pct}% recycled
                </span>
              )}
              {(m.bio_based_pct ?? 0) > 0 && (
                <span className="text-[9px] text-[#00933e] bg-[#cff2dd] px-1.5 py-0.5 rounded-md font-mono">
                  {m.bio_based_pct}% bio-based
                </span>
              )}
              <span className="text-sm font-medium text-[#333] tabular-nums">{m.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Care instructions — per-symbol accordion ──────────────────────────────

function CareSection({ instructions }: { instructions: PassportData["care_instructions"] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!instructions.length) return null;

  return (
    <div className="bg-white border-t border-[#f0f0ee]">
      <p className="px-5 pt-5 pb-3 text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b]">
        Care Instructions
      </p>
      {/* Symbol strip — tap each to expand */}
      <div className="px-5 pb-4 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {instructions.map((c) => {
          const label = CARE_LABELS[c.type] ?? c.type;
          const isOpen = openId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setOpenId(isOpen ? null : c.id)}
              className="flex flex-col items-center gap-1.5 shrink-0 transition-opacity"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${
                isOpen
                  ? "border-[#333] bg-[#333] shadow-sm"
                  : "border-[#e1e1e1] bg-[#fafaf8] hover:border-[#aaa]"
              }`}>
                <CareSymbolIcon type={c.type} active={isOpen} className="w-6 h-6" />
              </div>
              <span className={`text-[9px] font-mono uppercase tracking-wide transition-colors ${isOpen ? "text-[#333]" : "text-[#8b8b8b]"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Expanded instruction panel */}
      {openId && (() => {
        const item = instructions.find((c) => c.id === openId);
        if (!item) return null;
        const label = CARE_LABELS[item.type] ?? item.type;
        return (
          <div className="mx-5 mb-5 px-4 py-3.5 bg-[#f5f5f3] rounded-2xl border border-[#e8e8e8]">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-1.5">
              {label}
            </p>
            <p className="text-sm text-[#333] leading-relaxed">{item.instruction}</p>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Normalised material extras type ──────────────────────────────────────

interface MatExtras {
  dyeing_notes: string | null;
  finishing_notes: string | null;
  restricted_substances_ok: boolean | null;
  pfas_free: boolean | null;
  animal_derived: boolean;
  trim_notes: Record<string, string> | null;
}

function normaliseExtras(raw: unknown): MatExtras | null {
  if (!raw) return null;
  const src = Array.isArray(raw) ? raw[0] : raw;
  if (!src || typeof src !== "object") return null;
  const r = src as Record<string, unknown>;
  const trimRaw = r.trim_notes;
  const trim = trimRaw && typeof trimRaw === "object" && !Array.isArray(trimRaw)
    ? (trimRaw as Record<string, string>)
    : null;
  return {
    dyeing_notes:            (r.dyeing_notes as string | null) ?? null,
    finishing_notes:         (r.finishing_notes as string | null) ?? null,
    restricted_substances_ok:(r.restricted_substances_ok as boolean | null) ?? null,
    pfas_free:               (r.pfas_free as boolean | null) ?? null,
    animal_derived:          !!(r.animal_derived),
    trim_notes:              trim,
  };
}

// ─── Trims & finishing ─────────────────────────────────────────────────────

function TrimsSection({ extras }: { extras: MatExtras | null }) {
  if (!extras) return null;
  const trims = extras.trim_notes ?? {};
  const hasTrims = trims.buttons || trims.zips || trims.labels || trims.packaging;
  const hasDyeing = extras.dyeing_notes || extras.finishing_notes;
  if (!hasTrims && !hasDyeing) return null;

  return (
    <div className="px-5 py-5 bg-white border-t border-[#f0f0ee]">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-3">
        Trims &amp; Finishing
      </p>
      <div className="space-y-0">
        {trims.buttons   && <DataRow label="Buttons / fastenings" value={trims.buttons} />}
        {trims.zips      && <DataRow label="Zips"                 value={trims.zips} />}
        {trims.labels    && <DataRow label="Labels"               value={trims.labels} />}
        {trims.packaging && <DataRow label="Packaging"            value={trims.packaging} />}
        {extras.dyeing_notes    && <DataRow label="Dyeing"    value={extras.dyeing_notes} />}
        {extras.finishing_notes && <DataRow label="Finishing" value={extras.finishing_notes} />}
      </div>
    </div>
  );
}

// ─── Chemical compliance ───────────────────────────────────────────────────

function ChemicalCompliance({ extras }: { extras: MatExtras | null }) {
  if (!extras) return null;
  const { restricted_substances_ok, pfas_free, animal_derived } = extras;
  if (!restricted_substances_ok && !pfas_free && !animal_derived) return null;

  return (
    <div className="px-5 py-5 bg-white border-t border-[#f0f0ee]">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-3">
        Chemical Compliance
      </p>
      <div className="space-y-2.5">
        {restricted_substances_ok && (
          <div className="flex items-start gap-3 p-3 bg-[#f0faf5] border border-[#cff2dd] rounded-xl">
            <CheckCircle className="h-4 w-4 text-[#00933e] shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-[#333]">REACH / restricted substances compliant</p>
              <p className="text-xs text-[#8b8b8b] mt-0.5">No SVHCs above threshold</p>
            </div>
          </div>
        )}
        {pfas_free && (
          <div className="flex items-start gap-3 p-3 bg-[#f0faf5] border border-[#cff2dd] rounded-xl">
            <CheckCircle className="h-4 w-4 text-[#00933e] shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-[#333]">No PFAS / fluorochemical treatments</p>
              <p className="text-xs text-[#8b8b8b] mt-0.5">Free from per- and polyfluoroalkyl substances</p>
            </div>
          </div>
        )}
        {animal_derived && (
          <div className="flex items-start gap-3 p-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl">
            <AlertCircle className="h-4 w-4 text-[#d97706] shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-[#333]">Contains animal-derived materials</p>
              <p className="text-xs text-[#8b8b8b] mt-0.5">Wool, leather, silk, cashmere, down, or similar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Durability section ────────────────────────────────────────────────────

const REPAIRABILITY_LABELS: Record<number, string> = {
  5: "Fully repairable",
  4: "Mostly repairable",
  3: "Partially repairable",
  2: "Difficult to repair",
  1: "Not repairable",
};

function DurabilitySection({ passport }: { passport: PassportData }) {
  const { repairability_score, spare_parts_available, warranty_info, repair_instructions } = passport;
  const hasAny = repairability_score != null || spare_parts_available || warranty_info || repair_instructions;
  if (!hasAny) return null;

  return (
    <div className="px-5 py-5 bg-white border-t border-[#f0f0ee]">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-3">
        Durability &amp; Repair
      </p>
      <div className="space-y-0">
        {repairability_score != null && (
          <DataRow
            label="Repairability"
            value={`${repairability_score}/5 — ${REPAIRABILITY_LABELS[repairability_score] ?? ""}`}
          />
        )}
        {spare_parts_available && (
          <div className="flex items-center gap-2 py-3 border-b border-[#f0f0ee] last:border-0">
            <CheckCircle className="h-3.5 w-3.5 text-[#00933e] shrink-0" strokeWidth={2} />
            <span className="text-sm text-[#333]">Spare parts available</span>
          </div>
        )}
        {warranty_info && (
          <DataRow label="Warranty" value={warranty_info} />
        )}
        {repair_instructions && (
          <div className="py-3 last:border-0">
            <a
              href={repair_instructions}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#0e6dea] underline underline-offset-2"
            >
              <Wrench className="h-3.5 w-3.5" strokeWidth={2} />
              Repair guide
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Gallery ───────────────────────────────────────────────────────────────

function GallerySection({ images }: { images: string[] }) {
  const [selected, setSelected] = useState(0);
  if (!images.length) return null;

  return (
    <div className="bg-white border-t border-[#f0f0ee]">
      <p className="px-5 pt-5 pb-3 text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b]">
        Gallery
      </p>
      {images[selected] && (
        <div className="mx-5 aspect-square bg-[#ebebeb] rounded-xl overflow-hidden mb-3">
          <Image
            src={images[selected]}
            alt={`Gallery image ${selected + 1}`}
            width={400}
            height={400}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {images.length > 1 && (
        <div className="px-5 pb-5 flex gap-2 overflow-x-auto">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === selected ? "border-[#333]" : "border-transparent opacity-60"
              }`}
            >
              <Image src={url} alt="" width={56} height={56} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Core metric meta helper type ─────────────────────────────────────────

type MetaObj = {
  benchmark_value?: number | null;
  avoided_value?: number | null;
  savings_percentage?: number | null;
  scope?: string | null;
  source_name?: string | null;
  source_method?: string | null;
  evidence_url?: string | null;
  verification_status?: ImpactMetric["verification_status"];
  explanation?: string | null;
  display_public?: boolean;
} | null | undefined;

function asMeta(v: unknown): MetaObj {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as MetaObj;
  return null;
}

// ─── Metric helpers ────────────────────────────────────────────────────────

function publicMetricIcon(type: MetricType | null | undefined): React.ElementType {
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

const PUBLIC_METRIC_BG: Record<string, string> = {
  carbon:        "bg-[#edf2eb]",
  water:         "bg-[#e8f0f5]",
  energy:        "bg-[#fef6ed]",
  transport:     "bg-[#eef0f9]",
  waste:         "bg-[#fbeaea]",
  circularity:   "bg-[#e8f5f3]",
  packaging:     "bg-[#fdf1e8]",
  biodiversity:  "bg-[#eaf2e8]",
  repairability: "bg-[#f1eef9]",
  other:         "bg-[#ebebeb]",
};

function VerifBadge({ status }: { status: ImpactMetric["verification_status"] }) {
  if (!status || status === "claimed") return null;
  if (status === "third_party_verified") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
        <Shield className="h-3 w-3" />3rd party verified
      </span>
    );
  }
  if (status === "verified") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <Check className="h-3 w-3" />Verified
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-[#555] bg-[#f4f4f2] border border-[#e8e8e6] rounded-full px-2 py-0.5">
      <Paperclip className="h-3 w-3" />Evidence provided
    </span>
  );
}

// ─── Metric card ───────────────────────────────────────────────────────────

interface MetricCardExtras {
  benchmarkValue?: number | null;
  avoidedValue?: number | null;
  savingsPercentage?: number | null;
  explanation?: string | null;
  scope?: string | null;
  sourceName?: string | null;
  sourceMethod?: string | null;
  evidenceUrl?: string | null;
  verificationStatus?: ImpactMetric["verification_status"];
}

function MetricCard({
  icon: Icon, label, value, unit, bg, source, detail, extras,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  bg: string;
  source?: string;
  detail?: string;
  extras?: MetricCardExtras;
}) {
  const [open, setOpen] = useState(false);
  const hasExpanded = source || detail || extras?.explanation || extras?.benchmarkValue != null
    || extras?.avoidedValue != null || extras?.savingsPercentage != null
    || extras?.scope || extras?.sourceName || extras?.evidenceUrl;

  function sourceLabel(s?: string) {
    if (!s) return null;
    if (s === "verified") return "Third-party verified";
    if (s === "supplier_declared") return "Supplier declared";
    return "Brand declared estimate";
  }

  // "Evidence attached" only shows if an evidence URL was actually provided
  const effectiveVerifStatus = extras?.verificationStatus === "evidence_attached" && !extras?.evidenceUrl
    ? null
    : (extras?.verificationStatus ?? null);

  return (
    <div className={`rounded-2xl overflow-hidden ${bg}`}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <Icon className="h-5 w-5 text-[#555]" strokeWidth={1.5} />
          {effectiveVerifStatus && <VerifBadge status={effectiveVerifStatus} />}
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#666] mb-1.5">{label}</p>
        <p className="text-4xl font-light text-[#222] tracking-tight">{value}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-sm text-[#666]">{unit}</p>
          {extras?.scope && (
            <span className="text-[10px] font-mono text-[#8b8b8b] border border-black/10 rounded-full px-2 py-0.5">
              {extras.scope}
            </span>
          )}
        </div>
      </div>
      {hasExpanded && (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full px-5 py-3 flex items-center justify-between border-t border-black/[0.06] text-sm text-[#444]"
          >
            <span>Learn more</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="px-5 pb-5 pt-3 border-t border-black/[0.06] space-y-2">
              {detail && <p className="text-sm text-[#555] leading-relaxed">{detail}</p>}
              {extras?.explanation && (
                <p className="text-sm text-[#555] leading-relaxed">{extras.explanation}</p>
              )}
              {extras?.benchmarkValue != null && (
                <p className="text-xs text-[#666]">
                  Industry benchmark: <span className="font-medium">{extras.benchmarkValue} {unit}</span>
                </p>
              )}
              {extras?.avoidedValue != null && (
                <p className="text-xs text-[#666]">
                  Avoided: <span className="font-medium">{extras.avoidedValue} {unit}</span>
                </p>
              )}
              {extras?.savingsPercentage != null && (
                <p className="text-xs text-[#666]">
                  <span className="font-medium text-emerald-700">{extras.savingsPercentage}% saving</span> vs industry benchmark
                </p>
              )}
              {(extras?.sourceName || extras?.sourceMethod || source) && (
                <p className="text-[10px] font-mono text-[#8b8b8b] uppercase tracking-wide">
                  {[extras?.sourceName, extras?.sourceMethod ?? sourceLabel(source)].filter(Boolean).join(" · ")}
                </p>
              )}
              {extras?.evidenceUrl && (
                <a
                  href={extras.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#0e6dea] hover:underline"
                >
                  <Paperclip className="h-3 w-3" />View evidence
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Certification logo map ────────────────────────────────────────────────

// gots.png is not present in public/cert-logos — omitted so GOTS shows the shield fallback gracefully
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

function CertLogoOrShield({ name, customLogoUrl }: { name: string; customLogoUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const logoPath = customLogoUrl || CERT_LOGO[name];
  if (!logoPath || imgError) return <ShieldCheck className="h-5 w-5 text-[#00933e]" strokeWidth={1.5} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoPath} alt={name} className="w-9 h-9 object-contain" onError={() => setImgError(true)} />
  );
}

// ─── Certification card ────────────────────────────────────────────────────

function CertCard({ cert }: { cert: PassportData["product_certifications"][0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
      <div className="p-4 flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#f5f5f3] flex items-center justify-center shrink-0 overflow-hidden">
          <CertLogoOrShield name={cert.certification_name} customLogoUrl={cert.custom_logo_url} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#333] leading-snug">{cert.certification_name}</p>
          {cert.issued_by && <p className="text-xs text-[#8b8b8b] mt-0.5">{cert.issued_by}</p>}
          {cert.description && (
            <p className="text-xs text-[#555] leading-relaxed mt-1.5">{cert.description}</p>
          )}
          <div className="mt-1.5">
            <ConfidenceBadge level={cert.confidence_level} />
          </div>
        </div>
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3 flex items-center justify-between border-t border-[#f0f0ee] text-sm text-[#444]"
      >
        <span>Learn more</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-[#f0f0ee] text-sm text-[#555] leading-relaxed space-y-1.5">
          {cert.certificate_number && (
            <p className="font-mono text-xs text-[#8b8b8b]">Cert #{cert.certificate_number}</p>
          )}
          {cert.claim_type && <p>Claim type: {cert.claim_type}</p>}
          <p>
            {cert.expires_at
              ? `Valid until ${new Date(cert.expires_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.`
              : "No expiry date recorded."}
          </p>
          {cert.document_url && (
            <a href={cert.document_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#0e6dea] text-xs font-medium hover:underline">
              <ExternalLink className="h-3 w-3" />View certificate
            </a>
          )}
          {cert.verification_url && (
            <a href={cert.verification_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#0e6dea] text-xs font-medium hover:underline">
              <ExternalLink className="h-3 w-3" />Verify online
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Timeline node ─────────────────────────────────────────────────────────

function TimelineNode({
  facility,
  isLast,
  index,
}: {
  facility: PassportData["product_facilities"][0];
  isLast: boolean;
  index: number;
}) {
  const flag = facility.country ? (COUNTRY_FLAGS[facility.country] ?? "🌍") : null;
  return (
    <div className="flex gap-5 items-start">
      {/* Track */}
      <div className="flex flex-col items-center self-stretch pt-1">
        <div className="w-3 h-3 rounded-full bg-[#333] ring-4 ring-[#fdfaf7] shrink-0" />
        {!isLast && (
          <div
            className="flex-1 mt-1"
            style={{ width: 2, borderLeft: "2px dashed #cccccc", minHeight: 40 }}
          />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {flag && <span className="text-base">{flag}</span>}
                <p className="text-sm font-medium text-[#333] leading-snug">
                  {facility.facility_name || "Unnamed facility"}
                </p>
              </div>
              {(facility.city || facility.country) && (
                <div className="flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3 text-[#8b8b8b] shrink-0" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#8b8b8b]">
                    {[facility.city, facility.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {facility.process_stage && (
                <span className="text-[10px] font-mono text-[#333] border border-[#cccccc] rounded-lg px-2 py-0.5">
                  {normalizeProcessStage(facility.process_stage)}
                </span>
              )}
            </div>
          </div>
          {(facility.facility_certifications ?? []).filter(c => c.name).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(facility.facility_certifications ?? []).filter(c => c.name).map((c, i) =>
                c.url ? (
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 text-[10px] font-mono text-[#0e6dea] border border-[#b3d4f7] rounded px-1.5 py-0.5 hover:bg-[#f0f7ff] transition-colors">
                    {c.name}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ) : (
                  <span key={i} className="text-[10px] font-mono text-[#333] border border-[#cccccc] rounded px-1.5 py-0.5">
                    {c.name}
                  </span>
                )
              )}
            </div>
          )}
          {facility.confidence_level && (
            <ConfidenceBadge level={facility.confidence_level} />
          )}
          {facility.website_url && (
            <div className="mt-3">
              <a
                href={facility.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#e8e8e8] text-xs font-medium text-[#333] hover:border-[#333] hover:bg-[#f5f5f3] transition-colors"
              >
                <ExternalLink className="h-3 w-3 text-[#8b8b8b]" />
                Visit factory website
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UP NEXT ───────────────────────────────────────────────────────────────

function UpNext({ nextTab, onNavigate }: { nextTab: Tab | null; onNavigate: (t: Tab) => void }) {
  if (!nextTab) return null;
  return (
    <div className="flex flex-col items-center py-12 gap-2.5 bg-white border-t border-[#f0f0ee] mt-0.5">
      <p className="text-[9px] font-mono uppercase tracking-widest text-[#8b8b8b]">Up next</p>
      <button
        onClick={() => { onNavigate(nextTab); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className="flex items-center gap-2.5 text-lg font-medium text-[#333] hover:text-[#111] transition-colors"
      >
        {nextTab}
        <span className="w-9 h-9 rounded-full bg-[#0e6dea] flex items-center justify-center shadow-sm">
          <ChevronRight className="h-4 w-4 text-white" />
        </span>
      </button>
    </div>
  );
}

// ─── Video embed ───────────────────────────────────────────────────────────

function VideoSection({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  if (!url) return null;

  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
  const isVimeo = url.includes("vimeo.com");

  if (isYoutube || isVimeo) {
    const embedUrl = isYoutube
      ? `https://www.youtube.com/embed/${url.split("v=")[1]?.split("&")[0] ?? url.split("/").pop()}`
      : `https://player.vimeo.com/video/${url.split("/").pop()}`;

    return (
      <div className="bg-white border-t border-[#f0f0ee] px-5 py-5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-3">Video</p>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          {playing ? (
            <iframe
              src={`${embedUrl}?autoplay=1`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              title="Product video"
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center w-full h-full group"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Play className="h-7 w-7 text-white ml-1" fill="white" />
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main component ────────────────────────────────────────────────────────

export function PublicPassportPage({ passport, previewMode = false }: { passport: PassportData; previewMode?: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("Product");

  const brand = passport.brands;
  // Per-passport brand identity override (set only by demo accounts) takes precedence
  const displayBrandName = passport.brand_name_override || brand.name;
  const displayBrandLogo = passport.brand_logo_override || brand.logo_url;
  const claims = Array.isArray(passport.sustainability_claims)
    ? (passport.sustainability_claims as string[])
    : [];
  const evidenceUrls = (passport.claim_evidence_urls as Record<string, string>) ?? {};
  const EVIDENCE_REQUIRED_CLAIM_SET = new Set([
    "Carbon-neutral production", "Made from organic materials",
    "Contains recycled content", "Renewable energy used in production",
    "Fair wages paid", "Zero waste manufacturing",
  ]);
  // Verified = predefined evidence-required claim WITH url, OR custom claim that has a key in
  // evidenceUrls (even "") AND a non-empty url — matches builder categorisation logic exactly.
  const verifiedClaims = claims.filter(
    (c) =>
      (EVIDENCE_REQUIRED_CLAIM_SET.has(c) || Object.prototype.hasOwnProperty.call(evidenceUrls, c)) &&
      evidenceUrls[c]
  );
  const selfDeclaredClaims = claims.filter(
    (c) =>
      !EVIDENCE_REQUIRED_CLAIM_SET.has(c) &&
      !Object.prototype.hasOwnProperty.call(evidenceUrls, c)
  );

  const nextTab = TAB_SEQUENCE[TAB_SEQUENCE.indexOf(activeTab) + 1] ?? null;

  const sortedFacilities = [...passport.product_facilities].sort((a, b) => {
    const stageA = normalizeProcessStage(a.process_stage);
    const stageB = normalizeProcessStage(b.process_stage);
    return (SUPPLIER_TYPE_ORDER[stageA] ?? 99) - (SUPPLIER_TYPE_ORDER[stageB] ?? 99);
  });

  const originCountry = passport.country_of_origin
    || [...passport.product_facilities]
      .sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99))[0]?.country
    || "";

  const composition = passport.product_materials.length > 0
    ? passport.product_materials
        .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))
        .map((m) => `${m.percentage ?? "?"}% ${m.material_name}`)
        .join(", ")
    : "";

  const allGallery = [
    ...(passport.gallery_image_urls ?? []),
    ...(passport.additional_image_urls ?? []),
  ].filter(Boolean);

  const matExtras = normaliseExtras(passport.passport_material_extras);

  const brandDomain = brand.website_url
    ? (() => { try { return new URL(brand.website_url).hostname.replace("www.", ""); } catch { return brand.name; } })()
    : null;

  return (
    <div className="min-h-screen bg-[#fdfaf7] font-sans">

      {/* ── Sticky header ──────────────────────────────────────── */}
      <header className={`sticky z-30 bg-white/95 backdrop-blur-sm border-b border-[#e8e8e8] ${previewMode ? "top-8" : "top-0"}`}>
        <div className="max-w-[430px] mx-auto px-5 h-14 flex items-center justify-between gap-3">
          {displayBrandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayBrandLogo}
              alt={displayBrandName}
              className="h-8 w-auto object-contain object-left"
            />
          ) : (
            <span className="text-[15px] font-bold tracking-tight text-[#111] uppercase">
              {displayBrandName}
            </span>
          )}
          <div className="flex flex-col items-end gap-0.5 text-[8px] text-[#d0d0d0] shrink-0">
            <span className="font-normal">powered by</span>
            <Image
              src="/logo-dark.png"
              alt="Known Objects"
              width={80}
              height={18}
              className="h-3 w-auto object-contain opacity-60"
            />
          </div>
        </div>
      </header>

      {/* ── Product identity strip — always visible ─────────────── */}
      <div className="max-w-[430px] mx-auto bg-white border-b border-[#e8e8e8]">
        <div className="px-5 pt-5 pb-4">
          <h1 className="text-[22px] font-medium text-[#111] leading-tight tracking-tight">
            {passport.product_name}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {passport.passport_code && (
              <span className="font-mono text-xs text-[#8b8b8b]">{passport.passport_code}</span>
            )}
            <span className="flex items-center gap-1 text-xs text-[#00933e] font-medium">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
              AUTHENTIC
            </span>
            {passport.product_url && brandDomain && (
              <a
                href={passport.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#555] underline underline-offset-2 ml-auto"
              >
                View on {brandDomain}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable tab content ──────────────────────────────── */}
      <div className="max-w-[430px] mx-auto pb-28">

        {/* ══ PRODUCT TAB ════════════════════════════════════════ */}
        {activeTab === "Product" && (
          <div>
            {/* Hero image — Product tab only */}
            {passport.primary_image_url ? (
              <div className="w-full aspect-[4/5] bg-[#fafaf8] flex items-center justify-center overflow-hidden p-8">
                <Image
                  src={passport.primary_image_url}
                  alt={passport.product_name}
                  width={430}
                  height={540}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/5] bg-[#f5f5f3] flex items-center justify-center text-[#ccc] text-sm">
                No image
              </div>
            )}

            {/* Description */}
            {passport.product_description && (
              <div className="px-5 py-5 bg-white border-t border-[#f0f0ee] mt-0.5">
                <p className="text-sm text-[#444] leading-relaxed">{passport.product_description}</p>
              </div>
            )}

            {/* Care instructions — moved up, right after description */}
            <CareSection instructions={passport.care_instructions} />

            {/* Durability & repair */}
            <DurabilitySection passport={passport} />

            {/* Material composition visual */}
            <MaterialBar materials={passport.product_materials} />

            {/* Product data rows */}
            <div className="px-5 py-1 bg-white border-t border-[#f0f0ee] mt-0.5">
              <DataRow label="Category"          value={passport.category ?? ""} />
              <DataRow label="Colour"            value={passport.colour ?? ""} />
              <DataRow label="Size"              value={passport.size_range ?? ""} />
              <DataRow label="Gender"            value={passport.gender ?? ""} />
              <DataRow label="Composition"       value={composition} />
              <DataRow label="Country of origin" value={originCountry} />
              <DataRow label="Collection"        value={passport.collection_name ?? ""} />
              <DataRow label="Season"            value={passport.season ?? ""} />
              {passport.made_to_order ? (
                <DataRow label="Manufactured" value="Made to order" />
              ) : passport.manufacturing_date ? (
                <DataRow
                  label="Manufactured"
                  value={(() => {
                    const parts = passport.manufacturing_date!.split("-");
                    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
                    return parts.length >= 2 ? `${months[parseInt(parts[1], 10) - 1]} ${parts[0]}` : passport.manufacturing_date!;
                  })()}
                />
              ) : null}
              {passport.product_weight_g != null && (
                <DataRow label="Weight" value={`${passport.product_weight_g} g`} />
              )}
              {passport.product_lifetime_years != null && (
                <DataRow label="Expected lifetime" value={`${passport.product_lifetime_years} years`} />
              )}
              <DataRow label="GTIN / Barcode" value={passport.gtin ?? ""} />
              <DataRow label="Batch ID"       value={passport.batch_id ?? ""} />
            </div>

            {/* Trims & finishing */}
            <TrimsSection extras={matExtras} />

            {/* Chemical compliance */}
            <ChemicalCompliance extras={matExtras} />

            {/* Gallery */}
            {allGallery.length > 0 && <GallerySection images={allGallery} />}

            {/* Transparency note */}
            {passport.consumer_transparency_summary && (
              <div className="px-5 py-5 mt-0.5 bg-white border-t border-[#f0f0ee]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-2">
                  Transparency Note
                </p>
                <p className="text-sm text-[#444] leading-relaxed">
                  {passport.consumer_transparency_summary}
                </p>
              </div>
            )}

            {/* Similar products strip */}
            {(passport.similar_products ?? []).filter(p => p.name || p.image_url).length > 0 && (
              <div className="bg-white border-t border-[#f0f0ee] mt-0.5">
                <p className="px-5 pt-5 pb-3 text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b]">
                  We think you might also like these products
                </p>
                <div className="px-5 pb-5 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {(passport.similar_products ?? []).filter(p => p.name || p.image_url).map((p, i) => (
                    <a
                      key={i}
                      href={p.url || undefined}
                      target={p.url ? "_blank" : undefined}
                      rel={p.url ? "noopener noreferrer" : undefined}
                      className={`shrink-0 w-36 group ${p.url ? "cursor-pointer" : ""}`}
                    >
                      <div className="w-36 h-36 rounded-2xl bg-[#f5f5f3] overflow-hidden mb-2 border border-[#e8e8e8] group-hover:border-[#ccc] transition-colors">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <p className="text-sm text-[#333] leading-snug line-clamp-2 group-hover:text-black transition-colors">{p.name}</p>
                      {p.rrp && <p className="text-xs font-medium text-[#0e6dea] mt-1">{p.rrp}</p>}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <UpNext nextTab={nextTab} onNavigate={setActiveTab} />
          </div>
        )}

        {/* ══ IMPACT TAB ══════════════════════════════════════════ */}
        {activeTab === "Impact" && (
          <div>
            {/* Sustainability summary — hero section at top */}
            {passport.sustainability_summary && (
              <div className="mx-5 mt-6 rounded-2xl bg-gradient-to-br from-[#f0faf5] to-[#e6f6ef] border border-[#b8e8cc] px-5 py-5 relative overflow-hidden">
                <div className="absolute top-3 right-4 opacity-10">
                  <Leaf className="h-16 w-16 text-[#00933e]" strokeWidth={1} />
                </div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Leaf className="h-3.5 w-3.5 text-[#00933e]" strokeWidth={2} />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#00933e]">Our Impact</p>
                </div>
                <p className="text-[15px] text-[#1a4a2e] leading-relaxed font-medium relative">
                  {passport.sustainability_summary}
                </p>
              </div>
            )}

            {((passport.carbon_footprint_kg && asMeta(passport.carbon_meta)?.display_public !== false) || (passport.water_usage_litres && asMeta(passport.water_meta)?.display_public !== false) || (passport.energy_use_kwh && asMeta(passport.energy_meta)?.display_public !== false) || passport.impact_metrics.filter((m) => m.display_public !== false).length > 0) && (
              <div className="px-5 pt-6 pb-2">
                <h2 className="text-2xl font-medium text-[#111] mb-5 tracking-tight">
                  Environmental<br />Impact
                </h2>
                <div className="space-y-3">
                  {passport.carbon_footprint_kg && (asMeta(passport.carbon_meta)?.display_public !== false) && (
                    <MetricCard
                      icon={Wind}
                      label="Carbon footprint"
                      value={passport.carbon_footprint_kg}
                      unit="kg CO₂e"
                      bg="bg-[#ebebeb]"
                      detail={asMeta(passport.carbon_meta)?.explanation || "Estimated carbon footprint across raw materials, production, and transport."}
                      extras={{
                        benchmarkValue: asMeta(passport.carbon_meta)?.benchmark_value ?? null,
                        avoidedValue: asMeta(passport.carbon_meta)?.avoided_value ?? null,
                        savingsPercentage: asMeta(passport.carbon_meta)?.savings_percentage ?? null,
                        scope: asMeta(passport.carbon_meta)?.scope ?? null,
                        sourceName: asMeta(passport.carbon_meta)?.source_name ?? null,
                        sourceMethod: asMeta(passport.carbon_meta)?.source_method ?? null,
                        evidenceUrl: asMeta(passport.carbon_meta)?.evidence_url ?? null,
                        verificationStatus: asMeta(passport.carbon_meta)?.verification_status ?? null,
                      }}
                    />
                  )}
                  {passport.water_usage_litres && (asMeta(passport.water_meta)?.display_public !== false) && (
                    <MetricCard
                      icon={Droplets}
                      label="Water usage"
                      value={passport.water_usage_litres.toLocaleString()}
                      unit="litres"
                      bg="bg-[#e8f0f5]"
                      detail={asMeta(passport.water_meta)?.explanation || "Water consumed across dyeing, finishing, and production stages."}
                      extras={{
                        benchmarkValue: asMeta(passport.water_meta)?.benchmark_value ?? null,
                        avoidedValue: asMeta(passport.water_meta)?.avoided_value ?? null,
                        savingsPercentage: asMeta(passport.water_meta)?.savings_percentage ?? null,
                        scope: asMeta(passport.water_meta)?.scope ?? null,
                        sourceName: asMeta(passport.water_meta)?.source_name ?? null,
                        sourceMethod: asMeta(passport.water_meta)?.source_method ?? null,
                        evidenceUrl: asMeta(passport.water_meta)?.evidence_url ?? null,
                        verificationStatus: asMeta(passport.water_meta)?.verification_status ?? null,
                      }}
                    />
                  )}
                  {passport.energy_use_kwh && (asMeta(passport.energy_meta)?.display_public !== false) && (
                    <MetricCard
                      icon={Zap}
                      label="Energy use"
                      value={passport.energy_use_kwh.toLocaleString()}
                      unit={passport.energy_unit || "kWh"}
                      bg="bg-[#fef6ed]"
                      detail={asMeta(passport.energy_meta)?.explanation || "Energy consumed across production and processing stages."}
                      extras={{
                        benchmarkValue: asMeta(passport.energy_meta)?.benchmark_value ?? null,
                        avoidedValue: asMeta(passport.energy_meta)?.avoided_value ?? null,
                        savingsPercentage: asMeta(passport.energy_meta)?.savings_percentage ?? null,
                        scope: asMeta(passport.energy_meta)?.scope ?? null,
                        sourceName: asMeta(passport.energy_meta)?.source_name ?? null,
                        sourceMethod: asMeta(passport.energy_meta)?.source_method ?? null,
                        evidenceUrl: asMeta(passport.energy_meta)?.evidence_url ?? null,
                        verificationStatus: asMeta(passport.energy_meta)?.verification_status ?? null,
                      }}
                    />
                  )}
                  {passport.impact_metrics
                    .filter((m) => m.display_public !== false)
                    .map((m) => (
                      <MetricCard
                        key={m.id}
                        icon={publicMetricIcon(m.metric_type)}
                        label={m.label ?? m.metric_key}
                        value={m.metric_value ?? "—"}
                        unit={m.metric_unit ?? ""}
                        bg={PUBLIC_METRIC_BG[m.metric_type ?? ""] ?? "bg-[#ebebeb]"}
                        extras={{
                          benchmarkValue: m.benchmark_value,
                          avoidedValue: m.avoided_value,
                          savingsPercentage: m.savings_percentage,
                          explanation: m.explanation,
                          scope: m.metric_scope,
                          sourceName: m.source_name,
                          sourceMethod: m.source_method,
                          evidenceUrl: m.evidence_url,
                          verificationStatus: m.verification_status,
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            {verifiedClaims.length > 0 && (
              <div className="px-5 pt-5 pb-4 bg-white border-t border-[#f0f0ee] mt-0.5">
                <div className="flex items-center gap-1.5 mb-3">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b]">
                    Verified claims
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {verifiedClaims.map((claim, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full"
                    >
                      <ShieldCheck className="h-3 w-3 shrink-0" strokeWidth={2} />
                      {claim}
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-[#555] bg-[#f4f4f2] border border-[#e8e8e6] px-1.5 py-0.5 rounded-full ml-0.5">
                        <Paperclip className="h-2.5 w-2.5 shrink-0" />Evidence provided
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selfDeclaredClaims.length > 0 && (
              <div className="px-5 pt-5 pb-4 bg-white border-t border-[#f0f0ee] mt-0.5">
                <div className="flex items-center gap-1.5 mb-3">
                  <Leaf className="h-3.5 w-3.5 text-[#525252]" strokeWidth={2} />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b]">
                    Self-declared claims
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selfDeclaredClaims.map((claim, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs text-[#00933e] bg-[#f0faf5] border border-[#cff2dd] px-3 py-1.5 rounded-full"
                    >
                      <Leaf className="h-3 w-3" strokeWidth={2} />
                      {claim}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const evidencedCerts = passport.product_certifications.filter(
                (c) => c.document_url || c.verification_url
              );
              return evidencedCerts.length > 0 ? (
                <div className="px-5 pt-6 pb-4">
                  <h2 className="text-2xl font-medium text-[#111] mb-4 tracking-tight">
                    Certifications
                  </h2>
                  <div className="space-y-3">
                    {evidencedCerts.map((cert) => (
                      <CertCard key={cert.id} cert={cert} />
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {!(passport.carbon_footprint_kg && asMeta(passport.carbon_meta)?.display_public !== false) && !(passport.water_usage_litres && asMeta(passport.water_meta)?.display_public !== false) && !(passport.energy_use_kwh && asMeta(passport.energy_meta)?.display_public !== false) && !passport.impact_metrics.filter((m) => m.display_public !== false).length && !verifiedClaims.length && !selfDeclaredClaims.length && !passport.sustainability_summary && !passport.product_certifications.filter((c) => c.document_url || c.verification_url).length && (
              <div className="px-5 py-16 text-center">
                <p className="text-sm text-[#8b8b8b]">No impact data available for this product.</p>
              </div>
            )}

            <UpNext nextTab={nextTab} onNavigate={setActiveTab} />
          </div>
        )}

        {/* ══ STORY TAB ═══════════════════════════════════════════ */}
        {activeTab === "Story" && (
          <div>
            {/* Product Origins timeline */}
            {sortedFacilities.length > 0 && (
              <div className="px-5 pt-6 pb-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-4">
                  Where this product came from · {sortedFacilities.length} supplier{sortedFacilities.length !== 1 ? "s" : ""}
                </p>
                <div>
                  {sortedFacilities.map((f, idx) => (
                    <TimelineNode
                      key={f.id}
                      facility={f}
                      isLast={idx === sortedFacilities.length - 1}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Our Story — editorial hero */}
            {passport.product_story && (
              <div className="px-5 pt-8 pb-8 bg-white border-t border-[#f0f0ee]">
                <h2 className="text-[32px] font-medium text-[#111] tracking-tight leading-none mb-4">
                  Our story
                </h2>
                <div className="w-8 h-[2px] bg-[#333] mb-5" />
                <p className="text-base text-[#444] leading-relaxed whitespace-pre-line">
                  {passport.product_story}
                </p>
              </div>
            )}

            {/* Product story image */}
            {passport.product_story_image_url && (
              <div className="w-full aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={passport.product_story_image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* The Makers — same editorial title style as Our Story */}
            {passport.maker_story && (
              <div className="px-5 pt-8 pb-8 bg-white border-t border-[#f0f0ee]">
                <h2 className="text-[32px] font-medium text-[#111] tracking-tight leading-none mb-4">
                  The makers
                </h2>
                <div className="w-8 h-[2px] bg-[#333] mb-5" />
                <p className="text-base text-[#444] leading-relaxed whitespace-pre-line">
                  {passport.maker_story}
                </p>
              </div>
            )}

            {/* Makers image */}
            {passport.makers_image_url && (
              <div className="w-full aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={passport.makers_image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {/* See The Journey — video */}
            {passport.video_url && (
              <div className="bg-white border-t border-[#f0f0ee]">
                <div className="px-5 pt-8 pb-4">
                  <h2 className="text-2xl font-medium text-[#111] tracking-tight mb-1">
                    See the journey
                  </h2>
                  {passport.product_name && (
                    <p className="text-sm text-[#8b8b8b]">
                      Watch how the {passport.product_name} comes to life.
                    </p>
                  )}
                </div>
                <VideoSection url={passport.video_url} />
              </div>
            )}

            {/* Brand story — fallback if present */}
            {passport.brand_story && !passport.product_story && (
              <div className="px-5 py-6 bg-white border-t border-[#f0f0ee]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-3">
                  About {brand.name}
                </p>
                <p className="text-sm text-[#444] leading-relaxed whitespace-pre-line">
                  {passport.brand_story}
                </p>
              </div>
            )}

            {sortedFacilities.length === 0 &&
              !passport.product_story && !passport.maker_story &&
              !passport.product_story_image_url && !passport.makers_image_url &&
              !passport.video_url && !passport.brand_story && (
                <div className="px-5 py-16 text-center">
                  <p className="text-sm text-[#8b8b8b]">No story content available for this product.</p>
                </div>
              )}

            <UpNext nextTab={nextTab} onNavigate={setActiveTab} />
          </div>
        )}

        {/* ══ ACTIONS TAB ════════════════════════════════════════ */}
        {activeTab === "Actions" && (
          <div>
            {passport.circularity_actions.length === 0 &&
             !passport.recyclability && !passport.recycling_instructions && !passport.end_of_life_guidance ? (
              <div className="px-5 py-16 text-center">
                <p className="text-sm text-[#8b8b8b]">No circularity options available yet.</p>
              </div>
            ) : (
              <div>
                {passport.circularity_actions.length > 0 && (
                  <>
                    <div className="px-5 pt-6 pb-2">
                      <h2 className="text-2xl font-medium text-[#111] tracking-tight">
                        Give it a<br />new life.
                      </h2>
                    </div>
                    {passport.circularity_actions.map((action) => (
                      <div
                        key={action.id}
                        className="px-5 pt-5 pb-6 bg-white border-t border-[#f0f0ee] mt-0.5 first:mt-0"
                      >
                        <h3 className="text-xl font-medium text-[#111] capitalize mb-2">
                          {action.title}
                        </h3>
                        {action.description && (
                          <p className="text-sm text-[#555] leading-relaxed mb-5">
                            {action.description}
                          </p>
                        )}
                        {action.url && (
                          <a
                            href={action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#0e6dea] text-white text-sm font-medium hover:bg-[#5698ee] transition-colors"
                          >
                            Get started
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {/* End of life information */}
                {(passport.recyclability || passport.recycling_instructions || passport.end_of_life_guidance) && (
                  <div className="px-5 py-5 bg-white border-t border-[#f0f0ee] mt-0.5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#8b8b8b] mb-3">
                      End of Life
                    </p>
                    {passport.recyclability && (
                      <div className="mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                          passport.recyclability === "recyclable"
                            ? "bg-[#f0faf5] text-[#00933e] border border-[#cff2dd]"
                            : passport.recyclability === "partially_recyclable"
                            ? "bg-[#fffbeb] text-[#d97706] border border-[#fde68a]"
                            : "bg-[#f5f5f3] text-[#8b8b8b] border border-[#e8e8e8]"
                        }`}>
                          <RefreshCw className="h-3 w-3" strokeWidth={2} />
                          {passport.recyclability === "recyclable" ? "Recyclable"
                            : passport.recyclability === "partially_recyclable" ? "Partially recyclable"
                            : "Not currently recyclable"}
                        </span>
                      </div>
                    )}
                    {passport.recycling_instructions && (
                      <p className="text-sm text-[#444] leading-relaxed mb-3">
                        {passport.recycling_instructions}
                      </p>
                    )}
                    {passport.end_of_life_guidance && (
                      <p className="text-sm text-[#444] leading-relaxed">
                        {passport.end_of_life_guidance}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="bg-[#111] px-5 pt-10 pb-12 mt-0.5">
          <div className="mb-6">
            {displayBrandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayBrandLogo}
                alt={displayBrandName}
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            ) : (
              <p className="text-xl font-bold text-white uppercase tracking-tight">
                {displayBrandName}
              </p>
            )}
          </div>
          {brand.website_url && (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#888] mb-8 hover:text-[#aaa] transition-colors"
            >
              {brandDomain}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <p className="text-[10px] text-[#666] font-mono flex items-center gap-1.5">
            <OriginsLogo className="w-3 h-3" />
            Digital Product Passport by Known Objects
          </p>
        </footer>
      </div>

      {/* ── Sticky bottom nav ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-[430px] mx-auto bg-white/95 backdrop-blur-sm border-t border-[#e8e8e8]">
          <div className="grid grid-cols-4">
            {NAV_TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="relative flex flex-col items-center justify-center gap-1 py-3 transition-colors"
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#0e6dea]" />
                  )}
                  <Icon
                    className={`h-5 w-5 transition-colors ${active ? "text-[#111]" : "text-[#aaa]"}`}
                    strokeWidth={active ? 2 : 1.5}
                  />
                  <span className={`text-[10px] font-medium transition-colors ${active ? "text-[#111]" : "text-[#aaa]"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-1 py-1.5 border-t border-[#f5f5f3]">
            <ShieldCheck className="h-3 w-3 text-[#8b8b8b]" strokeWidth={1.5} />
            <span className="text-[9px] font-mono text-[#aaa]">Known Objects</span>
          </div>
        </div>
      </div>
    </div>
  );
}
