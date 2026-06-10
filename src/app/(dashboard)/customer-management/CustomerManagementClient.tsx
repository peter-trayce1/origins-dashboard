"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2, Users, FileText, QrCode, TrendingUp, Clock,
  CheckCircle2, XCircle, PauseCircle, RefreshCw, Loader2,
  ChevronRight, ExternalLink, Search, Shield, Trash2, AlertTriangle,
  Mail, Phone,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  totalOrgs: number; pendingOrgs: number; approvedOrgs: number; trialOrgs: number;
  essentialsOrgs: number; growthOrgs: number; enterpriseOrgs: number;
  totalPassports: number; publishedPassports: number; totalQRCodes: number;
  passportUsageMonth: number; passportUsageYear: number;
  mrr: number; arr: number;
}

interface Account {
  id: string; name: string; slug: string; organisation_status: string;
  billing_plan: string; billing_interval: string | null; billing_status: string;
  stripe_customer_id: string | null; passport_limit: number;
  created_at: string; owner_email: string;
  user_count: number; total_passports: number; published_passports: number;
}

interface AppRow {
  id: string; brand_name: string; website: string | null; country: string | null;
  status: "pending" | "approved" | "suspended";
  expected_passport_volume: string | null; plan_interest: string | null;
  job_title: string | null; applied_at: string; trial_end_date: string | null;
  applicant_name: string; applicant_email: string;
}

interface UserRow {
  id: string; email: string; full_name: string; role: string;
  org_name: string; org_role: string; created_at: string; last_sign_in: string | null;
}

interface DemoRow {
  id: string; full_name: string | null; email: string; company: string | null;
  job_title: string | null; phone: string | null; website: string | null;
  message: string | null; source: string | null;
  status: "new" | "contacted" | "scheduled" | "closed"; created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtGbp(n: number) {
  return `£${n.toLocaleString()}`;
}

function planBadge(plan: string, status?: string) {
  const base = "inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border";
  if (plan === "trial" || status === "trialing") return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  if (plan === "essentials") return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  if (plan === "growth")     return `${base} bg-violet-50 text-violet-700 border-violet-200`;
  if (plan === "enterprise") return `${base} bg-black text-white border-black`;
  return `${base} bg-[#F4F4F3] text-[#525252] border-[#E8E8E6]`;
}

function statusBadge(status: string) {
  const base = "inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize";
  if (status === "active")    return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
  if (status === "approved")  return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
  if (status === "pending")   return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  if (status === "past_due")  return `${base} bg-orange-50 text-orange-700 border-orange-200`;
  if (status === "suspended") return `${base} bg-red-50 text-red-700 border-red-200`;
  if (status === "cancelled") return `${base} bg-[#F4F4F3] text-[#525252] border-[#E8E8E6]`;
  return `${base} bg-[#F4F4F3] text-[#525252] border-[#E8E8E6]`;
}

const PLAN_LABELS: Record<string, string> = {
  none: "None", trial: "Trial", essentials: "Essentials",
  growth: "Growth", enterprise: "Enterprise", guidance: "Needs guidance",
};
const VOL_LABELS: Record<string, string> = {
  "up-to-250": "Up to 250", "250-750": "250–750", "750-plus": "750+", "not-sure": "Not sure",
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div className="bg-white border border-[#E8E8E6] rounded-2xl p-5 flex gap-4 items-start">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent ?? "bg-[#F4F4F3]"}`}>
        <Icon className="h-4 w-4 text-[#525252]" />
      </div>
      <div>
        <p className="text-[22px] font-bold text-black leading-none">{value}</p>
        <p className="text-[12px] text-[#525252] mt-1">{label}</p>
        {sub && <p className="text-[11px] text-[#8C8C8C] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-lg text-[13px] font-medium transition-colors ${
        active ? "bg-white text-black shadow-sm border border-[#E8E8E6]" : "text-[#525252] hover:text-black"
      }`}
    >
      {children}
    </button>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading) return <Spinner />;
  if (!stats) return <Empty text="Could not load stats" />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-3">Organisations</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total organisations"  value={stats.totalOrgs}      icon={Building2} />
          <KpiCard label="Pending applications" value={stats.pendingOrgs}    icon={Clock}   accent="bg-amber-50" />
          <KpiCard label="Approved accounts"    value={stats.approvedOrgs}   icon={CheckCircle2} accent="bg-emerald-50" />
          <KpiCard label="Trial accounts"       value={stats.trialOrgs}      icon={TrendingUp} />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-3">Subscriptions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KpiCard label="Essentials subscribers" value={stats.essentialsOrgs} icon={Building2} accent="bg-blue-50" />
          <KpiCard label="Growth subscribers"     value={stats.growthOrgs}     icon={Building2} accent="bg-violet-50" />
          <KpiCard label="Enterprise accounts"    value={stats.enterpriseOrgs} icon={Building2} accent="bg-[#F4F4F3]" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-3">Revenue</p>
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="Est. monthly recurring revenue" value={fmtGbp(stats.mrr)} icon={TrendingUp} accent="bg-emerald-50" sub="Based on active subscriptions in DB" />
          <KpiCard label="Est. annual recurring revenue"  value={fmtGbp(stats.arr)} icon={TrendingUp} accent="bg-emerald-50" sub="Based on active subscriptions in DB" />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-3">Passports & QR</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total passports"      value={stats.totalPassports}     icon={FileText} />
          <KpiCard label="Published passports"  value={stats.publishedPassports}  icon={FileText} accent="bg-emerald-50" />
          <KpiCard label="Total QR codes"       value={stats.totalQRCodes}        icon={QrCode} />
          <KpiCard label="Passports this month" value={stats.passportUsageMonth}  icon={TrendingUp} />
        </div>
      </div>
    </div>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────────

