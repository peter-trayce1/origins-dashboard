"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, XCircle, PauseCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id:                       string;
  brand_name:               string;
  website:                  string | null;
  country:                  string | null;
  status:                   "pending" | "approved" | "suspended";
  expected_passport_volume: string | null;
  plan_interest:            string | null;
  job_title:                string | null;
  applied_at:               string;
  trial_start_date:         string | null;
  trial_end_date:           string | null;
  applicant_name:           string;
  applicant_email:          string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  approved:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
};

const VOLUME_LABELS: Record<string, string> = {
  "up-to-250": "Up to 250",
  "250-750":   "250–750",
  "750-plus":  "750+",
  "not-sure":  "Not sure",
};

const PLAN_LABELS: Record<string, string> = {
  essentials: "Essentials",
  growth:     "Growth",
  enterprise: "Enterprise",
  guidance:   "Needs guidance",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminApplicationsPage() {
  const [apps, setApps]         = useState<Application[]>([]);
  const [loading, setLoading]   = useState(true);
  const [working, setWorking]   = useState<string | null>(null);
  const [filter, setFilter]     = useState<"all" | "pending" | "approved" | "suspended">("pending");

  async function loadApps() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications");
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to load applications");
        return;
      }
      setApps(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadApps(); }, []);

  async function act(id: string, action: "approve" | "reject" | "suspend") {
    setWorking(id + action);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Action failed");
        return;
      }
      toast.success(
        action === "approve" ? "Workspace approved — trial activated" :
        action === "reject"  ? "Application rejected" :
        "Workspace suspended"
      );
      await loadApps();
    } finally {
      setWorking(null);
    }
  }

  const filtered = apps.filter((a) => filter === "all" || a.status === filter);
  const counts   = { pending: apps.filter((a) => a.status === "pending").length, approved: apps.filter((a) => a.status === "approved").length, suspended: apps.filter((a) => a.status === "suspended").length };

  return (
    <div className="min-h-screen bg-[#F9F9F8]">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <Image src="/logo-dark.png" alt="Known Objects" width={100} height={22} style={{ height: 22, width: "auto" }} />
            <div className="h-5 w-px bg-[#E8E8E6]" />
            <h1 className="text-[16px] font-semibold text-black">Workspace Applications</h1>
          </div>
          <button
            onClick={loadApps}
            disabled={loading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E8E8E6] text-[12px] text-[#525252] hover:bg-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[#F0F0EE] rounded-xl p-1 w-fit">
          {(["pending", "approved", "suspended", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`h-8 px-4 rounded-lg text-[12px] font-medium transition-colors capitalize flex items-center gap-1.5 ${
                filter === tab ? "bg-white text-black shadow-sm" : "text-[#525252] hover:text-black"
              }`}
            >
              {tab}
              {tab !== "all" && counts[tab] > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                  tab === "pending" ? "bg-amber-100 text-amber-700" :
                  tab === "approved" ? "bg-emerald-100 text-emerald-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-5 w-5 animate-spin text-[#BDBDBB]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-[14px] text-[#8C8C8C]">
            No {filter !== "all" ? filter : ""} applications
          </div>
        ) : (
          <div className="border border-[#E8E8E6] rounded-2xl bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8E6]">
                  {["Brand", "Applicant", "Volume", "Plan interest", "Applied", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-wide px-5 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F3]">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FAFAF9] transition-colors">

                    {/* Brand */}
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-semibold text-black">{app.brand_name}</p>
                      {app.website && (
                        <a
                          href={app.website.startsWith("http") ? app.website : `https://${app.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-[#0e6dea] hover:opacity-80 mt-0.5"
                        >
                          {app.website.replace(/^https?:\/\//, "")}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {app.country && (
                        <p className="text-[11px] text-[#8C8C8C] mt-0.5">{app.country}</p>
                      )}
                    </td>

                    {/* Applicant */}
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-black">{app.applicant_name}</p>
                      <p className="text-[11px] text-[#8C8C8C]">{app.applicant_email}</p>
                      {app.job_title && (
                        <p className="text-[11px] text-[#BDBDBB]">{app.job_title}</p>
                      )}
                    </td>

                    {/* Volume */}
                    <td className="px-5 py-4">
                      <span className="text-[12px] text-[#525252]">
                        {VOLUME_LABELS[app.expected_passport_volume ?? ""] ?? app.expected_passport_volume ?? "—"}
                      </span>
                    </td>

                    {/* Plan interest */}
                    <td className="px-5 py-4">
                      <span className="text-[12px] text-[#525252]">
                        {PLAN_LABELS[app.plan_interest ?? ""] ?? app.plan_interest ?? "—"}
                      </span>
                    </td>

                    {/* Applied */}
                    <td className="px-5 py-4">
                      <span className="text-[12px] text-[#8C8C8C]">{formatDate(app.applied_at)}</span>
                      {app.trial_end_date && (
                        <p className="text-[11px] text-emerald-600 mt-0.5">
                          Trial ends {formatDate(app.trial_end_date)}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[app.status]}`}>
                        {app.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {app.status === "pending" && (
                          <>
                            <button
                              onClick={() => act(app.id, "approve")}
                              disabled={!!working}
                              title="Approve"
                              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-50"
                            >
                              {working === app.id + "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Approve
                            </button>
                            <button
                              onClick={() => act(app.id, "reject")}
                              disabled={!!working}
                              title="Reject"
                              className="h-8 px-3 rounded-lg border border-[#E8E8E6] text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {working === app.id + "reject" ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5 inline mr-1" />}
                              Reject
                            </button>
                          </>
                        )}
                        {app.status === "approved" && (
                          <button
                            onClick={() => act(app.id, "suspend")}
                            disabled={!!working}
                            title="Suspend"
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E8E8E6] text-[12px] font-medium text-[#525252] hover:bg-[#F7F6F4] transition-colors disabled:opacity-50"
                          >
                            {working === app.id + "suspend" ? <Loader2 className="h-3 w-3 animate-spin" /> : <PauseCircle className="h-3.5 w-3.5" />}
                            Suspend
                          </button>
                        )}
                        {app.status === "suspended" && (
                          <button
                            onClick={() => act(app.id, "approve")}
                            disabled={!!working}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-black text-white text-[12px] font-medium hover:bg-[#1C1C1E] transition-colors disabled:opacity-50"
                          >
                            {working === app.id + "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
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
    </div>
  );
}
