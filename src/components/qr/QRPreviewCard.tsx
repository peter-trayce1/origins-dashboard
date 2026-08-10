"use client";

import { QRCodeDisplay } from "./QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRPreviewCardProps {
  qrId: string;
  url: string;
  productName: string;
  brandName?: string;
}

export function QRPreviewCard({ qrId, url, productName, brandName }: QRPreviewCardProps) {
  function download(format: "png" | "svg") {
    const a = document.createElement("a");
    const size = format === "png" ? "&size=1000" : "";
    a.href = `/api/qr/${qrId}/download?format=${format}${size}`;
    a.download = `${productName.toLowerCase().replace(/\s+/g, "-")}-qr.${format}`;
    a.click();
  }

  return (
    <div className="border border-[#E8E8E6] rounded-xl overflow-hidden bg-white">
      {/* Swing tag preview */}
      <div className="bg-[#F9F9F8] p-8 flex flex-col items-center gap-3 border-b border-[#E8E8E6]">
        {brandName && (
          <p className="text-xs font-semibold tracking-widest uppercase text-[#525252]">{brandName}</p>
        )}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-[#E8E8E6]">
          <QRCodeDisplay url={url} size={160} />
        </div>
        <div className="text-center">
          <p className="text-xs text-[#525252]">Scan to view product passport</p>
          <p className="text-[10px] text-[#8C8C8C] mt-0.5">knownobjects.io</p>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <p className="text-sm font-medium text-black">{productName}</p>
        <p className="text-xs text-[#8C8C8C] font-mono truncate">{url}</p>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => download("png")} className="flex-1">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            PNG (print)
          </Button>
          <Button variant="outline" size="sm" onClick={() => download("svg")} className="flex-1">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            SVG
          </Button>
        </div>
      </div>
    </div>
  );
}
