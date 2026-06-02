"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWizardStore } from "@/stores/wizardStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle, ShieldCheck, Leaf, Wind, Droplets, Zap,
  Plus, Trash2, ChevronDown, ChevronUp, Truck, RefreshCw,
  Package, TreePine, Wrench, BarChart3, Paperclip, Check, Shield, EyeOff, Info, Loader2,
} from "lucide-react";
import type { WizardImpactMetric, MetricType, VerificationStatus, CoreMetricMeta } from "@/types/wizard";

const SELF_DECLARED_CLAIMS = [
  "Low-impact dyeing",
  "Reduced water usage vs industry average",
  "Local / near-shore production",
  "No harmful chemicals",
  "Responsible sourcing practices",
  "Designed for longevity",
];

const EVIDENCE_REQUIRED_CLAIMS = [
  "Carbon-neutral production",
  "Made from organic materials",
  "Contains recycled content",
  "Renewable energy used in production",
  "Fair wages paid",
  "Zero waste manufacturing",
];

const METRIC_TYPE_OPTIONS: { value: MetricType; label: string }[] = [
  { value: "carbon",        label: "Carbon" },
  { value: "water",         label: "Water" },
  { value: "energy",        label: "Energy" },
  { value: "transport",     label: "Transport" },
  { value: "waste",         label: "Waste" },
  { value: "circularity",   label: "Circularity" },
  { value: "packaging",     label: "Packaging" },
  { value: "biodiversity",  label: "Biodiversity" },
  { value: "repairability", label: "Repairability" },
  { value: "other",         label: "Other" },
];

const METRIC_SCOPE_OPTIONS = [
  "Per garment",
  "Per product",
  "Per kg",
  "Per wear",
  "Production only",
  "Cradle-to-gate",
  "Cradle-to-grave",
];

const VERIFICATION_STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "claimed",              label: "Claimed (no evidence)" },
  { value: "evidence_attached",    label: "Evidence provided" },
  { value: "verified",             label: "Verified" },
  { value: "third_party_verified", label: "Third-party verified" },
];

const METRIC_TEMPLATES: Array<{ label: string; metric_type: MetricType; unit: string; metric_key: string }> = [
  { label: "Transport Distance",           metric_type: "transport",     unit: "km",       metric_key: "transport_distance" },
  { label: "Transport Emissions",          metric_type: "carbon",        unit: "kg CO₂e",  metric_key: "transport_emissions" },
  { label: "Avoided Emissions",            metric_type: "carbon",        unit: "kg CO₂e",  metric_key: "avoided_emissions" },
  { label: "Recycled Content %",           metric_type: "circularity",   unit: "%",        metric_key: "recycled_content_pct" },
  { label: "Renewable Material Content %", metric_type: "circularity",   unit: "%",        metric_key: "renewable_material_pct" },
  { label: "Waste Generated",              metric_type: "waste",         unit: "kg",       metric_key: "waste_generated" },
  { label: "Waste Diversion Rate",         metric_type: "waste",         unit: "%",        metric_key: "waste_diversion_rate" },
  { label: "Packaging Footprint",          metric_type: "packaging",     unit: "kg CO₂e",  metric_key: "packaging_footprint" },
  { label: "Renewable Energy %",           metric_type: "energy",        unit: "%",        metric_key: "renewable_energy_pct" },
  { label: "Repairability Score",          metric_type: "repairability", unit: "/10",      metric_key: "repairability_score" },
  { label: "Product Lifetime",             metric_type: "repairability", unit: "years",    metric_key: "product_lifetime" },
  { label: "End-of-Life Recovery Rate",    metric_type: "circularity",   unit: "%",        metric_key: "eol_recovery_rate" },
  { label: "Water Savings vs Benchmark",   metric_type: "water",         unit: "%",        metric_key: "water_savings_benchmark" },
  { label: "Microfibre Shedding",          metric_type: "other",         unit: "mg/kg",    metric_key: "microfibre_shedding" },
];

