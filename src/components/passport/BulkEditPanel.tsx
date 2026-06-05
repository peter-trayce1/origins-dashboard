"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, ArrowLeft, CheckCircle, ChevronRight, Info, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BulkMode = "scalar" | "append" | "material_extras" | "claim";
type InputType =
  | "text" | "textarea" | "number" | "date" | "url"
  | "select" | "switch"
  | "cert" | "care" | "circularity" | "facility" | "material" | "metric"
  | "verified-claim" | "self-claim";

interface BulkField {
  id: string;
  label: string;
  category: string;
  mode: BulkMode;
  inputType: InputType;
  apiField?: string;
  arrayField?: string;
  trimField?: string;
  options?: { value: string; label: string }[];
  warningOnReplace?: boolean;
  unit?: string;
}

type Step = "select-field" | "enter-value" | "confirm" | "applying";

interface BulkEditPanelProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

// ── Options ───────────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Bangladesh", "Belgium", "Brazil", "Cambodia", "China", "Denmark",
  "England", "Ethiopia", "France", "Germany", "India", "Indonesia", "Italy",
  "Japan", "Morocco", "Northern Ireland", "Pakistan", "Peru", "Portugal",
  "Romania", "Scotland", "Spain", "Sri Lanka", "Sweden", "Taiwan", "Thailand",
  "Turkey", "United Kingdom", "United States", "Vietnam", "Wales", "Other",
];

const SUPPLIER_TYPES = [
  "Final Assembly Factory", "Cut & Sew Factory", "Fabric Mill",
  "Dye House / Finishing", "Yarn Spinner", "Raw Material Source",
  "Packaging Supplier", "Distribution / Logistics", "Other",
];

const CONFIDENCE_OPTIONS = [
  { value: "verified",          label: "Third-party verified" },
  { value: "brand_declared",    label: "Brand declared" },
  { value: "supplier_declared", label: "Supplier declared" },
];

const METRIC_TYPES = [
  "carbon", "water", "energy", "transport", "waste",
  "circularity", "packaging", "biodiversity", "repairability", "other",
];

const CARE_TYPES = [
  { value: "wash",      label: "Washing" },
  { value: "dry",       label: "Drying" },
  { value: "iron",      label: "Ironing" },
  { value: "bleach",    label: "Bleaching" },
  { value: "dry_clean", label: "Dry cleaning" },
  { value: "storage",   label: "Storage" },
  { value: "warranty",  label: "Warranty" },
];

// ── Field manifest ─────────────────────────────────────────────────────────────

