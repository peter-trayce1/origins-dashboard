"use client";

import { useEffect, useRef, useState } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Loader2, MapPin, Plus, Trash2, Upload, X } from "lucide-react";
import type { WizardFacility } from "@/types/wizard";

// ── Supplier types (brand-friendly, replaces "process stage") ─────────────────

export const SUPPLIER_TYPES = [
  "Final Assembly Factory",
  "Cut & Sew Factory",
  "Fabric Mill",
  "Dye House / Finishing",
  "Yarn Spinner",
  "Raw Material Source",
  "Packaging Supplier",
  "Distribution / Logistics",
  "Other",
] as const;

// Internal tier auto-mapping — hidden from the user
export const SUPPLIER_TYPE_TO_TIER: Record<string, number> = {
  "Final Assembly Factory":  1,
  "Cut & Sew Factory":       1,
  "Packaging Supplier":      1,
  "Distribution / Logistics":1,
  "Fabric Mill":             2,
  "Dye House / Finishing":   2,
  "Yarn Spinner":            3,
  "Raw Material Source":     4,
  "Other":                   1,
};

// Public display order: upstream → downstream
export const SUPPLIER_TYPE_ORDER: Record<string, number> = {
  "Raw Material Source":      0,
  "Yarn Spinner":             1,
  "Fabric Mill":              2,
  "Dye House / Finishing":    3,
  "Cut & Sew Factory":        4,
  "Final Assembly Factory":   5,
  "Packaging Supplier":       6,
  "Distribution / Logistics": 7,
  "Other":                    8,
};

// Backwards-compatibility: map legacy process_stage values → new supplier types
export const LEGACY_STAGE_MAP: Record<string, string> = {
  "Assembly":            "Final Assembly Factory",
  "Cut & Sew":           "Cut & Sew Factory",
  "Weaving / Knitting":  "Fabric Mill",
  "Dyeing & Finishing":  "Dye House / Finishing",
  "Spinning":            "Yarn Spinner",
  "Ginning":             "Raw Material Source",
  "Raw material sourcing": "Raw Material Source",
  "Packaging":           "Packaging Supplier",
  "Distribution":        "Distribution / Logistics",
  "Quality control":     "Final Assembly Factory",
};

export function normalizeProcessStage(stage: string | null | undefined): string {
  if (!stage) return "";
  if (SUPPLIER_TYPES.includes(stage as typeof SUPPLIER_TYPES[number])) return stage;
  return LEGACY_STAGE_MAP[stage] ?? stage;
}

// ── Country data ──────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Bangladesh", "Belgium", "Brazil", "Cambodia", "China", "Denmark",
  "England", "Ethiopia", "France", "Germany", "India", "Indonesia", "Italy",
  "Japan", "Morocco", "Northern Ireland", "Pakistan", "Peru", "Portugal", "Romania",
  "Scotland", "Spain", "Sri Lanka", "Sweden", "Taiwan", "Thailand", "Turkey",
  "United Kingdom", "United States", "Vietnam", "Wales", "Other",
];

export const COUNTRY_FLAGS: Record<string, string> = {
  "Bangladesh": "🇧🇩", "Belgium": "🇧🇪", "Brazil": "🇧🇷", "Cambodia": "🇰🇭",
  "China": "🇨🇳", "Denmark": "🇩🇰", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Ethiopia": "🇪🇹",
  "France": "🇫🇷", "Germany": "🇩🇪", "India": "🇮🇳", "Indonesia": "🇮🇩", "Italy": "🇮🇹",
  "Japan": "🇯🇵", "Morocco": "🇲🇦", "Northern Ireland": "🇬🇧", "Pakistan": "🇵🇰", "Peru": "🇵🇪",
  "Portugal": "🇵🇹", "Romania": "🇷🇴", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Spain": "🇪🇸", "Sri Lanka": "🇱🇰",
  "Sweden": "🇸🇪", "Taiwan": "🇹🇼", "Thailand": "🇹🇭", "Turkey": "🇹🇷", "United Kingdom": "🇬🇧",
  "United States": "🇺🇸", "Vietnam": "🇻🇳", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Other": "🌍",
};

// ── Facility cert file upload ─────────────────────────────────────────────────

function FacilityCertUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded(data.url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        title="Upload certificate document"
        className="h-7 w-7 shrink-0 flex items-center justify-center border border-[#E8E8E6] rounded-md hover:bg-[#F5F5F3] transition-colors"
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 text-[#525252]" />}
      </button>
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
    </>
  );
}

// ── Supplier memory (localStorage) ───────────────────────────────────────────

const MEMORY_KEY = "origins_supplier_memory_v1";

type SupplierMemoryEntry = Pick<WizardFacility, "facility_name" | "country" | "city" | "process_stage" | "website_url">;