function metricTypeIcon(type: MetricType, size = "h-3.5 w-3.5") {
  const cls = `${size} shrink-0`;
  switch (type) {
    case "carbon":        return <Leaf      className={`${cls} text-emerald-600`} />;
    case "water":         return <Droplets  className={`${cls} text-blue-500`} />;
    case "energy":        return <Zap       className={`${cls} text-amber-500`} />;
    case "transport":     return <Truck     className={`${cls} text-indigo-500`} />;
    case "waste":         return <Trash2    className={`${cls} text-red-500`} />;
    case "circularity":   return <RefreshCw className={`${cls} text-teal-500`} />;
    case "packaging":     return <Package   className={`${cls} text-orange-500`} />;
    case "biodiversity":  return <TreePine  className={`${cls} text-green-600`} />;
    case "repairability": return <Wrench    className={`${cls} text-violet-500`} />;
    default:              return <BarChart3 className={`${cls} text-[#525252]`} />;
  }
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case "third_party_verified":
      return (
        <span className="flex items-center gap-0.5 text-[9px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
          <Shield className="h-2.5 w-2.5" />3rd party
        </span>
      );
    case "verified":
      return (
        <span className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
          <Check className="h-2.5 w-2.5" />Verified
        </span>
      );
    case "evidence_attached":
      return (
        <span className="flex items-center gap-0.5 text-[9px] font-medium text-[#525252] bg-[#F4F4F2] border border-[#E8E8E6] rounded px-1.5 py-0.5">
          <Paperclip className="h-2.5 w-2.5" />Evidence provided
        </span>
      );
    default:
      return null;
  }
}

function FieldInfo({ tip }: { tip: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function close() { setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ x: r.right + 8, y: r.top });
    }
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className="inline-flex items-center text-[#C0C0BE] hover:text-[#525252] transition-colors shrink-0 cursor-pointer"
        aria-label="More information"
      >
        <Info className="h-3 w-3" />
      </button>
      {open && createPortal(
        <div
          style={{ position: "fixed", left: coords.x, top: coords.y, zIndex: 9999 }}
          className="w-52 bg-[#1a1a1a] text-white text-[11px] leading-relaxed rounded-lg px-3 py-2.5 shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {tip}
        </div>,
        document.body
      )}
    </>
  );
}

function FieldLabel({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <div className="flex items-center gap-1">
      <Label className="text-[10px] font-medium text-[#8C8C8C]">{children}</Label>
      <FieldInfo tip={tip} />
    </div>
  );
}

const EVIDENCE_WARNING =
  "You must add a valid URL or upload a file in the options below for 'Evidence provided' to appear on the passport.";

function EvidenceUploadField({
  currentUrl,
  onUrl,
}: {
  currentUrl: string;
  onUrl: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          purpose: "cert_evidence",
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();
      const up = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!up.ok) throw new Error("Upload failed");
      onUrl(publicUrl);
    } catch {
      setUploadError("Upload failed — please try again");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const uploadedFilename = currentUrl?.startsWith("http")
    ? decodeURIComponent(currentUrl.split("/").pop()?.split("?")[0] ?? "Uploaded file")
    : null;

  return (
    <div className="space-y-1">
      <FieldLabel tip="Upload a PDF, image, or document as evidence — e.g. an LCA report, audit certificate, or test result. Accepted formats: PDF, JPG, PNG, DOCX.">
        Upload evidence file
      </FieldLabel>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        onChange={handleFile}
      />
      {uploadedFilename ? (
        <div className="flex items-center gap-2 h-8 px-2.5 border border-[#E8E8E6] rounded-lg bg-[#F7F6F4]">
          <Paperclip className="h-3 w-3 text-[#525252] shrink-0" />
          <span className="text-[11px] text-[#333] truncate flex-1">{uploadedFilename}</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[10px] text-[#0e6dea] hover:opacity-70 shrink-0"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-1.5 h-8 w-full px-3 text-[11px] font-medium border border-dashed border-[#D0D0CE] rounded-lg text-[#525252] hover:border-black/30 hover:text-black transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <><Loader2 className="h-3 w-3 animate-spin" />Uploading…</>
          ) : (
            <><Paperclip className="h-3 w-3" />Upload PDF, image or document</>
          )}
        </button>
      )}
      {uploadError && <p className="text-[10px] text-red-600">{uploadError}</p>}
    </div>
  );
}