const BULK_FIELDS: BulkField[] = [
  // Product Information
  { id: "category",    label: "Category",            category: "Product",        mode: "scalar",          inputType: "text",     apiField: "category",              warningOnReplace: true },
  { id: "gender",      label: "Gender",              category: "Product",        mode: "scalar",          inputType: "select",   apiField: "gender",                warningOnReplace: true, options: [{ value: "Unisex", label: "Unisex" }, { value: "Men's", label: "Men's" }, { value: "Women's", label: "Women's" }, { value: "Kids'", label: "Kids'" }] },
  { id: "size_range",  label: "Size range",          category: "Product",        mode: "scalar",          inputType: "text",     apiField: "size_range",            warningOnReplace: true },
  { id: "colour",      label: "Colour",              category: "Product",        mode: "scalar",          inputType: "text",     apiField: "colour",                warningOnReplace: true },
  { id: "season",      label: "Season",              category: "Product",        mode: "scalar",          inputType: "text",     apiField: "season",                warningOnReplace: true },
  { id: "collection",  label: "Collection name",     category: "Product",        mode: "scalar",          inputType: "text",     apiField: "collection_name",       warningOnReplace: true },
  { id: "mfg_date",    label: "Manufacturing date",  category: "Product",        mode: "scalar",          inputType: "date",     apiField: "manufacturing_date",    warningOnReplace: true },
  { id: "coo",         label: "Country of origin",   category: "Product",        mode: "scalar",          inputType: "select",   apiField: "country_of_origin",     warningOnReplace: true, options: COUNTRIES.map(c => ({ value: c, label: c })) },
  { id: "weight",      label: "Product weight",      category: "Product",        mode: "scalar",          inputType: "number",   apiField: "product_weight_g",      unit: "g",    warningOnReplace: true },
  { id: "lifetime",    label: "Expected lifetime",   category: "Product",        mode: "scalar",          inputType: "number",   apiField: "product_lifetime_years",unit: "years",warningOnReplace: true },

  // Materials
  { id: "add_material",   label: "Add material",            category: "Materials",      mode: "append",          inputType: "material", arrayField: "product_materials" },
  { id: "dyeing_notes",   label: "Dyeing notes",            category: "Materials",      mode: "material_extras", inputType: "textarea", apiField: "dyeing_notes",          warningOnReplace: true },
  { id: "finishing_notes",label: "Finishing notes",         category: "Materials",      mode: "material_extras", inputType: "textarea", apiField: "finishing_notes",       warningOnReplace: true },
  { id: "reach",          label: "REACH compliant",         category: "Materials",      mode: "material_extras", inputType: "switch",   apiField: "restricted_substances_ok" },
  { id: "pfas_free",      label: "PFAS-free",               category: "Materials",      mode: "material_extras", inputType: "switch",   apiField: "pfas_free" },
  { id: "animal_derived", label: "Animal-derived materials",category: "Materials",      mode: "material_extras", inputType: "switch",   apiField: "animal_derived" },
  { id: "trim_buttons",   label: "Buttons / fastenings",    category: "Materials",      mode: "material_extras", inputType: "text",     apiField: "trim_notes", trimField: "buttons",   warningOnReplace: true },
  { id: "trim_zips",      label: "Zips",                    category: "Materials",      mode: "material_extras", inputType: "text",     apiField: "trim_notes", trimField: "zips",      warningOnReplace: true },
  { id: "trim_labels",    label: "Labels",                  category: "Materials",      mode: "material_extras", inputType: "text",     apiField: "trim_notes", trimField: "labels",    warningOnReplace: true },
  { id: "trim_packaging", label: "Packaging",               category: "Materials",      mode: "material_extras", inputType: "text",     apiField: "trim_notes", trimField: "packaging", warningOnReplace: true },

  // Supply Chain
  { id: "add_supplier",   label: "Add supplier",            category: "Supply Chain",   mode: "append",          inputType: "facility", arrayField: "product_facilities" },

  // Sustainability
  { id: "sus_summary",    label: "Sustainability summary",  category: "Sustainability", mode: "scalar",          inputType: "textarea", apiField: "sustainability_summary", warningOnReplace: true },
  { id: "add_metric",     label: "Add lifecycle metric",    category: "Sustainability", mode: "append",          inputType: "metric",   arrayField: "impact_metrics" },
  { id: "add_verified",   label: "Add verified claim",      category: "Sustainability", mode: "claim",           inputType: "verified-claim" },
  { id: "add_self",       label: "Add self-declared claim", category: "Sustainability", mode: "claim",           inputType: "self-claim" },

  // Certifications
  { id: "add_cert",       label: "Add certification",       category: "Certifications", mode: "append",          inputType: "cert",     arrayField: "product_certifications" },

  // Care & Durability
  { id: "add_care",          label: "Add care instruction",    category: "Care & Durability", mode: "append",   inputType: "care",     arrayField: "care_instructions" },
  { id: "add_circularity",   label: "Add circularity action",  category: "Care & Durability", mode: "append",   inputType: "circularity", arrayField: "circularity_actions" },
  { id: "repairability",     label: "Repairability score",     category: "Care & Durability", mode: "scalar",   inputType: "select",   apiField: "repairability_score", warningOnReplace: true, options: [{ value: "5", label: "5 — Fully repairable" }, { value: "4", label: "4 — Mostly repairable" }, { value: "3", label: "3 — Partially repairable" }, { value: "2", label: "2 — Difficult to repair" }, { value: "1", label: "1 — Not repairable" }] },
  { id: "spare_parts",       label: "Spare parts available",   category: "Care & Durability", mode: "scalar",   inputType: "switch",   apiField: "spare_parts_available" },
  { id: "warranty_info",     label: "Warranty info",           category: "Care & Durability", mode: "scalar",   inputType: "text",     apiField: "warranty_info",         warningOnReplace: true },
  { id: "repair_guide",      label: "Repair guide URL",        category: "Care & Durability", mode: "scalar",   inputType: "url",      apiField: "repair_instructions",   warningOnReplace: true },
  { id: "recyclability",     label: "Recyclability",           category: "Care & Durability", mode: "scalar",   inputType: "select",   apiField: "recyclability",         warningOnReplace: true, options: [{ value: "recyclable", label: "Recyclable" }, { value: "partially_recyclable", label: "Partially recyclable" }, { value: "not_recyclable", label: "Not currently recyclable" }] },
  { id: "recycling_inst",    label: "Recycling instructions",  category: "Care & Durability", mode: "scalar",   inputType: "textarea", apiField: "recycling_instructions", warningOnReplace: true },
  { id: "end_of_life",       label: "End of life guidance",    category: "Care & Durability", mode: "scalar",   inputType: "textarea", apiField: "end_of_life_guidance",  warningOnReplace: true },

  // Story
  { id: "our_story",     label: "Our story",                  category: "Story",          mode: "scalar",   inputType: "textarea", apiField: "product_story",                  warningOnReplace: true },
  { id: "story_img",     label: "Product story image URL",    category: "Story",          mode: "scalar",   inputType: "url",      apiField: "product_story_image_url",        warningOnReplace: true },
  { id: "maker_story",   label: "Makers story",               category: "Story",          mode: "scalar",   inputType: "textarea", apiField: "maker_story",                    warningOnReplace: true },
  { id: "makers_img",    label: "Makers image URL",           category: "Story",          mode: "scalar",   inputType: "url",      apiField: "makers_image_url",               warningOnReplace: true },
  { id: "design_notes",  label: "Design notes",               category: "Story",          mode: "scalar",   inputType: "textarea", apiField: "design_notes",                   warningOnReplace: true },
  { id: "brand_impact",  label: "Brand impact statement",     category: "Story",          mode: "scalar",   inputType: "textarea", apiField: "brand_impact_statement",         warningOnReplace: true },
  { id: "transparency",  label: "Consumer transparency",      category: "Story",          mode: "scalar",   inputType: "textarea", apiField: "consumer_transparency_summary",  warningOnReplace: true },
  { id: "video_url",     label: "Video URL",                  category: "Story",          mode: "scalar",   inputType: "url",      apiField: "video_url",                      warningOnReplace: true },
  { id: "designer_quote",label: "Designer quote",             category: "Story",          mode: "scalar",   inputType: "text",     apiField: "designer_quote",                 warningOnReplace: true },
];

