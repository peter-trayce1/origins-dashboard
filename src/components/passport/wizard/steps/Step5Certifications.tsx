"use client";

import { useRef, useState } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShieldCheck, Upload, Loader2, ExternalLink } from "lucide-react";
import type { WizardCertification } from "@/types/wizard";

const CERTIFICATIONS = [
  "GOTS (Global Organic Textile Standard)",
  "OEKO-TEX Standard 100",
  "OEKO-TEX MADE IN GREEN",
  "GRS (Global Recycled Standard)",
  "RCS (Recycled Content Standard)",
  "Bluesign",
  "B Corp",
  "Fair Trade",
  "Fairtrade Cotton",
  "FSC",
  "ZDHC",
  "EU Ecolabel",
  "European Flax",
  "Cradle to Cradle",
  "Leather Working Group",
  "Better Cotton (BCI)",
  "SA8000",
  "ISO 14001",
  "ISO 9001",
  "USDA Organic",
  "Soil Association Organic",
  "Nordic Swan",
  "REACH Declaration",
  "Custom certification",
] as const;

// Every entry except the sentinel has a logo — used to decide if custom logo upload is needed
const KNOWN_CERTS: ReadonlyArray<string> = CERTIFICATIONS.filter(c => c !== "Custom certification");

function defaultCert(): WizardCertification {
  return {
    certification_name: "",
    certificate_number: "",
    issued_by: "",
    issued_at: "",
    expires_at: "",
    document_url: "",
    verification_url: "",
    claim_type: "",
    confidence_level: "brand_declared",
    description: "",
    custom_logo_url: "",
  };
}

function ExpiryChip({ expiresAt }: { expiresAt: string }) {
  if (!expiresAt) return null;
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>;
  if (days < 60) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Expiring in {days}d</span>;
  return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>;
}

function FileUploadButton({
  label,
  uploadingLabel,
  accept,
  onUploaded,
}: {
  label: string;
  uploadingLabel: string;
  accept: string;
  onUploaded: (url: string) => void;
}) {
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
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full h-8 flex items-center justify-center gap-1.5 border border-dashed border-[#E8E8E6] rounded-lg text-[11px] text-[#525252] hover:border-black/25 hover:bg-[#FAFAF8] transition-colors"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? uploadingLabel : label}
      </button>
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </>
  );
}

function CertDocUpload({ documentUrl, onUploaded }: { documentUrl: string; onUploaded: (url: string) => void }) {
  if (documentUrl) {
    return (
      <div className="flex items-center gap-2 h-8 px-3 border border-emerald-200 bg-emerald-50 rounded-lg">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <span className="text-[11px] text-emerald-800 flex-1 truncate">Document uploaded</span>
        <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <ExternalLink className="h-3 w-3 text-emerald-600" />
        </a>
        <button type="button" onClick={() => onUploaded("")} className="text-emerald-600 hover:text-red-600 text-[10px] font-medium shrink-0">
          Remove
        </button>
      </div>
    );
  }
  return (
    <FileUploadButton
      label="Upload certificate PDF"
      uploadingLabel="Uploading…"
      accept="application/pdf,image/*"
      onUploaded={onUploaded}
    />
  );
}

function CertLogoUpload({ logoUrl, onUploaded }: { logoUrl: string; onUploaded: (url: string) => void }) {
  if (logoUrl) {
    return (
      <div className="flex items-center gap-2 h-8 px-3 border border-[#E8E8E6] bg-[#FAFAF8] rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
        <span className="text-[11px] text-[#525252] flex-1 truncate">Logo uploaded</span>
        <button type="button" onClick={() => onUploaded("")} className="text-[#8C8C8C] hover:text-red-600 text-[10px] font-medium">
          Remove
        </button>
      </div>
    );
  }
  return (
    <FileUploadButton
      label="Upload certification logo (PNG / SVG)"
      uploadingLabel="Uploading…"
      accept="image/*"
      onUploaded={onUploaded}
    />
  );
}

// ── Per-cert card with local state to manage custom-name mode ─────────────────
// Extracting to its own component is the key fix: `customMode` is local state
// that persists regardless of what `certification_name` is set to in the store.

