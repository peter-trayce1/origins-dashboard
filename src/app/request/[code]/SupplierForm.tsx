"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, Loader2, Upload, Plus, Trash2, ChevronDown } from "lucide-react";
import type { SectionConfig } from "@/lib/supply-chain-sections";

interface RequestData {
  id: string;
  request_code: string;
  supplier_name: string | null;
  status: string;
  message: string | null;
  brand: { name: string; logo_url: string | null } | null;
  passport: { product_name: string; primary_image_url: string | null } | null;
  sections: SectionConfig[];
}

function ProgressBar({ sections, formData }: { sections: SectionConfig[]; formData: Record<string, unknown> }) {
  const required = sections.filter(s => !s.optional);
  const filled = required.filter(s => {
    const v = formData[s.id];
    if (!v) return false;
    if (typeof v === "object" && !Array.isArray(v)) {
      const obj = v as Record<string, unknown>;
      return Object.values(obj).some(x => x !== "" && x !== null && x !== undefined);
    }
    if (Array.isArray(v)) return (v as unknown[]).length > 0;
    return true;
  }).length;
  const pct = required.length ? Math.round((filled / required.length) * 100) : 0;
  return (
    <div className="w-full h-1 bg-[#F0F0EE] rounded-full overflow-hidden">
      <div
        className="h-full bg-black rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface FileUploadFieldProps {
  fieldId: string;
  value: string;
  onChange: (url: string) => void;
}

function FileUploadField({ fieldId, value, onChange }: FileUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json() as { url: string };
      if (res.ok) onChange(data.url);
    } catch { /* ignore */ }
    setUploading(false);
    if (ref.current) ref.current.value = "";
  }

  const filename = value ? decodeURIComponent(value.split("/").pop()?.split("?")[0] ?? "Uploaded") : null;

  return (
    <>
      <input ref={ref} type="file" accept=".pdf,image/*" className="hidden" id={fieldId} onChange={handleFile} />
      {filename ? (
        <div className="flex items-center gap-2 h-11 px-4 border border-emerald-200 bg-emerald-50 rounded-xl">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="text-sm text-emerald-800 flex-1 truncate">{filename}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-emerald-600 hover:text-red-600 transition-colors font-medium shrink-0"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor={fieldId}
          className={`flex items-center justify-center gap-2 h-11 border-2 border-dashed border-[#D0D0CE] rounded-xl cursor-pointer hover:border-black/40 hover:bg-[#F9F9F8] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin text-[#525252]" /><span className="text-sm text-[#525252]">Uploading…</span></>
            : <><Upload className="h-4 w-4 text-[#8C8C8C]" /><span className="text-sm text-[#525252] font-medium">Upload PDF or image</span></>
          }
        </label>
      )}
    </>
  );
}

function SectionCard({
  section,
  value,
  onChange,
}: {
  section: SectionConfig;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [open, setOpen] = useState(!section.optional);

  function getField(fieldId: string): string {
    const v = value as Record<string, unknown>;
    return (v?.[fieldId] as string) ?? "";
  }
  function setField(fieldId: string, fv: unknown) {
    onChange({ ...(value as Record<string, unknown> ?? {}), [fieldId]: fv });
  }

  // Multi-checkbox handling
  function getChecked(fieldId: string, option: string): boolean {
    const v = value as Record<string, unknown>;
    const arr = (v?.[fieldId] as string[]) ?? [];
    return arr.includes(option);
  }
  function toggleCheckbox(fieldId: string, option: string) {
    const v = value as Record<string, unknown>;
    const arr = (v?.[fieldId] as string[]) ?? [];
    setField(fieldId, arr.includes(option) ? arr.filter(x => x !== option) : [...arr, option]);
  }

  // Repeating rows (materials, certifications)
  type RepeatingRow = Record<string, unknown>;
  const rows: RepeatingRow[] = section.repeating
    ? ((value as Record<string, unknown>)?.rows as RepeatingRow[]) ?? [{}]
    : [];

  function updateRow(idx: number, fieldId: string, fv: unknown) {
    const next = rows.map((r, i) => i === idx ? { ...r, [fieldId]: fv } : r);
    onChange({ ...(value as Record<string, unknown> ?? {}), rows: next });
  }
  function addRow() {
    onChange({ ...(value as Record<string, unknown> ?? {}), rows: [...rows, {}] });
  }
  function removeRow(idx: number) {
    onChange({ ...(value as Record<string, unknown> ?? {}), rows: rows.filter((_, i) => i !== idx) });
  }

  function renderField(
    field: SectionConfig["fields"][0],
    val: string,
    onVal: (v: unknown) => void,
    prefix: string,
    checkChecked?: (option: string) => boolean,
    checkToggle?: (option: string) => void,
  ) {
    const baseInput = "w-full h-11 border border-[#E8E8E6] rounded-xl px-4 text-[15px] text-black placeholder-[#BDBDBB] focus:outline-none focus:border-black/40 focus:ring-2 focus:ring-black/5 transition-colors bg-white";

    if (field.type === "multi_checkbox") {
      return (
        <div className="space-y-2">
          {(field.options ?? []).map(opt => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checkChecked?.(opt) ? "bg-black border-black" : "border-[#D0D0CE] group-hover:border-black/40"}`}>
                {checkChecked?.(opt) && <CheckCircle className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={checkChecked?.(opt) ?? false}
                onChange={() => checkToggle?.(opt)}
              />
              <span className="text-[15px] text-black">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div className="relative">
          <select
            className={`${baseInput} appearance-none pr-10`}
            value={val}
            onChange={e => onVal(e.target.value)}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C8C8C] pointer-events-none" />
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          className={`${baseInput} h-20 py-3 resize-none`}
          placeholder={field.placeholder}
          value={val}
          onChange={e => onVal(e.target.value)}
          rows={3}
        />
      );
    }

    if (field.type === "file") {
      return (
        <FileUploadField
          fieldId={`${prefix}-${field.id}`}
          value={val}
          onChange={onVal}
        />
      );
    }

    return (
      <div className="relative">
        <input
          className={baseInput + (field.unit ? " pr-16" : "")}
          type={field.type}
          placeholder={field.placeholder}
          value={val}
          onChange={e => onVal(e.target.value)}
        />
        {field.unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#8C8C8C] font-medium pointer-events-none">
            {field.unit}
          </span>
        )}
      </div>
    );
  }

  const hasSomeValue = (() => {
    if (!value) return false;
    const obj = value as Record<string, unknown>;
    if (section.repeating) {
      const rows = obj.rows as RepeatingRow[];
      return rows?.length > 0 && Object.values(rows[0]).some(v => v !== "" && v !== null && v !== undefined);
    }
    return Object.values(obj).some(v => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));
  })();

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden transition-all ${open ? "border-[#E8E8E6]" : "border-[#F0F0EE]"}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {hasSomeValue && (
            <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle className="h-3 w-3 text-emerald-600" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-black">
              {section.label}
              {section.optional && <span className="ml-2 text-[12px] font-normal text-[#8C8C8C]">Optional</span>}
            </p>
            {!open && (
              <p className="text-[13px] text-[#8C8C8C] truncate mt-0.5">{section.description}</p>
            )}
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-[#8C8C8C] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 border-t border-[#F8F8F7]">
          <p className="text-[13px] text-[#525252] pt-3">{section.description}</p>

          {section.repeating ? (
            <div className="space-y-4">
              {rows.map((row, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#F0F0EE] bg-[#FAFAF8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#525252] uppercase tracking-wide">
                      {section.id === "materials" ? `Material ${idx + 1}` : `Certification ${idx + 1}`}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="p-1 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {section.fields.map(field => (
                      <div key={field.id} className="space-y-1.5">
                        <label className="block text-[13px] font-medium text-[#333]">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-0.5">*</span>}
                          {!field.required && <span className="text-[11px] font-normal text-[#BDBDBB] ml-1.5">Optional</span>}
                        </label>
                        {renderField(
                          field,
                          (row[field.id] as string) ?? "",
                          (v) => updateRow(idx, field.id, v),
                          `row-${idx}`,
                        )}
                        {field.hint && <p className="text-[12px] text-[#8C8C8C]">{field.hint}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-2 text-[13px] font-medium text-[#525252] hover:text-black transition-colors py-1"
              >
                <Plus className="h-4 w-4" />
                {section.addLabel ?? "Add another"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-[14px] font-medium text-[#333]">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    {!field.required && field.type !== "multi_checkbox" && (
                      <span className="text-[11px] font-normal text-[#BDBDBB] ml-1.5">Optional</span>
                    )}
                  </label>
                  {renderField(
                    field,
                    getField(field.id),
                    (v) => setField(field.id, v),
                    `field-${section.id}`,
                    (opt) => getChecked(field.id, opt),
                    (opt) => toggleCheckbox(field.id, opt),
                  )}
                  {field.hint && <p className="text-[12px] text-[#8C8C8C]">{field.hint}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function SupplierForm({ code }: { code: string }) {
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/request/${code}`)
      .then(r => r.json())
      .then((data: RequestData & { error?: string }) => {
        if (data.error) { setError(data.error); }
        else {
          setRequestData(data);
          // Initialise repeating sections with one empty row
          const initial: Record<string, unknown> = {};
          (data.sections ?? []).forEach((s: SectionConfig) => {
            if (s.repeating) initial[s.id] = { rows: [{}] };
          });
          setFormData(initial);
        }
      })
      .catch(() => setError("Failed to load request"))
      .finally(() => setLoading(false));
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Shape the response_data: for repeating sections, extract the rows array
    const response_data: Record<string, unknown> = {};
    if (requestData) {
      requestData.sections.forEach(s => {
        const val = formData[s.id];
        if (s.repeating) {
          response_data[s.id] = (val as Record<string, unknown>)?.rows ?? [];
        } else {
          response_data[s.id] = val;
        }
      });
    }

    try {
      const res = await fetch(`/api/request/${code}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response_data }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      alert("Submission failed — please try again");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#8C8C8C] animate-spin" />
      </div>
    );
  }

  if (error || !requestData) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-lg font-semibold text-black mb-2">Request not found</p>
          <p className="text-[#525252] text-sm">{error ?? "This link may have expired or been removed."}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-3">Thank you!</h1>
          <p className="text-[#525252] leading-relaxed">
            Your information has been received by {requestData.brand?.name ?? "the brand"}.
            They&apos;ll use it to build a verified Digital Product Passport.
          </p>
          {requestData.passport && (
            <p className="text-sm text-[#8C8C8C] mt-4">
              Product: <span className="font-medium text-black">{requestData.passport.product_name}</span>
            </p>
          )}
          <div className="mt-8 text-[11px] text-[#BDBDBB] font-mono tracking-wider uppercase">
            Powered by OriginsID
          </div>
        </div>
      </div>
    );
  }

  const { brand, passport, sections, message, supplier_name } = requestData;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8E6] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <ProgressBar sections={sections} formData={formData} />
          <div className="flex items-center gap-3 py-4">
            {brand?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt={brand.name} className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                <span className="text-white text-xs font-bold">{brand?.name?.charAt(0) ?? "?"}</span>
              </div>
            )}
            <div>
              <p className="text-[13px] font-semibold text-black">{brand?.name ?? "Brand"}</p>
              <p className="text-[11px] text-[#8C8C8C]">Supply chain data request</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Intro card */}
        <div className="bg-white rounded-2xl border border-[#E8E8E6] p-6 mb-6">
          <div className="flex items-start gap-4">
            {passport?.primary_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={passport.primary_image_url}
                alt=""
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-black leading-tight">
                {supplier_name ? `Hi ${supplier_name},` : "Hi there,"}
              </h1>
              <p className="text-[#525252] mt-1.5 leading-relaxed text-[15px]">
                {message
                  ? message
                  : `${brand?.name ?? "A brand"} is building a Digital Product Passport for ${passport?.product_name ? `"${passport.product_name}"` : "one of their products"} and needs a few details from you.`
                }
              </p>
              {passport?.product_name && !message && (
                <p className="text-[13px] text-[#8C8C8C] mt-2">
                  Product: <span className="font-medium text-black">{passport.product_name}</span>
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#F0F0EE] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-[12px] text-[#525252]">
              No account required · Takes about 5 minutes · Your data is kept secure
            </p>
          </div>
        </div>

        {/* Sections */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {sections.map(section => (
            <SectionCard
              key={section.id}
              section={section}
              value={formData[section.id]}
              onChange={v => setFormData(prev => ({ ...prev, [section.id]: v }))}
            />
          ))}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 rounded-2xl bg-black text-white text-[16px] font-semibold hover:bg-[#1C1C1E] transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {submitting
                ? <><Loader2 className="h-5 w-5 animate-spin" />Submitting…</>
                : "Submit information"
              }
            </button>
            <p className="text-center text-[12px] text-[#BDBDBB] mt-3">
              Your response will be sent securely to {brand?.name ?? "the brand"}
            </p>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 inset-x-0 pointer-events-none flex justify-center pb-4">
        <div className="text-[10px] font-mono text-[#BDBDBB] tracking-widest uppercase">
          Powered by OriginsID
        </div>
      </div>
    </div>
  );
}
