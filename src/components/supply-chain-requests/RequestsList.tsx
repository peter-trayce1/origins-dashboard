"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus, Send, CheckCircle, Clock, AlertCircle, FileText,
  Copy, Check, Loader2, Trash2, ExternalLink, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeDate } from "@/lib/utils";
import type { SupplyChainRequest, RequestStatus } from "@/types/supply-chain-request";
import { TIER1_SECTIONS } from "@/lib/supply-chain-sections";

interface Props { brandId: string }

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  draft:       { label: "Draft",             color: "text-[#8C8C8C]",   bg: "bg-[#F4F4F2]" },
  sent:        { label: "Sent",              color: "text-blue-700",    bg: "bg-blue-50" },
  opened:      { label: "Opened",            color: "text-violet-700",  bg: "bg-violet-50" },
  in_progress: { label: "In Progress",       color: "text-amber-700",   bg: "bg-amber-50" },
  completed:   { label: "Completed",         color: "text-emerald-700", bg: "bg-emerald-50" },
  expired:     { label: "Expired",           color: "text-red-600",     bg: "bg-red-50" },
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
      {status === "completed" && <CheckCircle className="h-3 w-3" />}
      {status === "sent" && <Send className="h-3 w-3" />}
      {(status === "opened" || status === "in_progress") && <Clock className="h-3 w-3" />}
      {status === "expired" && <AlertCircle className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}

function CopyLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const url = `${appUrl}/request/${code}`;
  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-[11px] font-medium text-[#525252] hover:text-black transition-colors"
      title={url}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}

// ── New Request Panel ─────────────────────────────────────────────────────────

interface Passport { id: string; product_name: string; passport_code: string | null }