function useSupplierMemory() {
  const [memory, setMemory] = useState<SupplierMemoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (raw) setMemory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function saveSupplier(f: WizardFacility) {
    if (!f.facility_name) return;
    setMemory((prev) => {
      const deduped = prev.filter((m) => m.facility_name !== f.facility_name);
      const updated = [
        { facility_name: f.facility_name, country: f.country, city: f.city,
          process_stage: f.process_stage, website_url: f.website_url },
        ...deduped,
      ].slice(0, 20);
      try { localStorage.setItem(MEMORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }

  return { memory, saveSupplier };
}

const OWNERSHIP_OPTIONS = [
  { value: "brand_owned",    label: "Brand-owned" },
  { value: "tier1_supplier", label: "Approved supplier" },
  { value: "subcontractor",  label: "Subcontractor" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultFacility(): WizardFacility {
  return {
    facility_name: "",
    tier: 1,
    process_stage: "",
    country: "",
    city: "",
    website_url: "",
    facility_address: "",
    ownership_relationship: "",
    confidence_level: "brand_declared",
    facility_certifications: [],
  };
}

function SupplyChainMap({ facilities }: { facilities: WizardFacility[] }) {
  if (!facilities.length) return null;
  const sorted = [...facilities].sort(
    (a, b) => (SUPPLIER_TYPE_ORDER[a.process_stage] ?? 99) - (SUPPLIER_TYPE_ORDER[b.process_stage] ?? 99)
  );
  return (
    <div className="bg-[#F9F9F8] border border-[#E8E8E6] rounded-xl p-3">
      <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-3">Product journey</p>
      <div className="flex items-start overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {sorted.map((f, i) => (
          <div key={i} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1 px-2 min-w-[72px]">
              <span className="text-2xl leading-none">{COUNTRY_FLAGS[f.country] ?? "🌍"}</span>
              <span className="text-[10px] font-semibold text-black text-center leading-tight">
                {f.city || f.country || "—"}
              </span>
              <span className="text-[9px] text-[#8C8C8C] text-center leading-tight max-w-[64px]">
                {f.process_stage || "Supplier"}
              </span>
            </div>
            {i < sorted.length - 1 && (
              <div className="flex flex-col items-center shrink-0">
                <div className="h-px w-5 bg-[#D4D4D1]" />
                <span className="text-[8px] text-[#BDBDBB]">→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Step3SupplyChain() {
  const { step3, setStep3 } = useWizardStore();
  const facilities = step3.facilities;
  const { memory, saveSupplier } = useSupplierMemory();

  function addFacility() {
    setStep3({ facilities: [...facilities, defaultFacility()] });
  }

  function removeFacility(idx: number) {
    setStep3({ facilities: facilities.filter((_, i) => i !== idx) });
  }

  function updateFacility(idx: number, field: keyof WizardFacility, value: unknown) {
    setStep3({ facilities: facilities.map((f, i) => i === idx ? { ...f, [field]: value } : f) });
  }

  function setSupplierType(idx: number, supplierType: string) {
    const tier = SUPPLIER_TYPE_TO_TIER[supplierType] ?? 1;
    setStep3({
      facilities: facilities.map((f, i) =>
        i === idx ? { ...f, process_stage: supplierType, tier } : f
      ),
    });
  }

  function addFacilityCert(idx: number) {
    const current = facilities[idx].facility_certifications ?? [];
    updateFacility(idx, "facility_certifications", [...current, { name: "", url: "" }]);
  }

  function removeFacilityCert(idx: number, certIdx: number) {
    const current = facilities[idx].facility_certifications ?? [];
    updateFacility(idx, "facility_certifications", current.filter((_, i) => i !== certIdx));
  }

  function updateFacilityCert(idx: number, certIdx: number, field: "name" | "url", value: string) {
    const current = facilities[idx].facility_certifications ?? [];
    updateFacility(idx, "facility_certifications",
      current.map((c, i) => i === certIdx ? { ...c, [field]: value } : c)
    );
  }

  function applyMemory(entry: SupplierMemoryEntry) {
    setStep3({
      facilities: [...facilities, {
        ...defaultFacility(),
        facility_name: entry.facility_name,
        country: entry.country ?? "",
        city: entry.city ?? "",
        process_stage: entry.process_stage ?? "",
        website_url: entry.website_url ?? "",
        tier: SUPPLIER_TYPE_TO_TIER[entry.process_stage ?? ""] ?? 1,
      }],
    });
  }

  return (
    <div className="space-y-4">
      <SupplyChainMap facilities={facilities} />

      {/* Previously used suppliers — shown at top so it's easy to quick-add */}
      {memory.length > 0 && (
        <div className="border border-[#E8E8E6] rounded-xl p-3">
          <p className="text-[10px] text-[#8C8C8C] font-medium mb-2">Previously used suppliers</p>
          <div className="flex flex-wrap gap-1.5">
            {memory.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyMemory(m)}
                className="flex items-center gap-1 text-[10px] text-[#525252] border border-[#E8E8E6] rounded-full px-2.5 py-1 hover:bg-[#F5F5F3] hover:border-black/20 transition-colors"
              >
                <MapPin className="h-2.5 w-2.5 text-[#8C8C8C]" />
                {m.facility_name}
                {m.country && <span className="ml-0.5">{COUNTRY_FLAGS[m.country] ?? ""}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {facilities.length === 0 && (
          <div className="border border-dashed border-[#E8E8E6] rounded-xl p-6 text-center">
            <MapPin className="h-5 w-5 text-[#8C8C8C] mx-auto mb-2" />
            <p className="text-[13px] text-[#525252]">No suppliers added yet</p>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">
              Start with the factory that made the final product. You can add fabric mills, spinners and raw material sources later.
            </p>
          </div>
        )}

        {facilities.map((facility, idx) => (
          <div key={idx} className="border border-[#E8E8E6] rounded-xl p-3 space-y-2.5">
            {/* Card header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {facility.country && (
                  <span className="text-lg leading-none">{COUNTRY_FLAGS[facility.country] ?? "🌍"}</span>
                )}
                <div>
                  <span className="text-[12px] font-semibold text-black">
                    {facility.process_stage || `Supplier ${idx + 1}`}
                  </span>
                  {facility.process_stage && SUPPLIER_TYPE_TO_TIER[facility.process_stage] && (
                    <span className="ml-1.5 text-[10px] text-[#8C8C8C]">
                      · Tier {SUPPLIER_TYPE_TO_TIER[facility.process_stage]}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeFacility(idx)}
                className="p-1 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Supplier type (replaces process stage + tier dropdowns) */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Supplier type *</Label>
              <Select
                value={facility.process_stage}
                onValueChange={(v) => setSupplierType(idx, v)}
              >
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue placeholder="What type of supplier is this?" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_TYPES.map((s) => (
                    <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Facility name */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Facility / company name</Label>
              <Input
                className="h-8 text-[13px]"
                placeholder="e.g. Atelier Silva"
                value={facility.facility_name}
                onChange={(e) => updateFacility(idx, "facility_name", e.target.value)}
                onBlur={() => { if (facility.facility_name) saveSupplier(facility); }}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Country *</Label>
                <Select
                  value={facility.country}
                  onValueChange={(v) => updateFacility(idx, "country", v)}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-[13px]">
                        {COUNTRY_FLAGS[c] ?? "🌍"} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">City / Region</Label>
                <Input
                  className="h-8 text-[13px]"
                  placeholder="e.g. Porto"
                  value={facility.city}
                  onChange={(e) => updateFacility(idx, "city", e.target.value)}
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">
                Website <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span>
              </Label>
              <Input
                className="h-8 text-[13px]"
                type="url"
                placeholder="https://supplier.com"
                value={facility.website_url}
                onChange={(e) => updateFacility(idx, "website_url", e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">
                Street address <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span>
              </Label>
              <Input
                className="h-8 text-[13px]"
                placeholder="e.g. Rua das Flores 12, Porto"
                value={facility.facility_address}
                onChange={(e) => updateFacility(idx, "facility_address", e.target.value)}
              />
            </div>

            {/* Relationship + confidence */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Relationship</Label>
                <Select
                  value={facility.ownership_relationship || ""}
                  onValueChange={(v) => updateFacility(idx, "ownership_relationship", v as WizardFacility["ownership_relationship"])}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERSHIP_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Data confidence</Label>
                <Select
                  value={facility.confidence_level}
                  onValueChange={(v) => updateFacility(idx, "confidence_level", v as WizardFacility["confidence_level"])}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified" className="text-[13px]">Third-party verified</SelectItem>
                    <SelectItem value="brand_declared" className="text-[13px]">Brand declared</SelectItem>
                    <SelectItem value="supplier_declared" className="text-[13px]">Supplier declared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Supplier certifications — free-text with optional link / file upload */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">
                Certifications <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span>
              </Label>
              {(facility.facility_certifications ?? []).map((fc, certIdx) => (
                <div key={certIdx} className="bg-[#FAFAF8] border border-[#F0F0EE] rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Input
                      className="h-7 text-[12px] flex-1 min-w-0 bg-white"
                      placeholder="e.g. GOTS, ISO 9001, SA8000"
                      value={fc.name}
                      onChange={(e) => updateFacilityCert(idx, certIdx, "name", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeFacilityCert(idx, certIdx)}
                      className="p-1 text-[#8C8C8C] hover:text-red-600 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      className="h-7 text-[11px] flex-1 min-w-0 bg-white"
                      type="url"
                      placeholder="Certificate link (optional)"
                      value={fc.url}
                      onChange={(e) => updateFacilityCert(idx, certIdx, "url", e.target.value)}
                    />
                    {fc.url && (
                      <a href={fc.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <ExternalLink className="h-3.5 w-3.5 text-[#0e6dea]" />
                      </a>
                    )}
                    <FacilityCertUpload onUploaded={(url) => updateFacilityCert(idx, certIdx, "url", url)} />
                    {fc.url && (
                      <button type="button" onClick={() => updateFacilityCert(idx, certIdx, "url", "")}
                              className="shrink-0 text-[#8C8C8C] hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addFacilityCert(idx)}
                className="flex items-center gap-1 text-[11px] text-[#0e6dea] hover:text-[#0a5bc7] transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add certification
              </button>
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addFacility} className="w-full h-8 text-[12px]">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add supplier
        </Button>
      </div>
    </div>
  );
}
