"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { QRCard } from "@/components/qr/QRCard";
import { QRPreviewCard } from "@/components/qr/QRPreviewCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Plus, QrCode, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface QRCode {
  id: string;
  label: string;
  target_url: string;
  scan_count: number;
  created_at: string;
  is_active: boolean;
}

interface Passport {
  id: string;
  product_name: string;
  slug: string | null;
  status: string;
  brands: { name: string } | null;
}

export default function PassportQRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: passportId } = use(params);
  const router = useRouter();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    async function load() {
      const [passportRes, qrRes] = await Promise.all([
        fetch(`/api/passports/${passportId}`),
        fetch(`/api/qr?passportId=${passportId}`),
      ]);

      if (passportRes.ok) setPassport(await passportRes.json());
      if (qrRes.ok) setQrCodes(await qrRes.json());
      setIsLoading(false);
    }
    load();
  }, [passportId]);

  async function createQR() {
    if (!newLabel.trim()) return;
    setIsCreating(true);
    const res = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passportId, label: newLabel }),
    });

    if (res.ok) {
      const qr = await res.json();
      setQrCodes((prev) => [qr, ...prev]);
      setNewLabel("");
      setShowCreate(false);
      toast.success("QR code created");
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Failed to create QR code");
    }
    setIsCreating(false);
  }

  function removeQR(id: string) {
    setQrCodes((prev) => prev.filter((q) => q.id !== id));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#8C8C8C]" />
      </div>
    );
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = passport?.slug ? `${appUrl}/p/${passport.slug}` : null;
  const isPublished = passport?.status === "published";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/passports/${passportId}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#525252] hover:text-black mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to passport
        </Link>
        <PageHeader
          title="QR codes"
          description={passport?.product_name ? `Manage QR codes for ${passport.product_name}` : "Manage QR codes for this passport"}
          actions={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New QR code
            </Button>
          }
        />
      </div>

      {!isPublished && (
        <div className="border border-[#E8E8E6] bg-[#F9F9F8] rounded-xl p-4 text-sm text-[#525252]">
          This passport is a draft. You can create and download QR codes now, but they won&apos;t show content until the passport is published.
        </div>
      )}

      {showCreate && (
        <div className="border border-[#E8E8E6] rounded-xl p-5 space-y-4 bg-[#F9F9F8]">
          <p className="text-sm font-semibold text-black">Create new QR code</p>
          <div className="space-y-1.5 max-w-sm">
            <Label>Label <span className="text-[#8C8C8C] font-normal text-xs">e.g. "Swing tag", "Packaging", "Website"</span></Label>
            <Input
              placeholder="Swing tag"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createQR()}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={createQR} disabled={isCreating || !newLabel.trim()}>
              {isCreating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Create QR code
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {qrCodes.length === 0 ? (
        <EmptyState
          icon={<QrCode className="h-8 w-8" />}
          title="No QR codes yet"
          description="Generate a QR code to place on swing tags, packaging, or marketing materials. Each QR links to the live public passport page."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create first QR code
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <p className="text-sm font-semibold text-black">{qrCodes.length} QR code{qrCodes.length !== 1 ? "s" : ""}</p>
            {qrCodes.map((qr) => (
              <QRCard key={qr.id} qr={qr} onDelete={removeQR} />
            ))}
          </div>

          {publicUrl && qrCodes[0] && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-black">Preview</p>
              <QRPreviewCard
                qrId={qrCodes[0].id}
                url={publicUrl}
                productName={passport?.product_name ?? "Product"}
                brandName={passport?.brands?.name}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
