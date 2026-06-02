"use client";

import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, MapPin } from "lucide-react";
import type { WizardFacility } from "@/types/wizard";

const PROCESS_STAGES = [
  "Raw material sourcing",
  "Ginning",
  "Spinning",
  "Weaving / Knitting",
  "Dyeing & Finishing",
  "Cut & Sew",
  "Assembly",
  "Quality control",
  "Packaging",
  "Distribution",
];

const COUNTRIES = [
  "Bangladesh", "Belgium", "Brazil", "Cambodia", "China", "Denmark",
  "England", "Ethiopia", "France", "Germany", "India", "Indonesia", "Italy",
  "Japan", "Morocco", "Northern Ireland", "Pakistan", "Peru", "Portugal", "Romania",
  "Scotland", "Spain", "Sri Lanka", "Sweden", "Thailand", "Turkey", "United Kingdom",
  "United States", "Vietnam", "Wales", "Other",
];

const COUNTRY_FLAGS: Record<string, string> = {
  "Bangladesh": "🇧🇩", "Belgium": "🇧🇪", "Brazil": "🇧🇷", "Cambodia": "🇰🇭",
  "China": "🇨🇳", "Denmark": "🇩🇰", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Ethiopia": "🇪🇹",
  "France": "🇫🇷", "Germany": "🇩🇪", "India": "🇮🇳", "Indonesia": "🇮🇩", "Italy": "🇮🇹",
  "Japan": "🇯🇵", "Morocco": "🇲🇦", "Northern Ireland": "🇬🇧", "Pakistan": "🇵🇰", "Peru": "🇵🇪",
  "Portugal": "🇵🇹", "Romania": "🇷🇴", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Spain": "🇪🇸", "Sri Lanka": "🇱🇰",
  "Sweden": "🇸🇪", "Thailand": "🇹🇭", "Turkey": "🇹🇷", "United Kingdom": "🇬🇧",
  "United States": "🇺🇸", "Vietnam": "🇻🇳", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Other": "🌍",
};

const OWNERSHIP_OPTIONS = [
  { value: "brand_owned",     label: "Brand-owned" },
  { value: "tier1_supplier",  label: "Tier-1 approved supplier" },
  { value: "subcontractor",   label: "Subcontractor" },
];

function defaultFacility(tier: number): WizardFacility {
  return {
    facility_name: "",
    tier,
    process_stage: "",
    country: "",
    city: "",
    website_url: "",
    facility_address: "",
    ownership_relationship: "",
    confidence_level: "brand_declared",
  };
}

function SupplyChainMap({ facilities }: { facilities: WizardFacility[] }) {
  if (!facilities.length) return null;
  const sorted = [...facilities].sort((a, b) => b.tier - a.tier);
  return (
    <div className="bg-[#F9F9F8] border border-[#E8E8E6] rounded-xl p-3">
      <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider mb-3">Supply chain journey</p>
      <div className="flex items-start gap-0 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {sorted.map((f, i) => (
          <div key={i} className="flex items-center gap-0 shrink-0">
            <div className="flex flex-col items-center gap-1 px-2 min-w-[72px]">
              <span className="text-2xl leading-none">{COUNTRY_FLAGS[f.country] ?? "🌍"}</span>
              <span className="text-[10px] font-semibold text-black text-center leading-tight">
                {f.city || f.country || "—"}
              </span>
              <span className="text-[9px] text-[#8C8C8C] text-center leading-tight max-w-[64px]">
                {f.process_stage || "Facility"}
              </span>
            </div>
            {i < sorted.length - 1 && (
              <div className="flex flex-col items-center gap-0.5 shrink-0">
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

export function Step3SupplyChain() {
  const { step3, setStep3 } = useWizardStore();
  const facilities = step3.facilities;

  function addFacility() {
    const nextTier = facilities.length === 0 ? 1 : facilities[facilities.length - 1].tier;
    setStep3({ facilities: [...facilities, defaultFacility(nextTier)] });
  }

  function removeFacility(idx: number) {
    setStep3({ facilities: facilities.filter((_, i) => i !== idx) });
  }

  function updateFacility(idx: number, field: keyof WizardFacility, value: unknown) {
    setStep3({ facilities: facilities.map((f, i) => i === idx ? { ...f, [field]: value } : f) });
  }

  return (
    <div className="space-y-4">
      {/* Mini-map at top — updates live */}
      <SupplyChainMap facilities={facilities} />

      <div className="space-y-2">
        {facilities.length === 0 && (
          <div className="border border-dashed border-[#E8E8E6] rounded-xl p-6 text-center">
            <MapPin className="h-5 w-5 text-[#8C8C8C] mx-auto mb-2" />
            <p className="text-[13px] text-[#525252]">No supply chain steps yet</p>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Start with Tier 1 (final assembly) and work back to raw materials</p>
          </div>
        )}

        {facilities.map((facility, idx) => (
          <div key={idx} className="border border-[#E8E8E6] rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {facility.country && (
                  <span className="text-lg leading-none">{COUNTRY_FLAGS[facility.country] ?? "🌍"}</span>
                )}
                <span className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide">
                  Facility {idx + 1}
                  {facility.tier ? ` · Tier ${facility.tier}` : ""}
                </span>
              </div>
              <button
                onClick={() => removeFacility(idx)}
                className="p-1 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Name + stage */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Facility name *</Label>
              <Input
                className="h-8 text-[13px]"
                placeholder="e.g. Atelier Silva"
                value={facility.facility_name}
                onChange={(e) => updateFacility(idx, "facility_name", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Process stage *</Label>
                <Select
                  value={facility.process_stage}
                  onValueChange={(v) => updateFacility(idx, "process_stage", v)}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESS_STAGES.map((s) => (
                      <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Supply chain tier</Label>
                <Select
                  value={String(facility.tier)}
                  onValueChange={(v) => updateFacility(idx, "tier", Number(v))}
                >
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1" className="text-[13px]">Tier 1 — Final assembly</SelectItem>
                    <SelectItem value="2" className="text-[13px]">Tier 2 — Fabric / material</SelectItem>
                    <SelectItem value="3" className="text-[13px]">Tier 3 — Raw material</SelectItem>
                    <SelectItem value="4" className="text-[13px]">Tier 4 — Upstream</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

            {/* Website URL */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Factory website <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span></Label>
              <Input
                className="h-8 text-[13px]"
                type="url"
                placeholder="https://factory.com"
                value={facility.website_url}
                onChange={(e) => updateFacility(idx, "website_url", e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Street address <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span></Label>
              <Input
                className="h-8 text-[13px]"
                placeholder="e.g. Rua das Flores 12, 4050-001 Porto"
                value={facility.facility_address}
                onChange={(e) => updateFacility(idx, "facility_address", e.target.value)}
              />
            </div>

            {/* Ownership + confidence */}
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
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addFacility} className="w-full h-8 text-[12px]">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add facility / step
        </Button>
      </div>
    </div>
  );
}
