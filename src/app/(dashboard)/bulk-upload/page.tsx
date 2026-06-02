"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, Check, Loader2, AlertCircle,
  ArrowRight, Download, Sparkles, ChevronDown, ChevronRight,
  Zap, BarChart2, BookOpen, FileText,
} from "lucide-react";
import { PASSPORT_FIELDS, type ColumnMapping, type ColumnSuggestion } from "@/lib/csv/mapper";
import { TEMPLATES, downloadTemplate } from "@/lib/csv/templates";

type Step = "upload" | "map" | "preview" | "done";

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  errors: string[];
  suggestedMappings: ColumnSuggestion[];
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.9) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
        <Check className="h-2.5 w-2.5" />
        Matched
      </span>
    );
  }
  if (confidence >= 0.75) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
        Likely
      </span>
    );
  }
  return null;
}

// ── Field group labels ────────────────────────────────────────────────────────

const GROUP_LABELS: Record<string, string> = {
  core: "Core fields",
  ids: "Identifiers",
  story: "Story & sustainability",
  impact: "Impact metrics",
  compound: "Compound fields (auto-parsed)",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BulkUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [confidenceMap, setConfidenceMap] = useState<Record<string, number>>({});
  const [aliasMap, setAliasMap] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    failed: { rowIndex: number; error: string }[];
    passportIds: string[];
  } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/bulk-upload/parse", { method: "POST", body: formData });
    if (!res.ok) {
      toast.error("Failed to parse CSV — check the file format and try again");
      setIsProcessing(false);
      return;
    }

    const data: ParsedData = await res.json();
    setParsedData(data);

    const initialMappings: ColumnMapping[] = [];
    const cMap: Record<string, number> = {};
    const aMap: Record<string, string> = {};

    for (const s of data.suggestedMappings) {
      cMap[s.csvColumn] = s.confidence;
      aMap[s.csvColumn] = s.matchedAlias;
      if (s.passportField) {
        initialMappings.push({ csvColumn: s.csvColumn, passportField: s.passportField });
      }
    }

    setMappings(initialMappings);
    setConfidenceMap(cMap);
    setAliasMap(aMap);
    setStep("map");
    setIsProcessing(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  function setMapping(csvColumn: string, passportField: string) {
    setMappings((prev) => {
      const filtered = prev.filter(
        (m) => m.csvColumn !== csvColumn && (passportField === "" || m.passportField !== passportField)
      );
      if (passportField === "") return filtered;
      return [...filtered, { csvColumn, passportField }];
    });
  }

  function getMappingForColumn(csvColumn: string) {
    return mappings.find((m) => m.csvColumn === csvColumn)?.passportField ?? "";
  }

  async function handleImport() {
    if (!parsedData) return;
    setIsProcessing(true);

    const res = await fetch("/api/bulk-upload/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: parsedData.rows, mappings }),
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 422 && data.validationErrors?.length > 0) {
        toast.error(`${data.validationErrors.length} row(s) failed validation — fix the data and try again`);
      } else {
        toast.error(data.error ?? "Import failed");
      }
      setIsProcessing(false);
      return;
    }

    setImportResult(data);
    setStep("done");
    setIsProcessing(false);
  }

  const autoMapped = mappings.filter((m) => (confidenceMap[m.csvColumn] ?? 0) >= 0.75).length;
  const hasMappedName = mappings.some((m) => m.passportField === "product_name");

  // Group fields for the dropdown
  const fieldsByGroup = PASSPORT_FIELDS.reduce<Record<string, typeof PASSPORT_FIELDS>>((acc, f) => {
    acc[f.group] = acc[f.group] ?? [];
    acc[f.group].push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Bulk import"
        description="Import multiple passports from a CSV file — no spreadsheet expertise required."
      />

      {/* Steps */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "map", "preview", "done"] as Step[]).map((s, i) => {
          const steps = ["upload", "map", "preview", "done"] as Step[];
          const isComplete = steps.indexOf(s) < steps.indexOf(step);
          const isCurrent = s === step;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                isComplete ? "bg-emerald-600 text-white" : isCurrent ? "bg-black text-white" : "bg-[#F4F4F3] text-[#8C8C8C]"
              }`}>
                {isComplete ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={isCurrent ? "text-black font-medium" : "text-[#8C8C8C]"}>
                {s === "upload" ? "Upload" : s === "map" ? "Map columns" : s === "preview" ? "Preview" : "Done"}
              </span>
              {i < 3 && <div className="h-px w-6 bg-[#E8E8E6]" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Upload ── */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Template cards */}
          <div>
            <p className="text-sm font-medium text-black mb-3">Download a template to get started</p>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => downloadTemplate(tpl.id)}
                  className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all hover:shadow-sm group ${
                    tpl.recommended
                      ? "border-black/20 bg-[#FAFAF9]"
                      : "border-[#E8E8E6] hover:border-black/20"
                  }`}
                >
                  {tpl.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-[#0e6dea] bg-blue-50 px-1.5 py-0.5 rounded-full">
                      {tpl.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-[#525252]" />
                    <span className="text-[13px] font-semibold text-black">{tpl.label}</span>
                  </div>
                  <p className="text-[11px] text-[#525252] leading-relaxed">{tpl.description}</p>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#525252] group-hover:text-black transition-colors">
                    <Download className="h-3 w-3" />
                    Download CSV
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dropzone */}
          <div>
            <p className="text-sm font-medium text-black mb-3">Or upload your own file</p>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-black bg-[#F9F9F8]" : "border-[#E8E8E6] hover:border-black/30"
              }`}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <Loader2 className="h-7 w-7 mx-auto animate-spin text-[#8C8C8C] mb-3" />
              ) : (
                <Upload className="h-7 w-7 mx-auto text-[#8C8C8C] mb-3" />
              )}
              <p className="text-sm font-medium text-black mb-1">
                {isDragActive ? "Drop your CSV here" : "Drop a CSV here, or click to browse"}
              </p>
              <p className="text-xs text-[#8C8C8C]">Any column names — we'll map them for you. Up to 10 MB.</p>
            </div>
          </div>

          {/* Design principles */}
          <div className="border border-[#E8E8E6] rounded-xl p-4 space-y-2">
            <p className="text-[11px] font-semibold text-[#525252] uppercase tracking-wide">How it works</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                "Use semicolons to separate multiple values",
                'Material: "98% Organic Cotton; 2% Elastane"',
                'Certifications: "GOTS; OEKO-TEX; GRS"',
                'Care: "Machine wash 30°C; Do not tumble dry"',
                "Column names don't need to match exactly",
                "Origins auto-recognises common naming styles",
              ].map((tip) => (
                <p key={tip} className="text-[11px] text-[#525252] flex items-start gap-1.5">
                  <ChevronRight className="h-3 w-3 text-[#BDBDBB] shrink-0 mt-0.5" />
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Map columns ── */}
      {step === "map" && parsedData && (
        <div className="space-y-5">
          {/* Summary header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-black">
                AI recognised {autoMapped} of {parsedData.headers.length} column{parsedData.headers.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-[#525252] mt-0.5">
                {parsedData.rowCount} product{parsedData.rowCount !== 1 ? "s" : ""} ready to import. Adjust mappings if needed.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#525252] shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-[#8C8C8C]" />
              AI column mapping
            </div>
          </div>

          {parsedData.errors.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 text-sm text-amber-800">
              <strong>Parse warnings:</strong> {parsedData.errors.join(", ")}
            </div>
          )}

          <div className="border border-[#E8E8E6] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F9F9F8] border-b border-[#E8E8E6]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#525252]">Your column</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#525252]">Maps to</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#525252] hidden sm:table-cell">Sample value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E6]">
                {parsedData.headers.map((header) => {
                  const mapped = getMappingForColumn(header);
                  const confidence = confidenceMap[header] ?? 0;
                  return (
                    <tr key={header} className={mapped ? "" : "bg-[#FEFEFE]"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-black bg-[#F4F4F3] px-1.5 py-0.5 rounded">
                            {header}
                          </span>
                          <ConfidenceBadge confidence={mapped ? confidence : 0} />
                        </div>
                        {mapped && confidence >= 0.75 && aliasMap[header] && aliasMap[header] !== header && (
                          <p className="text-[10px] text-[#8C8C8C] mt-0.5 pl-0.5">
                            Recognised as "{aliasMap[header]}"
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="text-[12px] border border-[#E8E8E6] rounded-lg px-2 py-1.5 bg-white w-full max-w-[220px] focus:outline-none focus:border-black/30"
                          value={mapped}
                          onChange={(e) => setMapping(header, e.target.value)}
                        >
                          <option value="">— skip this column —</option>
                          {(Object.entries(fieldsByGroup) as [string, typeof PASSPORT_FIELDS][]).map(([group, fields]) => (
                            <optgroup key={group} label={GROUP_LABELS[group] ?? group}>
                              {fields.map((f) => (
                                <option key={f.key} value={f.key} disabled={
                                  mappings.some((m) => m.passportField === f.key && m.csvColumn !== header)
                                }>
                                  {f.label}{f.required ? " *" : ""}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-[#8C8C8C] line-clamp-1 max-w-[180px] inline-block">
                          {parsedData.rows[0]?.[header] || <span className="italic">—</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("preview")}
              disabled={!hasMappedName}
              className="inline-flex h-9 items-center gap-2 px-4 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-40"
            >
              Preview import
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setStep("upload"); setParsedData(null); setMappings([]); }}
              className="h-9 px-4 rounded-xl border border-[#E8E8E6] text-[13px] font-medium text-[#525252] hover:bg-[#F7F6F4] transition-colors"
            >
              Start over
            </button>
          </div>
          {!hasMappedName && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Map at least the "Product Name" column to continue
            </p>
          )}
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === "preview" && parsedData && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-black">
              Importing {parsedData.rowCount} passport draft{parsedData.rowCount !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-[#525252] mt-0.5">
              Review a sample of your data before we create the passports.
            </p>
          </div>

          <div className="border border-[#E8E8E6] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-max">
                <thead className="bg-[#F9F9F8] border-b border-[#E8E8E6]">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#525252] whitespace-nowrap">#</th>
                    {mappings.map((m) => {
                      const field = PASSPORT_FIELDS.find((f) => f.key === m.passportField);
                      return (
                        <th key={m.passportField} className="text-left px-3 py-2.5 text-xs font-semibold text-[#525252] whitespace-nowrap">
                          {field?.label ?? m.passportField}
                          {field?.group === "compound" && (
                            <span className="ml-1 text-[9px] font-normal text-[#0e6dea]">parsed</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8E6]">
                  {parsedData.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-[#F9F9F8]">
                      <td className="px-3 py-2.5 text-xs text-[#BDBDBB] font-mono">{i + 1}</td>
                      {mappings.map((m) => (
                        <td key={m.passportField} className="px-3 py-2.5 text-xs text-[#525252] max-w-[200px]">
                          {row[m.csvColumn] ? (
                            <span className="line-clamp-2">{row[m.csvColumn]}</span>
                          ) : (
                            <span className="text-[#BDBDBB] italic">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.rowCount > 5 && (
              <div className="px-4 py-2.5 bg-[#F9F9F8] border-t border-[#E8E8E6] text-xs text-[#8C8C8C]">
                + {parsedData.rowCount - 5} more product{parsedData.rowCount - 5 !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="inline-flex h-9 items-center gap-2 px-4 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Importing…</>
              ) : (
                <>Import {parsedData.rowCount} passport{parsedData.rowCount !== 1 ? "s" : ""}</>
              )}
            </button>
            <button
              onClick={() => setStep("map")}
              className="h-9 px-4 rounded-xl border border-[#E8E8E6] text-[13px] font-medium text-[#525252] hover:bg-[#F7F6F4] transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === "done" && importResult && (
        <div className="space-y-6">
          {/* Success card */}
          <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white border border-emerald-200 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-black">
                {importResult.created} passport draft{importResult.created !== 1 ? "s" : ""} created
              </p>
              <p className="text-xs text-[#525252] mt-1">
                Each passport has a unique Passport ID and completeness score. Open any passport to continue adding detail.
              </p>
            </div>
          </div>

          {importResult.failed.length > 0 && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-sm text-red-700 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                {importResult.failed.length} row{importResult.failed.length !== 1 ? "s" : ""} failed
              </p>
              {importResult.failed.map((f) => (
                <p key={f.rowIndex} className="text-xs">Row {f.rowIndex + 2}: {f.error}</p>
              ))}
            </div>
          )}

          {/* AI enrichment panel */}
          <div className="border border-[#E8E8E6] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E8E6] flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <div>
                <p className="text-[13px] font-semibold text-black">Enhance with AI</p>
                <p className="text-[11px] text-[#525252]">Automatically improve your imported passports</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {[
                { icon: FileText,   label: "Generate descriptions",   desc: "Write compelling product descriptions from your data" },
                { icon: BookOpen,   label: "Generate stories",        desc: "Create origin stories from materials and factory info" },
                { icon: BarChart2,  label: "Suggest care guidance",   desc: "Recommend care instructions based on material composition" },
                { icon: Zap,        label: "Populate missing fields",  desc: "Fill gaps using product URLs and public data" },
              ].map(({ icon: Icon, label, desc }) => (
                <label key={label} className="flex items-start gap-3 p-3 rounded-xl border border-[#E8E8E6] cursor-pointer hover:border-black/20 transition-colors group">
                  <input type="checkbox" defaultChecked className="mt-0.5 w-4 h-4 accent-black shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-[#525252]" />
                      <p className="text-[12px] font-medium text-black">{label}</p>
                    </div>
                    <p className="text-[11px] text-[#525252] mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="px-5 pb-4">
              <button
                onClick={() => router.push("/ai-generator")}
                className="w-full h-9 rounded-xl bg-violet-600 text-white text-[13px] font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Enhance {importResult.created} passport{importResult.created !== 1 ? "s" : ""} with AI
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/passports")}
              className="inline-flex h-9 items-center gap-2 px-4 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-[#1C1C1E] transition-colors"
            >
              View passports
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setStep("upload"); setParsedData(null); setImportResult(null); setMappings([]); }}
              className="h-9 px-4 rounded-xl border border-[#E8E8E6] text-[13px] font-medium text-[#525252] hover:bg-[#F7F6F4] transition-colors"
            >
              Import another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