function CertCard({
  cert,
  idx,
  onUpdate,
  onRemove,
}: {
  cert: WizardCertification;
  idx: number;
  onUpdate: (idx: number, field: keyof WizardCertification, value: string) => void;
  onRemove: (idx: number) => void;
}) {
  // True when the cert was loaded from DB as a non-standard name, or the user chose "Custom"
  const [customMode, setCustomMode] = useState(
    cert.certification_name !== "" && !KNOWN_CERTS.includes(cert.certification_name)
  );

  const selectValue = customMode ? "Custom certification" : cert.certification_name;
  // Show logo uploader for custom certs that have a name entered
  const showLogoUpload = customMode && cert.certification_name !== "" && cert.certification_name !== "Custom certification";

  function handleSelectChange(value: string) {
    if (value === "Custom certification") {
      setCustomMode(true);
      onUpdate(idx, "certification_name", "");
      onUpdate(idx, "custom_logo_url", "");
    } else {
      setCustomMode(false);
      onUpdate(idx, "custom_logo_url", "");
      onUpdate(idx, "certification_name", value);
    }
  }

  // Controlled value for the custom name input — treat legacy "Custom certification" string as blank
  const customInputValue =
    cert.certification_name === "Custom certification" ? "" : (cert.certification_name ?? "");

  return (
    <div className="border border-[#E8E8E6] rounded-xl p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-[#525252]" />
          <span className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide">
            Certification {idx + 1}
          </span>
          <ExpiryChip expiresAt={cert.expires_at} />
        </div>
        <button
          onClick={() => onRemove(idx)}
          className="p-1 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Cert name */}
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-[#8C8C8C]">Certification *</Label>
        <Select value={selectValue} onValueChange={handleSelectChange}>
          <SelectTrigger className="h-8 text-[13px]">
            <SelectValue placeholder="Select certification" />
          </SelectTrigger>
          <SelectContent>
            {CERTIFICATIONS.map((c) => (
              <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {customMode && (
          <Input
            className="h-8 text-[13px] mt-1"
            placeholder="Enter certification name"
            value={customInputValue}
            onChange={(e) => onUpdate(idx, "certification_name", e.target.value)}
            autoFocus
          />
        )}
      </div>

      {/* Custom logo upload — only for custom certs with a name */}
      {showLogoUpload && (
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">
            Certification logo <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span>
          </Label>
          <CertLogoUpload
            logoUrl={cert.custom_logo_url ?? ""}
            onUploaded={(url) => onUpdate(idx, "custom_logo_url", url)}
          />
        </div>
      )}

      {/* Description for consumers */}
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-[#8C8C8C]">
          Description for customers <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span>
        </Label>
        <Textarea
          className="text-[13px] resize-none"
          rows={2}
          placeholder="Explain what this certification means for customers…"
          value={cert.description ?? ""}
          onChange={(e) => onUpdate(idx, "description", e.target.value)}
        />
      </div>

      {/* Number + issuer */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">Certificate number</Label>
          <Input
            className="h-8 text-[13px]"
            placeholder="e.g. CU890768"
            value={cert.certificate_number}
            onChange={(e) => onUpdate(idx, "certificate_number", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">Issued by</Label>
          <Input
            className="h-8 text-[13px]"
            placeholder="e.g. Control Union"
            value={cert.issued_by}
            onChange={(e) => onUpdate(idx, "issued_by", e.target.value)}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">Issue date</Label>
          <Input className="h-8 text-[13px]" type="date" value={cert.issued_at}
            onChange={(e) => onUpdate(idx, "issued_at", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">Expiry date</Label>
          <Input className="h-8 text-[13px]" type="date" value={cert.expires_at}
            onChange={(e) => onUpdate(idx, "expires_at", e.target.value)} />
        </div>
      </div>

      {/* Document upload */}
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-[#8C8C8C]">Certificate document</Label>
        <CertDocUpload documentUrl={cert.document_url} onUploaded={(url) => onUpdate(idx, "document_url", url)} />
      </div>

      {/* Verification URL */}
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-[#8C8C8C]">
          Verification URL <span className="font-normal text-[#BDBDBB]">Optional</span>
        </Label>
        <Input
          className="h-8 text-[13px]" type="url" placeholder="https://..."
          value={cert.verification_url}
          onChange={(e) => onUpdate(idx, "verification_url", e.target.value)}
        />
      </div>

      {!cert.document_url && !cert.verification_url && (
        <p className="text-[11px] text-red-600 leading-snug">
          Upload a certificate or add a verification URL for this certification to appear on the passport.
        </p>
      )}

      {/* Confidence */}
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-[#8C8C8C]">Data confidence</Label>
        <Select value={cert.confidence_level} onValueChange={(v) => onUpdate(idx, "confidence_level", v ?? "brand_declared")}>
          <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="verified" className="text-[13px]">Third-party verified</SelectItem>
            <SelectItem value="brand_declared" className="text-[13px]">Brand declared</SelectItem>
            <SelectItem value="supplier_declared" className="text-[13px]">Supplier declared</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Step5Certifications() {
  const { step5, setStep5 } = useWizardStore();
  const certs = step5.certifications;

  function addCert() {
    setStep5({ certifications: [...certs, defaultCert()] });
  }

  function removeCert(idx: number) {
    setStep5({ certifications: certs.filter((_, i) => i !== idx) });
  }

  function updateCert(idx: number, field: keyof WizardCertification, value: string) {
    setStep5({ certifications: certs.map((c, i) => i === idx ? { ...c, [field]: value } : c) });
  }

  return (
    <div className="space-y-4">
      {certs.length === 0 && (
        <div className="border border-dashed border-[#E8E8E6] rounded-xl p-6 text-center">
          <ShieldCheck className="h-6 w-6 text-[#8C8C8C] mx-auto mb-2" />
          <p className="text-[13px] text-[#525252]">No certifications added yet</p>
          <p className="text-[11px] text-[#8C8C8C] mt-0.5">Optional — but certifications significantly increase consumer trust</p>
        </div>
      )}

      <div className="space-y-2">
        {certs.map((cert, idx) => (
          <CertCard key={idx} cert={cert} idx={idx} onUpdate={updateCert} onRemove={removeCert} />
        ))}

        <Button variant="outline" size="sm" onClick={addCert} className="w-full h-8 text-[12px]">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add certification
        </Button>
      </div>

      {/* Compliance notes */}
      <div className="border-t border-[#F0F0EE] pt-4 space-y-1.5">
        <Label className="text-[11px] font-medium text-[#525252]">
          Compliance notes <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span>
        </Label>
        <Textarea
          className="text-[13px] resize-none"
          rows={2}
          placeholder="Additional compliance information, regulatory standards met, declarations…"
          value={step5.compliance_notes}
          onChange={(e) => setStep5({ compliance_notes: e.target.value })}
        />
      </div>
    </div>
  );
}
