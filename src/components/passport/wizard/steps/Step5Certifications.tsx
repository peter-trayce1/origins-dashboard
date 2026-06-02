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
];

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
  };
}

function ExpiryChip({ expiresAt }: { expiresAt: string }) {
  if (!expiresAt) return null;
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) {
    return <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>;
  }
  if (days < 60) {
    return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Expiring in {days}d</span>;
  }
  return <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>;
}

function CertDocUpload({
  certIdx,
  documentUrl,
  onUploaded,
}: {
  certIdx: number;
  documentUrl: string;
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
      console.error("Document upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (documentUrl) {
    return (
      <div className="flex items-center gap-2 h-8 px-3 border border-emerald-200 bg-emerald-50 rounded-lg">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <span className="text-[11px] text-emerald-800 flex-1 truncate">Document uploaded</span>
        <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <ExternalLink className="h-3 w-3 text-emerald-600" />
        </a>
        <button
          type="button"
          onClick={() => onUploaded("")}
          className="text-emerald-600 hover:text-red-600 transition-colors text-[10px] font-medium shrink-0"
        >
          Remove
        </button>
      </div>
    );
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
        {uploading ? "Uploading…" : "Upload certificate PDF"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}

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
          <div key={idx} className="border border-[#E8E8E6] rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#525252]" />
                <span className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide">
                  Certification {idx + 1}
                </span>
                <ExpiryChip expiresAt={cert.expires_at} />
              </div>
              <button
                onClick={() => removeCert(idx)}
                className="p-1 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Cert name */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Certification *</Label>
              <Select
                value={cert.certification_name}
                onValueChange={(v) => updateCert(idx, "certification_name", v ?? "")}
              >
                <SelectTrigger className="h-8 text-[13px]">
                  <SelectValue placeholder="Select certification" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATIONS.map((c) => (
                    <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cert.certification_name === "Custom certification" && (
                <Input
                  className="h-8 text-[13px] mt-1"
                  placeholder="Enter certification name"
                  onChange={(e) => updateCert(idx, "certification_name", e.target.value)}
                />
              )}
            </div>

            {/* Number + issuer */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Certificate number</Label>
                <Input
                  className="h-8 text-[13px]"
                  placeholder="e.g. CU890768"
                  value={cert.certificate_number}
                  onChange={(e) => updateCert(idx, "certificate_number", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Issued by</Label>
                <Input
                  className="h-8 text-[13px]"
                  placeholder="e.g. Control Union"
                  value={cert.issued_by}
                  onChange={(e) => updateCert(idx, "issued_by", e.target.value)}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Issue date</Label>
                <Input
                  className="h-8 text-[13px]"
                  type="date"
                  value={cert.issued_at}
                  onChange={(e) => updateCert(idx, "issued_at", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-[#8C8C8C]">Expiry date</Label>
                <Input
                  className="h-8 text-[13px]"
                  type="date"
                  value={cert.expires_at}
                  onChange={(e) => updateCert(idx, "expires_at", e.target.value)}
                />
              </div>
            </div>

            {/* Document upload */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Certificate document</Label>
              <CertDocUpload
                certIdx={idx}
                documentUrl={cert.document_url}
                onUploaded={(url) => updateCert(idx, "document_url", url)}
              />
            </div>

            {/* Verification URL */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Verification URL <span className="font-normal text-[#BDBDBB]">Optional</span></Label>
              <Input
                className="h-8 text-[13px]"
                type="url"
                placeholder="https://..."
                value={cert.verification_url}
                onChange={(e) => updateCert(idx, "verification_url", e.target.value)}
              />
            </div>

            {/* Evidence warning */}
            {!cert.document_url && !cert.verification_url && (
              <p className="text-[11px] text-red-600 leading-snug">
                Upload a certificate or add a verification URL for this certification to appear on the passport.
              </p>
            )}

            {/* Confidence */}
            <div className="space-y-1">
              <Label className="text-[10px] font-medium text-[#8C8C8C]">Data confidence</Label>
              <Select
                value={cert.confidence_level}
                onValueChange={(v) => updateCert(idx, "confidence_level", v ?? "brand_declared")}
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
        ))}

        <Button variant="outline" size="sm" onClick={addCert} className="w-full h-8 text-[12px]">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add certification
        </Button>
      </div>

      {/* Compliance notes */}
      <div className="border-t border-[#F0F0EE] pt-4 space-y-1.5">
        <Label className="text-[11px] font-medium text-[#525252]">Compliance notes <span className="text-[10px] font-normal text-[#BDBDBB]">Optional</span></Label>
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
