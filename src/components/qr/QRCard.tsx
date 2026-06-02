"use client";

import { useState } from "react";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QRCardProps {
  qr: {
    id: string;
    label: string;
    target_url: string;
    scan_count: number;
    created_at: string;
    is_active: boolean;
  };
  onDelete?: (id: string) => void;
}

export function QRCard({ qr, onDelete }: QRCardProps) {
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(qr.target_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("URL copied to clipboard");
  }

  function downloadPng() {
    const a = document.createElement("a");
    a.href = `/api/qr/${qr.id}/download?format=png&size=1000`;
    a.download = `${qr.label.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
    a.click();
  }

  function downloadSvg() {
    const a = document.createElement("a");
    a.href = `/api/qr/${qr.id}/download?format=svg`;
    a.download = `${qr.label.toLowerCase().replace(/\s+/g, "-")}-qr.svg`;
    a.click();
  }

  async function handleDelete() {
    if (!confirm("Delete this QR code? Any printed codes pointing to this URL will still work.")) return;
    const res = await fetch(`/api/qr/${qr.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("QR code deleted");
      onDelete?.(qr.id);
    } else {
      toast.error("Failed to delete QR code");
    }
  }

  return (
    <div className="border border-[#E8E8E6] rounded-xl p-5 bg-white flex gap-5">
      <div className="shrink-0 bg-white p-2 border border-[#E8E8E6] rounded-lg">
        <QRCodeDisplay url={qr.target_url} size={120} />
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-black">{qr.label}</p>
            <p className="text-xs text-[#8C8C8C] mt-0.5 font-mono truncate max-w-xs">{qr.target_url}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#8C8C8C] hover:bg-[#F4F4F3] hover:text-black transition-colors">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadPng}>Download PNG (print-ready)</DropdownMenuItem>
              <DropdownMenuItem onClick={downloadSvg}>Download SVG</DropdownMenuItem>
              <DropdownMenuItem onClick={copyUrl}>Copy URL</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#8C8C8C]">
          <span><strong className="text-black">{qr.scan_count}</strong> scans</span>
          <span>Created {new Date(qr.created_at).toLocaleDateString()}</span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${qr.is_active ? "bg-green-50 text-green-700" : "bg-[#F4F4F3] text-[#8C8C8C]"}`}>
            {qr.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadPng}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={downloadSvg}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            SVG
          </Button>
          <Button variant="ghost" size="sm" onClick={copyUrl}>
            {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copied ? "Copied!" : "Copy URL"}
          </Button>
        </div>
      </div>
    </div>
  );
}