const CATEGORIES = [...new Set(BULK_FIELDS.map(f => f.category))];

// ── Mode badge ────────────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: BulkMode }) {
  if (mode === "append" || mode === "claim") {
    return (
      <span className="inline-flex items-center text-[9px] font-semibold uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
        Add
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[9px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
      Replace
    </span>
  );
}

// ── Value entry forms ─────────────────────────────────────────────────────────

function CertForm({ value, onChange }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const up = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Certification name *</Label>
        <Input className="h-8 text-[13px]" placeholder="e.g. GOTS, B Corp, ISO 9001" value={(value.certification_name as string) ?? ""} onChange={e => up("certification_name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">Issued by</Label>
          <Input className="h-8 text-[13px]" placeholder="e.g. Control Union" value={(value.issued_by as string) ?? ""} onChange={e => up("issued_by", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">Expiry date</Label>
          <Input className="h-8 text-[13px]" type="date" value={(value.expires_at as string) ?? ""} onChange={e => up("expires_at", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Description for customers <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
        <Textarea className="text-[13px] resize-none" rows={2} placeholder="What this certification means for customers…" value={(value.description as string) ?? ""} onChange={e => up("description", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Verification URL <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
        <Input className="h-8 text-[13px]" type="url" placeholder="https://…" value={(value.verification_url as string) ?? ""} onChange={e => up("verification_url", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Data confidence</Label>
        <Select value={(value.confidence_level as string) ?? "brand_declared"} onValueChange={v => up("confidence_level", v)}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CONFIDENCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CareForm({ value, onChange }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const up = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Type *</Label>
        <Select value={(value.type as string) ?? "wash"} onValueChange={v => up("type", v)}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CARE_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-[13px]">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Instruction *</Label>
        <Input className="h-8 text-[13px]" placeholder="e.g. Machine wash at 30°C" value={(value.instruction as string) ?? ""} onChange={e => up("instruction", e.target.value)} />
      </div>
    </div>
  );
}

function CircularityForm({ value, onChange }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const up = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  const typeOptions = [
    { value: "repair", label: "Repair" }, { value: "take_back", label: "Take-back" },
    { value: "resale", label: "Resale" }, { value: "recycle", label: "Recycle" },
    { value: "donate", label: "Donate" },
  ];
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Type *</Label>
        <Select value={(value.type as string) ?? ""} onValueChange={v => up("type", v)}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {typeOptions.map(o => <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Title *</Label>
        <Input className="h-8 text-[13px]" placeholder="e.g. Send it back, We'll repair it" value={(value.title as string) ?? ""} onChange={e => up("title", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Description <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
        <Textarea className="text-[13px] resize-none" rows={2} value={(value.description as string) ?? ""} onChange={e => up("description", e.target.value)} placeholder="Describe the programme…" />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">URL <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
        <Input className="h-8 text-[13px]" type="url" placeholder="https://…" value={(value.url as string) ?? ""} onChange={e => up("url", e.target.value)} />
      </div>
    </div>
  );
}

function FacilityForm({ value, onChange }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const up = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Supplier type *</Label>
        <Select value={(value.process_stage as string) ?? ""} onValueChange={v => up("process_stage", v)}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {SUPPLIER_TYPES.map(s => <SelectItem key={s} value={s} className="text-[13px]">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Facility / company name</Label>
        <Input className="h-8 text-[13px]" placeholder="e.g. Atelier Silva" value={(value.facility_name as string) ?? ""} onChange={e => up("facility_name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">Country *</Label>
          <Select value={(value.country as string) ?? ""} onValueChange={v => up("country", v)}>
            <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">City / Region</Label>
          <Input className="h-8 text-[13px]" placeholder="e.g. Porto" value={(value.city as string) ?? ""} onChange={e => up("city", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Website <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
        <Input className="h-8 text-[13px]" type="url" placeholder="https://supplier.com" value={(value.website_url as string) ?? ""} onChange={e => up("website_url", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Confidence</Label>
        <Select value={(value.confidence_level as string) ?? "brand_declared"} onValueChange={v => up("confidence_level", v)}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CONFIDENCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function MaterialForm({ value, onChange }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const up = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Material name *</Label>
        <Input className="h-8 text-[13px]" placeholder="e.g. Organic Cotton" value={(value.material_name as string) ?? ""} onChange={e => up("material_name", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">%</Label>
          <Input className="h-8 text-[13px]" type="number" min={0} max={100} placeholder="e.g. 60" value={(value.percentage as number) ?? ""} onChange={e => up("percentage", e.target.value ? Number(e.target.value) : "")} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">Recycled %</Label>
          <Input className="h-8 text-[13px]" type="number" min={0} max={100} placeholder="0" value={(value.recycled_content_pct as number) ?? ""} onChange={e => up("recycled_content_pct", e.target.value ? Number(e.target.value) : 0)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">Bio %</Label>
          <Input className="h-8 text-[13px]" type="number" min={0} max={100} placeholder="0" value={(value.bio_based_pct as number) ?? ""} onChange={e => up("bio_based_pct", e.target.value ? Number(e.target.value) : 0)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Confidence</Label>
        <Select value={(value.confidence_level as string) ?? "brand_declared"} onValueChange={v => up("confidence_level", v)}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CONFIDENCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function MetricForm({ value, onChange }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const up = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Metric name *</Label>
        <Input className="h-8 text-[13px]" placeholder="e.g. Transport Distance" value={(value.metric_name as string) ?? ""} onChange={e => up("metric_name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">Category</Label>
          <Select value={(value.metric_type as string) ?? "other"} onValueChange={v => up("metric_type", v)}>
            <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {METRIC_TYPES.map(t => <SelectItem key={t} value={t} className="text-[13px] capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">Unit</Label>
          <Input className="h-8 text-[13px]" placeholder="kg CO₂e, %, km…" value={(value.metric_unit as string) ?? ""} onChange={e => up("metric_unit", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function ClaimForm({ value, onChange, verified }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void; verified: boolean }) {
  const up = (k: string, v: unknown) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#8C8C8C]">Claim text *</Label>
        <Input className="h-8 text-[13px]" placeholder={verified ? "e.g. Carbon-neutral production" : "e.g. Designed for longevity"} value={(value.claim_text as string) ?? ""} onChange={e => up("claim_text", e.target.value)} />
      </div>
      {verified && (
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#8C8C8C]">Evidence URL <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
          <Input className="h-8 text-[13px]" type="url" placeholder="https://… (certificate, audit, report)" value={(value.claim_evidence_url as string) ?? ""} onChange={e => up("claim_evidence_url", e.target.value)} />
          <p className="text-[10px] text-amber-700">Add an evidence link so this claim displays as verified on the public passport</p>
        </div>
      )}
    </div>
  );
}

// ── Simple value display for Step 3 confirm ───────────────────────────────────

function valueToString(field: BulkField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "On" : "Off";
  if (field.inputType === "switch") return value ? "On" : "Off";
  if (field.inputType === "select") {
    const opt = field.options?.find(o => o.value === String(value));
    return opt?.label ?? String(value);
  }
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (v.certification_name) return `Add: ${v.certification_name}`;
    if (v.instruction) return `Add: ${v.instruction}`;
    if (v.title) return `Add: ${v.title}`;
    if (v.material_name) return `Add: ${v.material_name}`;
    if (v.metric_name) return `Add: ${v.metric_name}`;
    if (v.process_stage || v.facility_name) return `Add: ${v.facility_name ?? v.process_stage}`;
    if (v.claim_text) return `Add: ${v.claim_text}`;
    return JSON.stringify(v);
  }
  return `${value}${field.unit ? ` ${field.unit}` : ""}`;
}

// ── Value entry component ─────────────────────────────────────────────────────

function ValueEntry({
  field,
  value,
  onChange,
}: {
  field: BulkField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const str = (value as string) ?? "";
  const num = (value as number | "") ?? "";
  const bool = (value as boolean) ?? false;
  const obj = (value as Record<string, unknown>) ?? {};

  switch (field.inputType) {
    case "text":
      return <Input className="h-8 text-[13px]" value={str} onChange={e => onChange(e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}…`} />;
    case "url":
      return <Input className="h-8 text-[13px]" type="url" value={str} onChange={e => onChange(e.target.value)} placeholder="https://…" />;
    case "textarea":
      return <Textarea className="text-[13px] resize-none" rows={4} value={str} onChange={e => onChange(e.target.value)} placeholder={`Enter ${field.label.toLowerCase()}…`} />;
    case "number":
      return (
        <div className="flex items-center gap-2">
          <Input className="h-8 text-[13px] flex-1" type="number" value={num} onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
          {field.unit && <span className="text-[12px] text-[#8C8C8C] shrink-0">{field.unit}</span>}
        </div>
      );
    case "date":
      return <Input className="h-8 text-[13px]" type="date" value={str} onChange={e => onChange(e.target.value)} />;
    case "select":
      return (
        <Select value={str} onValueChange={v => onChange(v)}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder={`Select ${field.label.toLowerCase()}`} /></SelectTrigger>
          <SelectContent>
            {field.options?.map(o => <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case "switch":
      return (
        <div className="flex items-center gap-3">
          <Switch checked={bool} onCheckedChange={v => onChange(v)} />
          <span className="text-[13px] text-[#525252]">{bool ? "On" : "Off"}</span>
        </div>
      );
    case "cert":
      return <CertForm value={obj} onChange={onChange} />;
    case "care":
      return <CareForm value={obj} onChange={onChange} />;
    case "circularity":
      return <CircularityForm value={obj} onChange={onChange} />;
    case "facility":
      return <FacilityForm value={obj} onChange={onChange} />;
    case "material":
      return <MaterialForm value={obj} onChange={onChange} />;
    case "metric":
      return <MetricForm value={obj} onChange={onChange} />;
    case "verified-claim":
      return <ClaimForm value={obj} onChange={onChange} verified={true} />;
    case "self-claim":
      return <ClaimForm value={obj} onChange={onChange} verified={false} />;
    default:
      return null;
  }
}

// ── Check if value is "filled in" enough to proceed ──────────────────────────

function isValueReady(field: BulkField, value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (field.inputType === "switch") return true; // booleans are always ready
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (field.inputType === "cert") return !!(v.certification_name as string)?.trim();
    if (field.inputType === "care") return !!(v.instruction as string)?.trim();
    if (field.inputType === "circularity") return !!(v.type as string) && !!(v.title as string)?.trim();
    if (field.inputType === "facility") return !!(v.country as string);
    if (field.inputType === "material") return !!(v.material_name as string)?.trim();
    if (field.inputType === "metric") return !!(v.metric_name as string)?.trim();
    if (field.inputType === "verified-claim" || field.inputType === "self-claim") return !!(v.claim_text as string)?.trim();
    return true;
  }
  return true;
}

// ── Build API body from field + value ─────────────────────────────────────────

function buildApiBody(field: BulkField, value: unknown, passportIds: string[]): Record<string, unknown> {
  const base = { passport_ids: passportIds };

  if (field.mode === "scalar") {
    return { ...base, mode: "scalar", field: field.apiField, value };
  }

  if (field.mode === "material_extras") {
    return {
      ...base,
      mode: "material_extras",
      extras_field: field.trimField ? "trim_notes" : field.apiField,
      trim_field: field.trimField,
      extras_value: value,
    };
  }

  if (field.mode === "append") {
    return { ...base, mode: "append", array_field: field.arrayField, item: value };
  }

  if (field.mode === "claim") {
    const v = value as Record<string, unknown>;
    return {
      ...base,
      mode: "claim",
      claim_text: v.claim_text,
      claim_mode: field.inputType === "verified-claim" ? "verified" : "self_declared",
      claim_evidence_url: v.claim_evidence_url ?? "",
    };
  }

  return base;
}

// ── Main component ────────────────────────────────────────────────────────────

export function BulkEditPanel({ open, onClose, selectedIds, onSuccess }: BulkEditPanelProps) {
  const [step, setStep] = useState<Step>("select-field");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selectedField, setSelectedField] = useState<BulkField | null>(null);
  const [fieldValue, setFieldValue] = useState<unknown>(null);
  const [applying, setApplying] = useState(false);

  const count = selectedIds.length;

  function reset() {
    setStep("select-field");
    setSelectedField(null);
    setFieldValue(null);
    setActiveCategory(CATEGORIES[0]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function selectField(f: BulkField) {
    setSelectedField(f);
    // Initialise default value
    if (f.inputType === "switch") setFieldValue(false);
    else if (["cert", "care", "circularity", "facility", "material", "metric", "verified-claim", "self-claim"].includes(f.inputType)) {
      if (f.inputType === "care") setFieldValue({ type: "wash", instruction: "", icon_code: "" });
      else setFieldValue({});
    } else {
      setFieldValue("");
    }
    setStep("enter-value");
  }

  async function handleApply() {
    if (!selectedField) return;
    setApplying(true);
    setStep("applying");

    try {
      const body = buildApiBody(selectedField, fieldValue, selectedIds);
      const res = await fetch("/api/passports/bulk-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Bulk edit failed");
      }

      const data = await res.json() as { affected?: number };
      toast.success(`Updated ${data.affected ?? count} passport${(data.affected ?? count) !== 1 ? "s" : ""}`);
      reset();
      onSuccess();
    } catch (err) {
      console.error("[BulkEditPanel] apply failed:", err);
      toast.error(err instanceof Error ? err.message : "Bulk edit failed");
      setStep("confirm");
    } finally {
      setApplying(false);
    }
  }

  const categoryFields = BULK_FIELDS.filter(f => f.category === activeCategory);
  const isReady = selectedField ? isValueReady(selectedField, fieldValue) : false;
  const valueSummary = selectedField ? valueToString(selectedField, fieldValue) : "";
  const isAppend = selectedField?.mode === "append" || selectedField?.mode === "claim";

  return (
    <Sheet open={open} onOpenChange={(o: boolean) => { if (!o) handleClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ maxWidth: "min(520px, 100vw)", width: "100%" }}
        className="flex flex-col p-0 overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="border-b border-[#F0F0EE] px-5 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step !== "select-field" && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === "confirm") setStep("enter-value");
                    else if (step === "enter-value") { setSelectedField(null); setStep("select-field"); }
                  }}
                  className="p-1 rounded hover:bg-[#F4F4F2] text-[#525252] transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <SheetTitle className="text-[15px] font-semibold text-black">
                {step === "select-field" && "Bulk edit"}
                {step === "enter-value" && selectedField?.label}
                {step === "confirm" && "Confirm changes"}
                {step === "applying" && "Applying…"}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8C8C8C] bg-[#F4F4F2] px-2 py-0.5 rounded-full">
                {count} passport{count !== 1 ? "s" : ""} selected
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded hover:bg-[#F4F4F2] text-[#8C8C8C] transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Step 1: Select field */}
          {step === "select-field" && (
            <div className="flex h-full">
              {/* Category sidebar */}
              <div className="w-36 shrink-0 border-r border-[#F0F0EE] py-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-4 py-2.5 text-[12px] font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-[#F4F4F2] text-black"
                        : "text-[#8C8C8C] hover:text-black hover:bg-[#FAFAF8]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Field list */}
              <div className="flex-1 py-2">
                {categoryFields.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => selectField(f)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#FAFAF8] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[13px] text-[#333] text-left truncate">{f.label}</span>
                      <ModeBadge mode={f.mode} />
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-[#BDBDBB] group-hover:text-[#525252] shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Enter value */}
          {step === "enter-value" && selectedField && (
            <div className="px-5 py-5 space-y-4">
              {/* Mode + count banner */}
              <div className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${isAppend ? "bg-blue-50 border border-blue-100" : "bg-amber-50 border border-amber-100"}`}>
                {isAppend
                  ? <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  : <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                }
                <p className={`text-[11px] leading-relaxed ${isAppend ? "text-blue-800" : "text-amber-800"}`}>
                  {isAppend
                    ? `Will add to all ${count} selected passports`
                    : `Will replace existing "${selectedField.label}" on all ${count} selected passports`
                  }
                </p>
              </div>

              <ValueEntry field={selectedField} value={fieldValue} onChange={setFieldValue} />
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && selectedField && (
            <div className="px-5 py-5 space-y-4">
              {/* Summary card */}
              <div className="border border-[#E8E8E6] rounded-xl p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8C8C] mb-1">Field</p>
                    <p className="text-[13px] font-medium text-black">{selectedField.label}</p>
                  </div>
                  <ModeBadge mode={selectedField.mode} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8C8C] mb-1">
                    {isAppend ? "New entry" : "New value"}
                  </p>
                  <p className="text-[13px] text-[#333] break-words">{valueSummary}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#8C8C8C] mb-1">Passports</p>
                  <p className="text-[13px] font-semibold text-black">{count} passport{count !== 1 ? "s" : ""} will be updated</p>
                </div>
              </div>

              {/* Warning */}
              {!isAppend && selectedField.warningOnReplace && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    This will overwrite any existing value for <strong>{selectedField.label}</strong> on all {count} selected passports. This cannot be undone.
                  </p>
                </div>
              )}

              {isAppend && (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                  <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    This will add the new entry to all {count} selected passports without removing existing data.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Applying */}
          {step === "applying" && (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#0e6dea]" />
              <p className="text-[13px] text-[#525252]">Updating {count} passport{count !== 1 ? "s" : ""}…</p>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {(step === "enter-value" || step === "confirm") && (
          <div className="border-t border-[#F0F0EE] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (step === "confirm") setStep("enter-value");
                else { setSelectedField(null); setStep("select-field"); }
              }}
            >
              Back
            </Button>

            {step === "enter-value" ? (
              <Button
                size="sm"
                disabled={!isReady}
                onClick={() => setStep("confirm")}
              >
                Review & confirm
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={applying}
                onClick={handleApply}
                className="bg-[#0e6dea] hover:bg-[#0a5bc7] text-white"
              >
                {applying ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Applying…</>
                ) : (
                  <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Apply to {count} passport{count !== 1 ? "s" : ""}</>
                )}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