function NewRequestPanel({ onCreated, initialPassportId = "" }: { onCreated: (req: SupplyChainRequest) => void; initialPassportId?: string }) {
  const [step, setStep] = useState<"details" | "sections" | "done">("details");
  const [passports, setPassports] = useState<Passport[]>([]);
  const [selectedPassportId, setSelectedPassportId] = useState(initialPassportId);
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sections, setSections] = useState<{ id: string; included: boolean }[]>(
    TIER1_SECTIONS.map((s) => ({ id: s.id, included: true }))
  );
  const [detecting, setDetecting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdReq, setCreatedReq] = useState<SupplyChainRequest | null>(null);

  useEffect(() => {
    fetch("/api/passports").then(r => r.json()).then((data: Passport[]) => setPassports(data ?? []));
  }, []);

  async function detectGaps() {
    if (!selectedPassportId) return;
    setDetecting(true);
    try {
      const res = await fetch(`/api/supply-chain-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passport_id: selectedPassportId }),
      });
      if (res.ok) {
        const req = await res.json() as SupplyChainRequest;
        setSections(req.sections);
        // Immediately delete this draft — we'll create the real one on submit
        await fetch(`/api/supply-chain-requests/${req.id}`, { method: "DELETE" });
      }
    } catch { /* ignore */ }
    setDetecting(false);
    setStep("sections");
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/supply-chain-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passport_id: selectedPassportId || null,
          supplier_name: supplierName || null,
          supplier_email: supplierEmail || null,
          message: message || null,
          sections: sections.filter(s => s.included).map(s => s.id),
        }),
      });
      if (!res.ok) throw new Error();
      const req = await res.json() as SupplyChainRequest;
      // Auto-send (move out of draft immediately)
      await fetch(`/api/supply-chain-requests/${req.id}/send`, { method: "POST" });
      req.status = "sent";
      setCreatedReq(req);
      setStep("done");
      onCreated(req);
      toast.success("Request created — share the link with your supplier");
    } catch {
      toast.error("Failed to create request");
    }
    setCreating(false);
  }

  if (step === "done" && createdReq) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const link = `${appUrl}/request/${createdReq.request_code}`;
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-black">Request created</p>
          <p className="text-xs text-[#525252] mt-0.5">Share this link with your supplier</p>
        </div>
        <div className="flex items-center gap-2 w-full max-w-sm bg-[#F7F6F4] border border-[#E8E8E6] rounded-xl px-3 py-2.5">
          <span className="font-mono text-[11px] text-[#525252] flex-1 truncate">{link}</span>
          <CopyLinkButton code={createdReq.request_code} />
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12px] text-[#0e6dea] hover:opacity-80 transition-opacity"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Preview supplier form
        </a>
      </div>
    );
  }

  if (step === "sections") {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-black">Select sections to include</p>
          <p className="text-xs text-[#525252] mt-0.5">We've pre-selected the sections most likely to be missing. Adjust as needed.</p>
        </div>
        <div className="space-y-1.5">
          {TIER1_SECTIONS.map((sec) => {
            const s = sections.find(x => x.id === sec.id);
            const included = s?.included ?? false;
            return (
              <label
                key={sec.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  included ? "border-black/20 bg-[#F4F4F2]" : "border-[#E8E8E6] hover:border-black/15"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 accent-black rounded shrink-0"
                  checked={included}
                  onChange={() => setSections(prev =>
                    prev.map(x => x.id === sec.id ? { ...x, included: !x.included } : x)
                  )}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-black">
                    {sec.label}
                    {sec.optional && <span className="ml-1.5 text-[10px] font-normal text-[#8C8C8C]">Optional</span>}
                  </p>
                  <p className="text-[11px] text-[#525252] mt-0.5">{sec.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="space-y-2 pt-2 border-t border-[#F0F0EE]">
          <p className="text-xs font-medium text-[#525252]">Optional message to supplier</p>
          <textarea
            className="w-full text-[13px] border border-[#E8E8E6] rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-black/30"
            rows={2}
            placeholder="Hi, we need some details for our product passport. It only takes a few minutes!"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStep("details")}
            className="flex-1 h-9 rounded-xl border border-[#E8E8E6] text-[13px] font-medium text-[#525252] hover:bg-[#F7F6F4] transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !sections.some(s => s.included)}
            className="flex-1 h-9 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Creating…</> : "Create Request"}
          </button>
        </div>
      </div>
    );
  }

  // step === "details"
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-black">New supplier data request</p>
        <p className="text-xs text-[#525252] mt-0.5">We'll generate a secure form link for your supplier</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-[#525252]">Linked passport <span className="font-normal text-[#BDBDBB]">Optional</span></label>
          <select
            className="w-full h-9 border border-[#E8E8E6] rounded-xl px-3 text-[13px] bg-white focus:outline-none focus:border-black/30"
            value={selectedPassportId}
            onChange={e => setSelectedPassportId(e.target.value)}
          >
            <option value="">Select a passport (enables smart gap detection)</option>
            {passports.map(p => (
              <option key={p.id} value={p.id}>
                {p.product_name || "Untitled"} {p.passport_code ? `· ${p.passport_code}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#525252]">Supplier name <span className="font-normal text-[#BDBDBB]">Optional</span></label>
            <input
              className="w-full h-9 border border-[#E8E8E6] rounded-xl px-3 text-[13px] focus:outline-none focus:border-black/30"
              placeholder="e.g. Atelier Silva"
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#525252]">Supplier email <span className="font-normal text-[#BDBDBB]">Optional</span></label>
            <input
              className="w-full h-9 border border-[#E8E8E6] rounded-xl px-3 text-[13px] focus:outline-none focus:border-black/30"
              type="email"
              placeholder="supplier@factory.com"
              value={supplierEmail}
              onChange={e => setSupplierEmail(e.target.value)}
            />
          </div>
        </div>
      </div>
      <button
        onClick={selectedPassportId ? detectGaps : () => setStep("sections")}
        disabled={detecting}
        className="w-full h-9 rounded-xl bg-black text-white text-[13px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {detecting
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analysing passport…</>
          : selectedPassportId
            ? "Analyse & Choose Sections →"
            : "Choose Sections →"
        }
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function RequestsList({ brandId }: Props) {
  const searchParams = useSearchParams();
  const passportIdParam = searchParams.get("passportId") ?? "";

  const [requests, setRequests] = useState<SupplyChainRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(!!passportIdParam);
  const [importing, setImporting] = useState<string | null>(null);

  void brandId; // brand scoping is handled server-side

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/supply-chain-requests");
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this request? This cannot be undone.")) return;
    await fetch(`/api/supply-chain-requests/${id}`, { method: "DELETE" });
    setRequests(prev => prev.filter(r => r.id !== id));
    toast.success("Request deleted");
  }

  async function handleImport(req: SupplyChainRequest) {
    if (!req.passport_id) {
      toast.error("No passport linked to this request");
      return;
    }
    setImporting(req.id);
    const res = await fetch(`/api/supply-chain-requests/${req.id}/import`, { method: "POST" });
    if (res.ok) {
      const { imported } = await res.json() as { imported: string[] };
      toast.success(`Imported ${imported.length} section${imported.length !== 1 ? "s" : ""} to passport`);
    } else {
      toast.error("Import failed");
    }
    setImporting(null);
  }

  const stats = {
    open: requests.filter(r => ["sent", "opened", "in_progress"].includes(r.status)).length,
    completed: requests.filter(r => r.status === "completed").length,
    awaiting: requests.filter(r => ["sent", "opened"].includes(r.status)).length,
    total: requests.length,
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 text-[#BDBDBB] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open requests",    value: stats.open,      icon: Send },
          { label: "Completed",        value: stats.completed, icon: CheckCircle },
          { label: "Awaiting response",value: stats.awaiting,  icon: Clock },
          { label: "Total requests",   value: stats.total,     icon: FileText },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="border border-[#E8E8E6] rounded-xl bg-white shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[#8C8C8C] uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-black mt-1 tabular-nums">{stat.value}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#F4F4F3] flex items-center justify-center">
                  <Icon className="h-4 w-4 text-[#525252]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New request panel + table header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-black">Requests</h2>
          <button
            onClick={() => setShowNew(v => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent bg-black px-2.5 text-sm font-medium text-white transition-all hover:bg-[#1C1C1E]"
          >
            {showNew ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showNew ? "Cancel" : "New request"}
          </button>
        </div>

        {showNew && (
          <div className="border border-[#E8E8E6] rounded-xl bg-white p-5">
            <NewRequestPanel
              initialPassportId={passportIdParam}
              onCreated={(req) => {
                setRequests(prev => [{ ...req, status: "sent" }, ...prev]);
                setShowNew(false);
              }}
            />
          </div>
        )}

        {/* Table */}
        {requests.length === 0 && !showNew ? (
          <div className="border border-[#E8E8E6] rounded-xl bg-white p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F4F4F3] flex items-center justify-center mx-auto mb-4">
              <Send className="h-6 w-6 text-[#8C8C8C]" />
            </div>
            <h3 className="text-sm font-semibold text-black mb-1">No requests yet</h3>
            <p className="text-sm text-[#525252] mb-4 max-w-xs mx-auto">
              Send a data request to a supplier and they'll fill in a simple form — no account needed.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-black px-3 text-sm font-medium text-white hover:bg-[#1C1C1E] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create your first request
            </button>
          </div>
        ) : requests.length > 0 ? (
          <div className="border border-[#E8E8E6] rounded-xl bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E6]">
                  <th className="text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Supplier</th>
                  <th className="hidden sm:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Passport</th>
                  <th className="text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Status</th>
                  <th className="hidden md:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Last activity</th>
                  <th className="text-right text-xs font-medium text-[#8C8C8C] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E6]">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-[#F9F9F8] transition-colors group">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-black">
                          {req.supplier_name || <span className="text-[#8C8C8C] font-normal italic">Unnamed supplier</span>}
                        </p>
                        {req.supplier_email && (
                          <p className="text-xs text-[#8C8C8C]">{req.supplier_email}</p>
                        )}
                        <span className="font-mono text-[10px] text-[#BDBDBB]">{req.request_code}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      {req.passports ? (
                        <Link
                          href={`/passports/${req.passport_id}`}
                          className="text-sm text-black hover:underline"
                        >
                          {req.passports.product_name || "Untitled"}
                        </Link>
                      ) : (
                        <span className="text-sm text-[#BDBDBB]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <span className="text-xs text-[#8C8C8C]">{formatRelativeDate(req.updated_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {req.status !== "draft" && (
                          <CopyLinkButton code={req.request_code} />
                        )}
                        {req.status !== "draft" && (
                          <a
                            href={`${appUrl}/request/${req.request_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-[#F4F4F3] text-[#525252] hover:text-black transition-colors"
                            title="Preview form"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {req.status === "completed" && req.passport_id && (
                          <button
                            onClick={() => handleImport(req)}
                            disabled={importing === req.id}
                            className="flex items-center gap-1 text-[11px] font-medium text-[#0e6dea] hover:opacity-80 transition-opacity disabled:opacity-40"
                            title="Import to passport"
                          >
                            {importing === req.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <CheckCircle className="h-3.5 w-3.5" />
                            }
                            Import
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
