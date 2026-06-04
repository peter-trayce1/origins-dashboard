"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Edit,
  QrCode,
  Trash2,
  Search,
  FileText,
  Plus,
  Clock,
  Globe,
  MoreHorizontal,
  CheckSquare,
  X,
  Loader2,
  Download,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CompletenessScore } from "@/components/shared/CompletenessScore";
import { EmptyState } from "@/components/shared/EmptyState";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";

interface Passport {
  id: string;
  product_name: string;
  sku: string | null;
  slug: string | null;
  status: "draft" | "published" | "archived";
  completeness_score: number;
  primary_image_url: string | null;
  collection_name: string | null;
  passport_code: string | null;
  category: string | null;
  updated_at: string;
  published_at: string | null;
  qr_codes: { id: string; scan_count: number }[];
}

interface PassportListProps {
  initialPassports: Passport[];
  brandId: string;
}

export function PassportList({ initialPassports, brandId }: PassportListProps) {
  const router = useRouter();
  const [passports, setPassports] = useState(initialPassports);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [openQRId, setOpenQRId] = useState<string | null>(null);
  const [qrCache, setQRCache] = useState<Record<string, { id: string; target_url: string } | null>>({});
  const [loadingQRId, setLoadingQRId] = useState<string | null>(null);

  const filtered = passports.filter((p) => {
    const matchSearch =
      !search ||
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.collection_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/passports/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPassports((prev) => prev.filter((p) => p.id !== id));
      toast.success("Passport deleted");
    } else {
      toast.error("Failed to delete passport");
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  async function handleBulkPublish(action: "publish" | "unpublish") {
    const ids = [...selected];
    setIsBulkWorking(true);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/passports/${id}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }).then((r) => (r.ok ? r.json() : Promise.reject()))
      )
    );
    setIsBulkWorking(false);
    const succeededIds = ids.filter((_, i) => results[i].status === "fulfilled");
    const newStatus = action === "publish" ? "published" : "draft";
    setPassports((prev) =>
      prev.map((p) => (succeededIds.includes(p.id) ? { ...p, status: newStatus } : p))
    );
    setSelected(new Set());
    const failCount = results.filter((r) => r.status === "rejected").length;
    if (failCount > 0) {
      toast.error(`${failCount} passport${failCount !== 1 ? "s" : ""} could not be updated`);
    } else {
      toast.success(
        `${succeededIds.length} passport${succeededIds.length !== 1 ? "s" : ""} ${action === "publish" ? "published" : "unpublished"}`
      );
    }
  }

  async function handleBulkDelete() {
    const ids = [...selected];
    if (!confirm(`Delete ${ids.length} passport${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    setIsBulkWorking(true);
    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/passports/${id}`, { method: "DELETE" }).then((r) => (r.ok ? r : Promise.reject())))
    );
    setIsBulkWorking(false);
    const succeededIds = ids.filter((_, i) => results[i].status === "fulfilled");
    setPassports((prev) => prev.filter((p) => !succeededIds.includes(p.id)));
    setSelected(new Set());
    const failCount = results.filter((r) => r.status === "rejected").length;
    if (failCount > 0) {
      toast.error(`${failCount} passport${failCount !== 1 ? "s" : ""} could not be deleted`);
    } else {
      toast.success(`${succeededIds.length} passport${succeededIds.length !== 1 ? "s" : ""} deleted`);
    }
  }

  async function handlePublish(id: string, action: "publish" | "unpublish" | "archive") {
    const res = await fetch(`/api/passports/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      const updated = await res.json();
      setPassports((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p))
      );
      toast.success(
        action === "publish"
          ? "Passport published"
          : action === "archive"
          ? "Passport archived"
          : "Passport moved to draft"
      );
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Action failed");
    }
  }

  async function handleQRClick(passportId: string) {
    if (openQRId === passportId) {
      setOpenQRId(null);
      return;
    }
    setOpenQRId(passportId);
    if (qrCache[passportId] !== undefined) return;
    setLoadingQRId(passportId);
    try {
      const r = await fetch(`/api/qr?passportId=${passportId}`);
      const list: { id: string; target_url: string }[] = await r.json();
      if (list.length > 0) {
        setQRCache((prev) => ({ ...prev, [passportId]: list[0] }));
      } else {
        const res = await fetch("/api/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passportId, label: "Default" }),
        });
        const created = res.ok ? await res.json() : null;
        setQRCache((prev) => ({ ...prev, [passportId]: created }));
      }
    } catch {
      setQRCache((prev) => ({ ...prev, [passportId]: null }));
    } finally {
      setLoadingQRId(null);
    }
  }

  function downloadQRFile(qrId: string, format: "png" | "svg") {
    const url = `/api/qr/${qrId}/download?format=${format}${format === "png" ? "&size=1000" : ""}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-code.${format}`;
    a.click();
  }

  function downloadManufacturerPack(passportId: string) {
    const a = document.createElement("a");
    a.href = `/api/passports/${passportId}/manufacturer-pack`;
    a.download = "";
    a.click();
  }

  if (passports.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No passports yet"
        description="Create your first Digital Product Passport to get started."
        action={
          <Link
            href="/passports/new"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-transparent bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Create passport
          </Link>
        }
      />
    );
  }

  const isSelecting = selected.size > 0;
  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0 && selected.size < filtered.length;

  return (
    <div className="space-y-4">
      {/* Filters / Bulk action bar */}
      {isSelecting ? (
        <div className="flex items-center gap-3 h-10 px-4 bg-[#111] rounded-xl text-white">
          {isBulkWorking ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : (
            <CheckSquare className="h-4 w-4 shrink-0" />
          )}
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 ml-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkPublish("publish")}
              disabled={isBulkWorking}
              className="h-7 text-xs bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkPublish("unpublish")}
              disabled={isBulkWorking}
              className="h-7 text-xs bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              <EyeOff className="h-3.5 w-3.5 mr-1.5" />
              Unpublish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={isBulkWorking}
              className="h-7 text-xs bg-transparent border-red-400/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto p-1 rounded text-white/60 hover:text-white transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C8C8C]" />
            <Input
              placeholder="Search passports…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-[#8C8C8C] ml-auto">
            {filtered.length} passport{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border border-[#E8E8E6] rounded-xl bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#525252]">
            No passports match your filters
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E8E6]">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded w-4 h-4 accent-black cursor-pointer"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Product</th>
                <th className="hidden sm:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Passport ID</th>
                <th className="text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Status</th>
                <th className="hidden md:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Complete</th>
                <th className="hidden lg:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Scans</th>
                <th className="hidden lg:table-cell text-left text-xs font-medium text-[#8C8C8C] px-4 py-3">Updated</th>
                <th className="text-right text-xs font-medium text-[#8C8C8C] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E6]">
              {filtered.map((passport) => {
                const totalScans = passport.qr_codes.reduce(
                  (sum, q) => sum + q.scan_count,
                  0
                );
                const qrOpen = openQRId === passport.id;
                const qr = qrCache[passport.id];
                const qrLoading = loadingQRId === passport.id;
                return (
                  <React.Fragment key={passport.id}>
                  <tr
                    className={`hover:bg-[#F9F9F8] transition-colors group ${selected.has(passport.id) ? "bg-[#F4F4F3]" : ""}`}
                  >
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded w-4 h-4 accent-black cursor-pointer"
                        checked={selected.has(passport.id)}
                        onChange={() => toggleSelect(passport.id)}
                        aria-label={`Select ${passport.product_name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F4F4F3] overflow-hidden shrink-0 flex items-center justify-center">
                          {passport.primary_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={passport.primary_image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="h-4 w-4 text-[#8C8C8C]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <a
                            href={`/passports/${passport.id}`}
                            className="text-sm font-medium text-black truncate max-w-[200px] hover:underline block"
                          >
                            {passport.product_name || "Untitled passport"}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      {passport.passport_code ? (
                        <span className="font-mono text-xs text-[#525252] bg-[#F4F4F2] border border-[#E8E8E6] px-1.5 py-0.5 rounded">
                          {passport.passport_code}
                        </span>
                      ) : (
                        <span className="text-sm text-[#BDBDBB]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={passport.status} />
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <CompletenessScore score={passport.completeness_score} size="sm" />
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <span className="text-sm text-[#525252] tabular-nums">{totalScans}</span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <span className="text-xs text-[#8C8C8C] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeDate(passport.updated_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {passport.status === "published" && passport.slug && (
                          <a
                            href={`/p/${passport.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-[#F4F4F3] text-[#525252] hover:text-black transition-colors"
                            title="View public passport"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleQRClick(passport.id)}
                          className={`p-1.5 rounded-lg hover:bg-[#F4F4F3] transition-colors ${qrOpen ? "bg-[#F4F4F3] text-black" : "text-[#525252] hover:text-black"}`}
                          title="QR code"
                        >
                          <QrCode className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/passports/${passport.id}`}
                          className="p-1.5 rounded-lg hover:bg-[#F4F4F3] text-[#525252] hover:text-black transition-colors"
                          title="Edit passport"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-[#F4F4F3] text-[#525252] hover:text-black transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {passport.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() => handlePublish(passport.id, "publish")}
                                className="text-green-700"
                              >
                                <Globe className="mr-2 h-4 w-4" />
                                Publish passport
                              </DropdownMenuItem>
                            )}
                            {passport.status === "published" && (
                              <DropdownMenuItem
                                onClick={() => handlePublish(passport.id, "unpublish")}
                              >
                                <EyeOff className="mr-2 h-4 w-4" />
                                Unpublish passport
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handlePublish(passport.id, "archive")}
                            >
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(passport.id, passport.product_name)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                  {qrOpen && (
                    <tr key={`${passport.id}-qr`} className="bg-[#F9F9F8]">
                      <td colSpan={8} className="px-6 pb-4 pt-0">
                        <div className="border border-[#E8E8E6] rounded-xl bg-white p-4 flex items-center gap-5">
                          {qrLoading ? (
                            <div className="flex items-center justify-center w-[104px] h-[104px]">
                              <Loader2 className="h-5 w-5 text-[#BDBDBB] animate-spin" />
                            </div>
                          ) : qr ? (
                            <>
                              <div className="border border-[#E8E8E6] rounded-xl p-1.5 bg-white shrink-0">
                                <QRCodeDisplay url={qr.target_url} size={100} />
                              </div>
                              <div className="flex flex-col gap-2.5 min-w-0">
                                <p className="font-mono text-[10px] text-[#8C8C8C] truncate max-w-[280px]">
                                  {qr.target_url.replace(/^https?:\/\//, "")}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => downloadQRFile(qr.id, "png")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E8E6] bg-white hover:bg-[#F7F6F4] transition-colors text-[11px] font-medium text-black"
                                  >
                                    <Download className="h-3 w-3" strokeWidth={2} />
                                    PNG
                                  </button>
                                  <button
                                    onClick={() => downloadQRFile(qr.id, "svg")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E8E6] bg-white hover:bg-[#F7F6F4] transition-colors text-[11px] font-medium text-black"
                                  >
                                    <Download className="h-3 w-3" strokeWidth={2} />
                                    SVG
                                  </button>
                                  <button
                                    onClick={() => downloadManufacturerPack(passport.id as string)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E8E6] bg-[#111] hover:bg-[#333] transition-colors text-[11px] font-medium text-white"
                                  >
                                    <Package className="h-3 w-3" strokeWidth={2} />
                                    Manufacturer Pack
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <p className="text-[12px] text-[#8C8C8C]">QR code unavailable</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