function ApplicationsTab() {
  const [apps, setApps]   = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [filter, setFilter]   = useState<"pending" | "approved" | "suspended" | "all">("pending");
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications");
      if (!res.ok) { toast.error("Failed to load applications"); return; }
      setApps(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "approve" | "reject" | "suspend") {
    setWorking(id + action);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Action failed"); return; }
      toast.success(action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Suspended");
      await load();
    } finally { setWorking(null); }
  }

  const filtered = apps
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => !search || [a.brand_name, a.applicant_email, a.applicant_name]
      .some((s) => s.toLowerCase().includes(search.toLowerCase())));

  const counts = {
    pending:   apps.filter((a) => a.status === "pending").length,
    approved:  apps.filter((a) => a.status === "approved").length,
    suspended: apps.filter((a) => a.status === "suspended").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-[#F0F0EE] rounded-xl p-1 gap-1">
          {(["pending", "approved", "suspended", "all"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors capitalize flex items-center gap-1.5 ${filter === t ? "bg-white text-black shadow-sm" : "text-[#525252] hover:text-black"}`}>
              {t}
              {t !== "all" && counts[t] > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${t === "pending" ? "bg-amber-100 text-amber-700" : t === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E8E8E6] rounded-xl px-3 h-9 flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-[#8C8C8C]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…" className="flex-1 text-[13px] outline-none bg-transparent" />
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 px-3 rounded-xl border border-[#E8E8E6] text-[12px] text-[#525252] hover:bg-white flex items-center gap-1.5 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? <Empty text="No applications match" /> : (
        <div className="border border-[#E8E8E6] rounded-2xl bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E8E8E6]">
                {["Brand", "Applicant", "Volume / Plan", "Applied", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F3]">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-black">{app.brand_name}</p>
                    {app.website && (
                      <a href={app.website.startsWith("http") ? app.website : `https://${app.website}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#0e6dea] hover:opacity-80 mt-0.5">
                        {app.website.replace(/^https?:\/\//, "")} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {app.country && <p className="text-[11px] text-[#8C8C8C] mt-0.5">{app.country}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] text-black">{app.applicant_name}</p>
                    <p className="text-[11px] text-[#8C8C8C]">{app.applicant_email}</p>
                    {app.job_title && <p className="text-[11px] text-[#BDBDBB]">{app.job_title}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[12px] text-[#525252]">{VOL_LABELS[app.expected_passport_volume ?? ""] ?? "—"}</p>
                    <p className="text-[11px] text-[#8C8C8C]">{PLAN_LABELS[app.plan_interest ?? ""] ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[12px] text-[#8C8C8C]">{fmt(app.applied_at)}</p>
                    {app.trial_end_date && <p className="text-[11px] text-emerald-600">Trial ends {fmt(app.trial_end_date)}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={statusBadge(app.status)}>{app.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {app.status === "pending" && (
                        <>
                          <button onClick={() => act(app.id, "approve")} disabled={!!working}
                            className="flex items-center gap-1 h-8 px-3 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-50">
                            {working === app.id + "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve
                          </button>
                          <button onClick={() => act(app.id, "reject")} disabled={!!working}
                            className="h-8 px-3 rounded-lg border border-[#E8E8E6] text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                            {working === app.id + "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                            Reject
                          </button>
                        </>
                      )}
                      {app.status === "approved" && (
                        <button onClick={() => act(app.id, "suspend")} disabled={!!working}
                          className="flex items-center gap-1 h-8 px-3 rounded-lg border border-[#E8E8E6] text-[12px] text-[#525252] hover:bg-[#F7F6F4] transition-colors disabled:opacity-50">
                          {working === app.id + "suspend" ? <Loader2 className="h-3 w-3 animate-spin" /> : <PauseCircle className="h-3.5 w-3.5" />}
                          Suspend
                        </button>
                      )}
                      {app.status === "suspended" && (
                        <button onClick={() => act(app.id, "approve")} disabled={!!working}
                          className="flex items-center gap-1 h-8 px-3 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-50">
                          {working === app.id + "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Re-approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Accounts Tab ──────────────────────────────────────────────────────────────

function AccountsTab() {
  const [accounts, setAccounts]     = useState<Account[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounts");
      if (!res.ok) { toast.error("Failed to load accounts"); return; }
      setAccounts(await res.json());
      setSelected(new Set());
      setConfirming(false);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const plans = ["all", "trial", "essentials", "growth", "enterprise", "none"];

  const filtered = accounts
    .filter((a) => planFilter === "all" || a.billing_plan === planFilter)
    .filter((a) => !search || [a.name, a.owner_email, a.slug]
      .some((s) => s?.toLowerCase().includes(search.toLowerCase())));

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Delete failed"); return; }
      toast.success(`Deleted ${data.deleted} account${data.deleted !== 1 ? "s" : ""}`);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const selectedNames = accounts
    .filter((a) => selected.has(a.id))
    .map((a) => a.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-[#F0F0EE] rounded-xl p-1 gap-1 flex-wrap">
          {plans.map((p) => (
            <button key={p} onClick={() => setPlanFilter(p)}
              className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors capitalize ${planFilter === p ? "bg-white text-black shadow-sm" : "text-[#525252] hover:text-black"}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E8E8E6] rounded-xl px-3 h-9 flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-[#8C8C8C]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisations…" className="flex-1 text-[13px] outline-none bg-transparent" />
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 px-3 rounded-xl border border-[#E8E8E6] text-[12px] text-[#525252] hover:bg-white flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>

        {someSelected && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="h-9 px-3 rounded-xl bg-red-50 border border-red-200 text-[12px] font-medium text-red-700 hover:bg-red-100 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selected.size} selected
          </button>
        )}
      </div>

      {/* Confirmation banner */}
      {confirming && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-red-800 mb-0.5">
              Permanently delete {selected.size} account{selected.size !== 1 ? "s" : ""}?
            </p>
            <p className="text-[12px] text-red-700 mb-1">
              This will delete <strong>{selectedNames.join(", ")}</strong> and all associated passports, QR codes, and user accounts. This cannot be undone.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="h-8 px-3 rounded-lg border border-red-200 text-[12px] font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-8 px-3 rounded-lg bg-red-600 text-white text-[12px] font-medium hover:bg-red-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : filtered.length === 0 ? <Empty text="No accounts match" /> : (
        <div className="border border-[#E8E8E6] rounded-2xl bg-white overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E8E8E6]">
                <th className="pl-5 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 rounded border-[#D0D0CE] accent-black cursor-pointer"
                  />
                </th>
                {["Organisation", "Owner", "Plan", "Status", "Users", "Passports", "Allowance", "Created"].map((h) => (
                  <th key={h} className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F3]">
              {filtered.map((acc) => (
                <tr key={acc.id}
                  className={`transition-colors ${selected.has(acc.id) ? "bg-red-50/40" : "hover:bg-[#FAFAF9]"}`}>
                  <td className="pl-5 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(acc.id)}
                      onChange={() => toggleOne(acc.id)}
                      className="h-3.5 w-3.5 rounded border-[#D0D0CE] accent-black cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-black">{acc.name}</p>
                    <p className="text-[11px] text-[#8C8C8C] font-mono">{acc.slug}</p>
                    {acc.stripe_customer_id && (
                      <p className="text-[10px] text-[#BDBDBB] font-mono mt-0.5">{acc.stripe_customer_id}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] text-[#525252]">{acc.owner_email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={planBadge(acc.billing_plan, acc.billing_status)}>
                      {PLAN_LABELS[acc.billing_plan] ?? acc.billing_plan}
                    </span>
                    {acc.billing_interval && (
                      <p className="text-[11px] text-[#8C8C8C] mt-0.5 capitalize">{acc.billing_interval}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={statusBadge(acc.billing_status)}>{acc.billing_status}</span>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#525252]">{acc.user_count}</td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] text-[#525252]">{acc.published_passports} <span className="text-[#BDBDBB]">/ {acc.total_passports}</span></p>
                    <p className="text-[11px] text-[#8C8C8C]">published / total</p>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#525252]">
                    {acc.passport_limit > 0 ? acc.passport_limit.toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-4 text-[12px] text-[#8C8C8C]">{fmt(acc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [promoting, setPromoting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) { toast.error("Failed to load users"); return; }
      setUsers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setRole(userId: string, role: string) {
    setPromoting(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      toast.success("Role updated");
      await load();
    } finally { setPromoting(null); }
  }

  const filtered = users.filter((u) =>
    !search || [u.email, u.full_name, u.org_name]
      .some((s) => s?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-[#E8E8E6] rounded-xl px-3 h-9 flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-[#8C8C8C]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…" className="flex-1 text-[13px] outline-none bg-transparent" />
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 px-3 rounded-xl border border-[#E8E8E6] text-[12px] text-[#525252] hover:bg-white flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
        <span className="text-[12px] text-[#8C8C8C]">{filtered.length} users</span>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? <Empty text="No users match" /> : (
        <div className="border border-[#E8E8E6] rounded-2xl bg-white overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-[#E8E8E6]">
                {["User", "Organisation", "Platform Role", "Created", "Last sign in", "Actions"].map((h) => (
                  <th key={h} className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F3]">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-black">{u.full_name !== "—" ? u.full_name : u.email}</p>
                    <p className="text-[11px] text-[#8C8C8C]">{u.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] text-[#525252]">{u.org_name}</p>
                    {u.org_role !== "—" && <p className="text-[11px] text-[#8C8C8C] capitalize">{u.org_role}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      u.role === "super_admin" ? "bg-black text-white border-black" :
                      u.role === "platform_admin" ? "bg-violet-50 text-violet-700 border-violet-200" :
                      "bg-[#F4F4F3] text-[#525252] border-[#E8E8E6]"
                    }`}>
                      {u.role === "super_admin" && <Shield className="h-2.5 w-2.5" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[12px] text-[#8C8C8C]">{fmt(u.created_at)}</td>
                  <td className="px-5 py-4 text-[12px] text-[#8C8C8C]">{fmt(u.last_sign_in)}</td>
                  <td className="px-5 py-4">
                    {u.role !== "super_admin" && (
                      <select
                        value={u.role}
                        disabled={promoting === u.id}
                        onChange={(e) => setRole(u.id, e.target.value)}
                        className="h-8 px-2 rounded-lg border border-[#E8E8E6] text-[12px] bg-white text-[#525252] disabled:opacity-50"
                      >
                        <option value="user">user</option>
                        <option value="platform_admin">platform_admin</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    )}
                    {u.role === "super_admin" && (
                      <span className="text-[11px] text-[#8C8C8C]">Super admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Revenue Tab ───────────────────────────────────────────────────────────────

function RevenueTab({ stats }: { stats: Stats | null }) {
  if (!stats) return <Spinner />;

  const rows = [
    { label: "Essentials (monthly)", count: stats.essentialsOrgs, mrr: 375, arr: 4500 },
    { label: "Growth (monthly)",     count: stats.growthOrgs,     mrr: 795, arr: 9540 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E8E8E6] rounded-2xl p-6">
          <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-1">Monthly Recurring Revenue</p>
          <p className="text-[32px] font-bold text-black">{fmtGbp(stats.mrr)}</p>
          <p className="text-[12px] text-[#8C8C8C] mt-1">Based on active subscriptions in DB</p>
        </div>
        <div className="bg-white border border-[#E8E8E6] rounded-2xl p-6">
          <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest mb-1">Annual Recurring Revenue</p>
          <p className="text-[32px] font-bold text-black">{fmtGbp(stats.arr)}</p>
          <p className="text-[12px] text-[#8C8C8C] mt-1">Based on active subscriptions in DB</p>
        </div>
      </div>

      <div className="bg-white border border-[#E8E8E6] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0F0EE]">
          <p className="text-[13px] font-semibold text-black">Revenue by plan</p>
          <p className="text-[11px] text-[#8C8C8C] mt-0.5">
            {/* TODO: connect to live Stripe data via webhook sync for accurate figures */}
            Estimated from local subscription data. Connect Stripe webhook for real-time accuracy.
          </p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F0F0EE]">
              {["Plan", "Active accounts", "Per account / mo", "Contribution to MRR"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wide px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F3]">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-5 py-4 text-[13px] font-medium text-black">{r.label}</td>
                <td className="px-5 py-4 text-[13px] text-[#525252]">{r.count}</td>
                <td className="px-5 py-4 text-[13px] text-[#525252]">{fmtGbp(r.mrr)}</td>
                <td className="px-5 py-4 text-[13px] text-[#525252]">{fmtGbp(r.count * r.mrr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Trial accounts"   value={stats.trialOrgs}      icon={Clock} />
        <KpiCard label="Essentials"       value={stats.essentialsOrgs} icon={ChevronRight} accent="bg-blue-50" />
        <KpiCard label="Growth"           value={stats.growthOrgs}     icon={ChevronRight} accent="bg-violet-50" />
        <KpiCard label="Enterprise"       value={stats.enterpriseOrgs} icon={ChevronRight} />
      </div>
    </div>
  );
}

// ── Usage Tab ─────────────────────────────────────────────────────────────────

function UsageTab({ stats }: { stats: Stats | null }) {
  if (!stats) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Total passports created"  value={stats.totalPassports}      icon={FileText} />
        <KpiCard label="Published passports"       value={stats.publishedPassports}  icon={FileText} accent="bg-emerald-50" />
        <KpiCard label="Total QR codes generated"  value={stats.totalQRCodes}        icon={QrCode} />
        <KpiCard label="Passports created this month" value={stats.passportUsageMonth} icon={TrendingUp} />
        <KpiCard label="Passports created this year"  value={stats.passportUsageYear}  icon={TrendingUp} />
      </div>

      <div className="bg-white border border-[#E8E8E6] rounded-2xl p-5">
        <p className="text-[13px] font-semibold text-black mb-1">Usage breakdown</p>
        <p className="text-[12px] text-[#8C8C8C]">
          {/* TODO: add passport creation by month chart, usage by plan, and orgs near their limit */}
          Per-organisation usage detail, monthly charts, and limit alerts will appear here once
          a time-series query is wired up.
        </p>
      </div>
    </div>
  );
}

// ── Demo Requests Tab ─────────────────────────────────────────────────────────

function demoStatusBadge(status: string) {
  const base = "inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize";
  if (status === "new")       return `${base} bg-blue-50 text-blue-700 border-blue-200`;
  if (status === "contacted") return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  if (status === "scheduled") return `${base} bg-violet-50 text-violet-700 border-violet-200`;
  if (status === "closed")    return `${base} bg-[#F4F4F3] text-[#525252] border-[#E8E8E6]`;
  return `${base} bg-[#F4F4F3] text-[#525252] border-[#E8E8E6]`;
}

function DemoRequestsTab() {
  const [rows, setRows] = useState<DemoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [filter, setFilter] = useState<"new" | "contacted" | "scheduled" | "closed" | "all">("new");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/demo-requests");
      if (!res.ok) { toast.error("Failed to load demo requests"); return; }
      setRows(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: DemoRow["status"]) {
    setWorking(id);
    // optimistic update
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    try {
      const res = await fetch("/api/admin/demo-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) { toast.error("Update failed"); await load(); return; }
    } finally { setWorking(null); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this demo request? This cannot be undone.")) return;
    setWorking(id);
    try {
      const res = await fetch("/api/admin/demo-requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { toast.error("Delete failed"); return; }
      toast.success("Deleted");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } finally { setWorking(null); }
  }

  const filtered = rows
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) => !search || [r.full_name, r.email, r.company, r.website]
      .some((s) => s?.toLowerCase().includes(search.toLowerCase())));

  const counts = {
    new:       rows.filter((r) => r.status === "new").length,
    contacted: rows.filter((r) => r.status === "contacted").length,
    scheduled: rows.filter((r) => r.status === "scheduled").length,
    closed:    rows.filter((r) => r.status === "closed").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-[#F0F0EE] rounded-xl p-1 gap-1 flex-wrap">
          {(["new", "contacted", "scheduled", "closed", "all"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors capitalize flex items-center gap-1.5 ${filter === t ? "bg-white text-black shadow-sm" : "text-[#525252] hover:text-black"}`}>
              {t}
              {t !== "all" && counts[t] > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none bg-blue-100 text-blue-700">
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E8E8E6] rounded-xl px-3 h-9 flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-[#8C8C8C]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company…" className="flex-1 text-[13px] outline-none bg-transparent" />
        </div>
        <button onClick={load} disabled={loading}
          className="h-9 px-3 rounded-xl border border-[#E8E8E6] text-[12px] text-[#525252] hover:bg-white flex items-center gap-1.5 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
        <span className="text-[12px] text-[#8C8C8C]">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? <Empty text="No demo requests match" /> : (
        <div className="border border-[#E8E8E6] rounded-2xl bg-white overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E8E8E6]">
                {["Contact", "Company", "Message", "Received", "Status", ""].map((h) => (
                  <th key={h} className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wide px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F3]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAFAF9] transition-colors align-top">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-semibold text-black">{r.full_name || "—"}</p>
                    <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-[11px] text-[#0e6dea] hover:opacity-80 mt-0.5">
                      <Mail className="h-2.5 w-2.5" /> {r.email}
                    </a>
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="flex items-center gap-1 text-[11px] text-[#8C8C8C] mt-0.5">
                        <Phone className="h-2.5 w-2.5" /> {r.phone}
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] text-black">{r.company || "—"}</p>
                    {r.job_title && <p className="text-[11px] text-[#8C8C8C]">{r.job_title}</p>}
                    {r.website && (
                      <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#0e6dea] hover:opacity-80 mt-0.5">
                        {r.website.replace(/^https?:\/\//, "")} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-4 max-w-[260px]">
                    {r.message ? (
                      <p className="text-[12px] text-[#525252] line-clamp-3">{r.message}</p>
                    ) : (
                      <span className="text-[12px] text-[#BDBDBB]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[12px] text-[#8C8C8C] whitespace-nowrap">{fmt(r.created_at)}</td>
                  <td className="px-5 py-4">
                    <select
                      value={r.status}
                      disabled={working === r.id}
                      onChange={(e) => setStatus(r.id, e.target.value as DemoRow["status"])}
                      className={`h-7 pl-2 pr-1 rounded-lg border text-[11px] font-medium cursor-pointer disabled:opacity-50 outline-none ${demoStatusBadge(r.status)}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => remove(r.id)} disabled={working === r.id}
                      className="p-1.5 rounded-lg text-[#8C8C8C] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-[#BDBDBB]" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-20 text-center text-[14px] text-[#8C8C8C]">{text}</p>;
}

// ── Main component ────────────────────────────────────────────────────────────

type TabKey = "overview" | "applications" | "demo" | "accounts" | "users" | "revenue" | "usage";

export function CustomerManagementClient() {
  const [tab, setTab]         = useState<TabKey>("overview");
  const [stats, setStats]     = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => toast.error("Could not load overview stats"))
      .finally(() => setStatsLoading(false));
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview",     label: "Overview" },
    { key: "applications", label: "Applications" },
    { key: "demo",         label: "Demo requests" },
    { key: "accounts",     label: "Accounts" },
    { key: "users",        label: "Users" },
    { key: "revenue",      label: "Revenue" },
    { key: "usage",        label: "Usage" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-[#8C8C8C]" />
            <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-widest">Super Admin</p>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-black">Customer Management</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#F0F0EE] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <Tab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </Tab>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview"     && <OverviewTab stats={stats} loading={statsLoading} />}
      {tab === "applications" && <ApplicationsTab />}
      {tab === "demo"         && <DemoRequestsTab />}
      {tab === "accounts"     && <AccountsTab />}
      {tab === "users"        && <UsersTab />}
      {tab === "revenue"      && <RevenueTab stats={stats} />}
      {tab === "usage"        && <UsageTab stats={stats} />}
    </div>
  );
}