const LCA_SCOPE_OPTIONS = [
  "Production only",
  "Cradle-to-Gate",
  "Cradle-to-Grave",
  "Cradle-to-Cradle",
  "Gate-to-Gate",
  "Use phase included",
  "End-of-life included",
];

function CoreMetricCard({
  icon: Icon,
  iconClass,
  label,
  value,
  unit,
  unitOptions,
  valuePlaceholder,
  valueTooltip,
  meta,
  onValueChange,
  onUnitChange,
  onMetaChange,
}: {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  value: number | "";
  unit: string;
  unitOptions?: string[];
  valuePlaceholder: string;
  valueTooltip: string;
  meta: CoreMetricMeta;
  onValueChange: (v: number | "") => void;
  onUnitChange?: (u: string) => void;
  onMetaChange: (updates: Partial<CoreMetricMeta>) => void;
}) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="border border-[#E8E8E6] rounded-xl bg-white overflow-hidden">
      {/* Primary row */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
          <span className="text-[12px] font-semibold text-black flex-1">{label}</span>
          {meta.verification_status !== "claimed" && (
            <VerificationBadge status={meta.verification_status} />
          )}
          {!meta.display_public && (
            <span className="flex items-center gap-0.5 text-[9px] text-[#8C8C8C]">
              <EyeOff className="h-2.5 w-2.5" />Hidden
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              className="h-8 text-[13px] w-full"
              type="number" min={0} step={0.01}
              placeholder={valuePlaceholder}
              value={value}
              onChange={(e) => onValueChange(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {unitOptions && onUnitChange ? (
              <Select value={unit} onValueChange={(v: string) => onUnitChange(v)}>
                <SelectTrigger className="h-8 text-[13px] w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unitOptions.map((u) => (
                    <SelectItem key={u} value={u} className="text-[13px]">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="flex items-center text-[11px] text-[#8C8C8C] min-w-[48px]">{unit}</span>
            )}
            <FieldInfo tip={valueTooltip} />
          </div>
        </div>

        {/* Verification — always visible */}
        <div className="space-y-1">
          <FieldLabel tip="'Claimed' = self-reported; 'Evidence provided' = URL or file added below; 'Verified' = audited internally; '3rd party' = independently verified by an accredited body.">
            Verification
          </FieldLabel>
          <Select
            value={meta.verification_status}
            onValueChange={(v: string) => onMetaChange({ verification_status: v as VerificationStatus })}
          >
            <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VERIFICATION_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {meta.verification_status === "evidence_attached" && !meta.evidence_url && (
            <p className="text-[10px] text-red-600 leading-snug">{EVIDENCE_WARNING}</p>
          )}
        </div>
      </div>

      {/* Additional options accordion */}
      <div className="border-t border-[#F0F0EE]">
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-medium text-[#8C8C8C] hover:text-black transition-colors"
        >
          <span>Additional options</span>
          {showOptions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showOptions && (
          <div className="px-3 pb-3 space-y-3 border-t border-[#F0F0EE] pt-3">
            {/* Benchmark / Avoided / Savings */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <FieldLabel tip="Industry average for this metric — used to show consumers how this product compares. Use the same unit as the primary value.">
                  Benchmark
                </FieldLabel>
                <Input
                  className="h-8 text-[13px]"
                  type="number" placeholder="Industry avg"
                  value={meta.benchmark_value ?? ""}
                  onChange={(e) => onMetaChange({ benchmark_value: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <FieldLabel tip="Emissions or resources saved compared to the conventional alternative — shown as a positive impact on the public passport.">
                  Avoided
                </FieldLabel>
                <Input
                  className="h-8 text-[13px]"
                  type="number" placeholder="Avoided"
                  value={meta.avoided_value ?? ""}
                  onChange={(e) => onMetaChange({ avoided_value: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <FieldLabel tip="Your percentage improvement vs the industry benchmark — enter manually or let consumers calculate from the values above.">
                  Savings %
                </FieldLabel>
                <Input
                  className="h-8 text-[13px]"
                  type="number" placeholder="e.g. 35"
                  value={meta.savings_percentage ?? ""}
                  onChange={(e) => onMetaChange({ savings_percentage: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-1">
              <FieldLabel tip="Which lifecycle stages this figure covers — 'Cradle-to-Gate' includes raw materials and manufacturing only; 'Cradle-to-Grave' includes end-of-life.">
                LCA scope
              </FieldLabel>
              <Select
                value={meta.scope || "__none__"}
                onValueChange={(v: string) => onMetaChange({ scope: v === "__none__" ? "" : v })}
              >
                <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select scope…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-[13px] text-[#8C8C8C]">No scope</SelectItem>
                  {LCA_SCOPE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="text-[13px]">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Explanation */}
            <div className="space-y-1">
              <FieldLabel tip="Brief methodology note shown to consumers — e.g. 'Calculated using Higg MSI v3.0, cradle-to-gate scope'. Max 200 characters.">
                Explanation
              </FieldLabel>
              <Textarea
                className="text-[12px] resize-none"
                rows={2} maxLength={200}
                placeholder="Brief context for this metric…"
                value={meta.explanation}
                onChange={(e) => onMetaChange({ explanation: e.target.value })}
              />
            </div>

            {/* Evidence & Source */}
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 space-y-1">
                <FieldLabel tip="Link to an LCA report, certification, or audit that supports this figure — e.g. a PDF hosted on your website or a third-party verification portal.">
                  Evidence URL
                </FieldLabel>
                <Input
                  className="h-8 text-[13px]"
                  type="url" placeholder="https://…"
                  value={meta.evidence_url}
                  onChange={(e) => onMetaChange({ evidence_url: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <EvidenceUploadField
                  currentUrl={meta.evidence_url}
                  onUrl={(url) => onMetaChange({ evidence_url: url })}
                />
              </div>
              <div className="space-y-1">
                <FieldLabel tip="The tool, database, or study used to calculate this metric — e.g. Higg MSI, Ecoinvent, SimaPro, or an internal LCA.">
                  Source name
                </FieldLabel>
                <Input
                  className="h-8 text-[13px]"
                  placeholder="Higg MSI, LCA Study…"
                  value={meta.source_name}
                  onChange={(e) => onMetaChange({ source_name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <FieldLabel tip="How the data was collected — e.g. 'Measured at facility', 'Estimated from industry averages', 'Calculated via LCA software'.">
                  Source method
                </FieldLabel>
                <Input
                  className="h-8 text-[13px]"
                  placeholder="Calculated, Measured…"
                  value={meta.source_method}
                  onChange={(e) => onMetaChange({ source_method: e.target.value })}
                />
              </div>
            </div>

            {/* Public toggle */}
            <div className="flex items-center justify-between py-0.5">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[12px] font-medium text-black">Show on public passport</p>
                  <FieldInfo tip="When off, this metric is saved in your account but not visible to consumers on the public passport." />
                </div>
                <p className="text-[10px] text-[#8C8C8C]">Hidden metrics are saved but not shown publicly</p>
              </div>
              <Switch
                checked={meta.display_public}
                onCheckedChange={(v) => onMetaChange({ display_public: v })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function defaultMetric(): WizardImpactMetric {
  return {
    metric_key: "",
    metric_name: "",
    metric_type: "other",
    metric_value: null,
    metric_unit: "",
    benchmark_value: null,
    avoided_value: null,
    savings_percentage: null,
    explanation: "",
    evidence_url: "",
    verification_status: "claimed",
    display_public: true,
    source_name: "",
    source_method: "",
    metric_scope: "",
    confidence_level: "brand_declared",
  };
}

function MetricCard({
  metric, index, isExpanded, onToggle, onUpdate, onDelete, onMove, total,
}: {
  metric: WizardImpactMetric;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<WizardImpactMetric>) => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  total: number;
}) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className={`border rounded-xl transition-colors ${isExpanded ? "border-black/20" : "border-[#E8E8E6]"} bg-white`}>
      {/* Collapsed header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="flex flex-col shrink-0">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="disabled:opacity-20 text-[#C0C0BE] hover:text-black transition-colors leading-none"
            aria-label="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className="disabled:opacity-20 text-[#C0C0BE] hover:text-black transition-colors leading-none"
            aria-label="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {metricTypeIcon(metric.metric_type)}

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-black truncate">
            {metric.metric_name || <span className="text-[#8C8C8C] font-normal italic">Unnamed metric</span>}
          </p>
          {metric.metric_value != null && (
            <p className="text-[10px] text-[#8C8C8C]">
              {metric.metric_value} {metric.metric_unit}
              {metric.metric_scope && <span className="ml-1">· {metric.metric_scope}</span>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <VerificationBadge status={metric.verification_status} />
          {!metric.display_public && (
            <span className="flex items-center gap-0.5 text-[9px] text-[#8C8C8C]">
              <EyeOff className="h-2.5 w-2.5" />Hidden
            </span>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="text-[#8C8C8C] hover:text-black transition-colors p-0.5"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[#8C8C8C] hover:text-red-500 transition-colors p-0.5"
            aria-label="Delete metric"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded edit form */}
      {isExpanded && (
        <div className="border-t border-[#E8E8E6] p-3 space-y-3">
          {/* Core */}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 space-y-1">
              <FieldLabel tip="Consumer-friendly name shown on the public passport — e.g. 'Transport Distance' or 'Recycled Content'.">
                Metric name *
              </FieldLabel>
              <Input
                className="h-8 text-[13px]"
                placeholder="e.g. Transport Distance"
                value={metric.metric_name}
                onChange={(e) => {
                  const name = e.target.value;
                  onUpdate({
                    metric_name: name,
                    metric_key: name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
                  });
                }}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel tip="Environmental domain for this metric — determines the icon shown on the public passport.">
                Category
              </FieldLabel>
              <Select
                value={metric.metric_type}
                onValueChange={(v: string) => onUpdate({ metric_type: v as MetricType })}
              >
                <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRIC_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel tip="What the metric covers — e.g. 'Per garment' means the value is for one item; 'Cradle-to-Gate' defines the lifecycle boundary.">
                Scope
              </FieldLabel>
              <Select
                value={metric.metric_scope || "__none__"}
                onValueChange={(v: string) => onUpdate({ metric_scope: v === "__none__" ? "" : v })}
              >
                <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-[13px] text-[#8C8C8C]">No scope</SelectItem>
                  {METRIC_SCOPE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o} className="text-[13px]">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <FieldLabel tip="The measured or estimated quantity for this metric.">
                Value
              </FieldLabel>
              <Input
                className="h-8 text-[13px]"
                type="number"
                placeholder="0"
                value={metric.metric_value ?? ""}
                onChange={(e) => onUpdate({ metric_value: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel tip="Unit of measurement — e.g. km, %, kg CO₂e, litres, mg/kg.">
                Unit
              </FieldLabel>
              <Input
                className="h-8 text-[13px]"
                placeholder="km, %, kg CO₂e…"
                value={metric.metric_unit}
                onChange={(e) => onUpdate({ metric_unit: e.target.value })}
              />
            </div>
          </div>

          {/* Verification — always visible in expanded form */}
          <div className="space-y-1">
            <FieldLabel tip="'Claimed' = self-reported with no evidence; higher levels display a verification badge on the public passport.">
              Verification
            </FieldLabel>
            <Select
              value={metric.verification_status}
              onValueChange={(v: string) => onUpdate({ verification_status: v as VerificationStatus })}
            >
              <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VERIFICATION_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-[13px]">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {metric.verification_status === "evidence_attached" && !metric.evidence_url && (
              <p className="text-[10px] text-red-600 leading-snug">{EVIDENCE_WARNING}</p>
            )}
          </div>

          {/* Optional depth toggle */}
          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-medium text-[#8C8C8C] hover:text-black transition-colors"
          >
            {showDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showDetail ? "Hide optional details" : "Add optional details"}
          </button>

          {showDetail && (
            <div className="space-y-3 pt-2 border-t border-[#F0F0EE]">
              {/* Benchmark / Avoided / Savings */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <FieldLabel tip="Industry average for this metric — shown alongside your value so consumers can compare.">
                    Benchmark
                  </FieldLabel>
                  <Input
                    className="h-8 text-[13px]"
                    type="number"
                    placeholder="Industry avg"
                    value={metric.benchmark_value ?? ""}
                    onChange={(e) => onUpdate({ benchmark_value: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel tip="Amount of this metric saved vs the conventional process — shown as a positive impact.">
                    Avoided
                  </FieldLabel>
                  <Input
                    className="h-8 text-[13px]"
                    type="number"
                    placeholder="Avoided value"
                    value={metric.avoided_value ?? ""}
                    onChange={(e) => onUpdate({ avoided_value: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel tip="Your percentage improvement over the industry benchmark.">
                    Savings %
                  </FieldLabel>
                  <Input
                    className="h-8 text-[13px]"
                    type="number"
                    placeholder="e.g. 35"
                    value={metric.savings_percentage ?? ""}
                    onChange={(e) => onUpdate({ savings_percentage: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Explanation */}
              <div className="space-y-1">
                <FieldLabel tip="Brief methodology note visible when consumers expand this card — e.g. 'Measured via Higg FEM audit at Tier 1 supplier'. Max 200 characters.">
                  Explanation
                </FieldLabel>
                <Textarea
                  className="text-[12px] resize-none"
                  rows={2}
                  maxLength={200}
                  placeholder="Brief context for this metric…"
                  value={metric.explanation}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                />
              </div>

              {/* Evidence & Source */}
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 space-y-1">
                  <FieldLabel tip="Link to supporting documentation — e.g. an LCA report, audit certificate, or methodology page. Shown as a paperclip icon on the public passport.">
                    Evidence URL
                  </FieldLabel>
                  <Input
                    className="h-8 text-[13px]"
                    type="url"
                    placeholder="https://…"
                    value={metric.evidence_url}
                    onChange={(e) => onUpdate({ evidence_url: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <EvidenceUploadField
                    currentUrl={metric.evidence_url}
                    onUrl={(url) => onUpdate({ evidence_url: url })}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel tip="Tool, database, or study that generated this figure — e.g. Higg MSI, Ecoinvent, SimaPro, manufacturer data.">
                    Source name
                  </FieldLabel>
                  <Input
                    className="h-8 text-[13px]"
                    placeholder="Higg MSI, LCA Study…"
                    value={metric.source_name}
                    onChange={(e) => onUpdate({ source_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel tip="How the data was collected — e.g. 'Measured at facility', 'Estimated from industry averages', 'LCA model'.">
                    Source method
                  </FieldLabel>
                  <Input
                    className="h-8 text-[13px]"
                    placeholder="Calculated, Measured…"
                    value={metric.source_method}
                    onChange={(e) => onUpdate({ source_method: e.target.value })}
                  />
                </div>
              </div>

              {/* Public toggle */}
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-[12px] font-medium text-black">Show on public passport</p>
                    <FieldInfo tip="When off, this metric is saved in your account but not visible to consumers on the public passport." />
                  </div>
                  <p className="text-[10px] text-[#8C8C8C]">Hidden metrics are saved but not shown publicly</p>
                </div>
                <Switch
                  checked={metric.display_public}
                  onCheckedChange={(v) => onUpdate({ display_public: v })}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Step4Sustainability() {
  const { step4, setStep4 } = useWizardStore();
  const [expandedMetricIdx, setExpandedMetricIdx] = useState<number | null>(null);

  function toggleClaim(claim: string) {
    const current = step4.sustainability_claims;
    if (current.includes(claim)) {
      setStep4({
        sustainability_claims: current.filter((c) => c !== claim),
        claim_evidence_urls: Object.fromEntries(
          Object.entries(step4.claim_evidence_urls).filter(([k]) => k !== claim)
        ),
      });
    } else {
      setStep4({ sustainability_claims: [...current, claim] });
    }
  }

  function setEvidenceUrl(claim: string, url: string) {
    setStep4({ claim_evidence_urls: { ...step4.claim_evidence_urls, [claim]: url } });
  }

  const isChecked = (claim: string) => step4.sustainability_claims.includes(claim);

  function addMetric(template?: typeof METRIC_TEMPLATES[0]) {
    const newMetric: WizardImpactMetric = {
      ...defaultMetric(),
      ...(template
        ? { metric_key: template.metric_key, metric_name: template.label, metric_type: template.metric_type, metric_unit: template.unit }
        : {}),
    };
    const updated = [...step4.impact_metrics, newMetric];
    setStep4({ impact_metrics: updated });
    setExpandedMetricIdx(updated.length - 1);
  }

  function updateMetric(index: number, updates: Partial<WizardImpactMetric>) {
    const updated = step4.impact_metrics.map((m, i) => (i === index ? { ...m, ...updates } : m));
    setStep4({ impact_metrics: updated });
  }

  function deleteMetric(index: number) {
    const updated = step4.impact_metrics.filter((_, i) => i !== index);
    setStep4({ impact_metrics: updated });
    if (expandedMetricIdx === index) setExpandedMetricIdx(null);
    else if (expandedMetricIdx !== null && expandedMetricIdx > index) setExpandedMetricIdx(expandedMetricIdx - 1);
  }

  function moveMetric(index: number, direction: "up" | "down") {
    const arr = [...step4.impact_metrics];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= arr.length) return;
    [arr[index], arr[swap]] = [arr[swap], arr[index]];
    setStep4({ impact_metrics: arr });
    setExpandedMetricIdx(swap);
  }

  const hasMetrics = step4.impact_metrics.length > 0;

  return (
    <div className="space-y-4">
        {/* Sustainability summary — hero input, top of section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Label className="text-[11px] font-medium text-[#525252]">
              Sustainability summary{" "}
              <span className="text-[10px] font-normal text-[#8C8C8C]">Appears at the top of your passport</span>
            </Label>
            <FieldInfo tip="A brief, honest overview of this product's environmental story — shown prominently on the public passport. Focus on what's verifiably true rather than aspirational language." />
          </div>
          <Textarea
            className="text-[13px] resize-none"
            rows={3}
            placeholder="A brief, honest description of this product's sustainability credentials…"
            value={step4.sustainability_summary}
            onChange={(e) => setStep4({ sustainability_summary: e.target.value })}
          />
        </div>

        {/* Green claims warning */}
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-amber-800">Only include claims you can substantiate</p>
            <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
              The EU Green Claims Directive requires evidence for environmental claims. Verified claims (marked with a shield) require an evidence link.
            </p>
          </div>
        </div>

        {/* Core lifecycle metrics */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider">Lifecycle metrics</p>
          <div className="grid grid-cols-1 gap-2">
            <CoreMetricCard
              icon={Wind}
              iconClass="text-[#525252]"
              label="Carbon footprint"
              value={step4.carbon_footprint_kg}
              unit="kg CO₂e"
              valuePlaceholder="e.g. 3.2"
              valueTooltip="Total greenhouse gas from raw materials through to finished product, in kg CO₂ equivalent per item."
              meta={step4.carbon_meta}
              onValueChange={(v) => setStep4({ carbon_footprint_kg: v })}
              onMetaChange={(u) => setStep4({ carbon_meta: { ...step4.carbon_meta, ...u } })}
            />
            <CoreMetricCard
              icon={Droplets}
              iconClass="text-blue-500"
              label="Water usage"
              value={step4.water_usage_litres}
              unit="litres"
              valuePlaceholder="e.g. 2700"
              valueTooltip="Fresh water consumed in production including dyeing, washing, and processing — in litres per item."
              meta={step4.water_meta}
              onValueChange={(v) => setStep4({ water_usage_litres: v })}
              onMetaChange={(u) => setStep4({ water_meta: { ...step4.water_meta, ...u } })}
            />
            <CoreMetricCard
              icon={Zap}
              iconClass="text-amber-500"
              label="Energy use"
              value={step4.energy_use_kwh}
              unit={step4.energy_unit}
              unitOptions={["kWh", "MJ"]}
              valuePlaceholder="e.g. 8.4"
              valueTooltip="Energy consumed in manufacturing — enter in kWh (kilowatt-hours) or MJ (megajoules) per item."
              meta={step4.energy_meta}
              onValueChange={(v) => setStep4({ energy_use_kwh: v })}
              onUnitChange={(u) => setStep4({ energy_unit: u })}
              onMetaChange={(u) => setStep4({ energy_meta: { ...step4.energy_meta, ...u } })}
            />
          </div>
        </div>

        {/* === Additional Lifecycle Metrics === */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-[#8C8C8C] uppercase tracking-wider">Additional lifecycle metrics</p>
            <button
              type="button"
              onClick={() => addMetric()}
              className="flex items-center gap-1 text-[11px] font-medium text-[#0e6dea] hover:opacity-80 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />Add custom
            </button>
          </div>

          {!hasMetrics && (
            <div>
              <p className="text-[10px] text-[#8C8C8C] mb-2">Quick add from templates:</p>
              <div className="flex flex-wrap gap-1.5">
                {METRIC_TEMPLATES.map((t) => (
                  <button
                    key={t.metric_key}
                    type="button"
                    onClick={() => addMetric(t)}
                    className="flex items-center gap-1 text-[11px] font-medium border border-[#E8E8E6] rounded-full px-2.5 py-1 hover:border-black/20 hover:bg-[#FAFAF9] transition-colors"
                  >
                    {metricTypeIcon(t.metric_type, "h-3 w-3")}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasMetrics && (
            <>
              <div className="space-y-2">
                {step4.impact_metrics.map((metric, idx) => (
                  <MetricCard
                    key={idx}
                    metric={metric}
                    index={idx}
                    isExpanded={expandedMetricIdx === idx}
                    onToggle={() => setExpandedMetricIdx(expandedMetricIdx === idx ? null : idx)}
                    onUpdate={(updates) => updateMetric(idx, updates)}
                    onDelete={() => deleteMetric(idx)}
                    onMove={(dir) => moveMetric(idx, dir)}
                    total={step4.impact_metrics.length}
                  />
                ))}
              </div>
              <div>
                <p className="text-[10px] text-[#8C8C8C] mb-1.5">Add from templates:</p>
                <div className="flex flex-wrap gap-1.5">
                  {METRIC_TEMPLATES.map((t) => (
                    <button
                      key={t.metric_key}
                      type="button"
                      onClick={() => addMetric(t)}
                      className="flex items-center gap-1 text-[11px] font-medium border border-[#E8E8E6] rounded-full px-2.5 py-1 hover:border-black/20 hover:bg-[#FAFAF9] transition-colors"
                    >
                      {metricTypeIcon(t.metric_type, "h-3 w-3")}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Verified claims — require evidence */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <p className="text-[10px] font-semibold text-[#525252] uppercase tracking-wider">Verified claims</p>
            <span className="text-[9px] text-[#8C8C8C] ml-0.5">— evidence link required</span>
          </div>
          <div className="space-y-1.5">
            {EVIDENCE_REQUIRED_CLAIMS.map((claim) => {
              const checked = isChecked(claim);
              return (
                <div
                  key={claim}
                  className={`rounded-xl border transition-colors ${checked ? "border-emerald-200 bg-emerald-50" : "border-[#E8E8E6]"}`}
                >
                  <label className="flex items-start gap-2.5 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded w-4 h-4 shrink-0 accent-emerald-600"
                      checked={checked}
                      onChange={() => toggleClaim(claim)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="text-[12px] font-medium text-black">{claim}</span>
                      </div>
                      {checked && (
                        <div className="mt-2 space-y-1">
                          <Label className="text-[10px] font-medium text-[#8C8C8C]">Evidence URL or document link *</Label>
                          <Input
                            className="h-7 text-[11px]"
                            type="url"
                            placeholder="https://… (certificate, audit report, verification)"
                            value={step4.claim_evidence_urls[claim] ?? ""}
                            onChange={(e) => setEvidenceUrl(claim, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {!step4.claim_evidence_urls[claim] && (
                            <p className="text-[10px] text-amber-700">Add evidence to make this claim credible on the public passport</p>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Self-declared claims */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5 text-[#525252]" />
            <p className="text-[10px] font-semibold text-[#525252] uppercase tracking-wider">Self-declared claims</p>
            <span className="text-[9px] text-[#8C8C8C] ml-0.5">— no evidence required</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {SELF_DECLARED_CLAIMS.map((claim) => {
              const checked = isChecked(claim);
              return (
                <label
                  key={claim}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    checked ? "border-[#D0D0CE] bg-[#F7F6F4]" : "border-[#E8E8E6] hover:border-black/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded w-4 h-4 shrink-0"
                    checked={checked}
                    onChange={() => toggleClaim(claim)}
                  />
                  <span className="text-[12px] text-[#444]">{claim}</span>
                </label>
              );
            })}
          </div>
        </div>

    </div>
  );
}
