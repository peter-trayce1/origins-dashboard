"use client";

import { useRef, useState } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  FileText, Users, Play,
  Upload, X, Loader2, Sparkles, ImageIcon,
} from "lucide-react";

function SectionImageUpload({
  url,
  onUrl,
}: {
  url: string;
  onUrl: (url: string) => void;
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
      onUrl(data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (url) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-[#E8E8E6] bg-[#F9F9F8]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="block w-full h-auto" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <button
            type="button"
            onClick={() => onUrl("")}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 h-7 px-3 rounded-full bg-white/90 text-[11px] font-medium text-red-600 hover:bg-white shadow"
          >
            <X className="h-3 w-3" />Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file?.type.startsWith("image/")) {
            const dt = new DataTransfer();
            dt.items.add(file);
            if (fileRef.current) {
              fileRef.current.files = dt.files;
              fileRef.current.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }}
        className="w-full border border-dashed border-[#E8E8E6] rounded-xl py-4 flex items-center justify-center gap-2 text-[#8C8C8C] hover:border-black/25 hover:text-black transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        <span className="text-[12px] font-medium">{uploading ? "Uploading…" : "Add a photo"}</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </>
  );
}

export function Step7Story() {
  const { step7, setStep7 } = useWizardStore();

  return (
    <div className="space-y-1">
      <div className="pb-2">
        <h2 className="text-base font-semibold text-black">Story content</h2>
        <p className="text-sm text-[#525252] mt-0.5">
          Add the key story elements that will inspire your customers.
        </p>
      </div>

      {/* Block 1 — Product Story */}
      <div className="border border-[#E8E8E6] rounded-xl bg-white overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F0F0EE]">
          <div className="w-7 h-7 rounded-lg bg-[#F4F4F2] flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="h-3.5 w-3.5 text-[#525252]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-black">1. Our story</p>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">The story of this product — its origin, purpose and what makes it special.</p>
          </div>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <Textarea
              rows={5}
              placeholder="Tell the story of this product…"
              className="text-[13px] resize-none border-0 shadow-none p-0 focus-visible:ring-0"
              maxLength={800}
              value={step7.product_story}
              onChange={(e) => setStep7({ product_story: e.target.value })}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="flex items-center gap-1 text-[10px] text-[#8C8C8C]">
                <Sparkles className="h-2.5 w-2.5" />
                Pre-filled from your brand&apos;s &quot;Our Story&quot; — edit to make it specific to this product
              </span>
              <span className="text-[10px] text-[#C0C0BE]">{step7.product_story.length} / 600</span>
            </div>
          </div>
          <SectionImageUpload
            url={step7.product_story_image_url}
            onUrl={(url) => setStep7({ product_story_image_url: url })}
          />
        </div>
      </div>

      {/* Block 2 — The Makers */}
      <div className="border border-[#E8E8E6] rounded-xl bg-white overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F0F0EE]">
          <div className="w-7 h-7 rounded-lg bg-[#F4F4F2] flex items-center justify-center shrink-0 mt-0.5">
            <Users className="h-3.5 w-3.5 text-[#525252]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-black">2. The makers</p>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Share the people and communities behind this product.</p>
          </div>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <Textarea
              rows={5}
              placeholder="Tell the story of the makers and communities…"
              className="text-[13px] resize-none border-0 shadow-none p-0 focus-visible:ring-0"
              maxLength={800}
              value={step7.maker_story}
              onChange={(e) => setStep7({ maker_story: e.target.value })}
            />
            <p className="text-[10px] text-[#C0C0BE] text-right mt-1">{step7.maker_story.length} / 600</p>
          </div>
          <SectionImageUpload
            url={step7.makers_image_url}
            onUrl={(url) => setStep7({ makers_image_url: url })}
          />
        </div>
      </div>

      {/* Block 3 — Journey Video */}
      <div className="border border-[#E8E8E6] rounded-xl bg-white overflow-hidden">
        <div className="flex items-start gap-3 px-4 py-3.5 border-b border-[#F0F0EE]">
          <div className="w-7 h-7 rounded-lg bg-[#F4F4F2] flex items-center justify-center shrink-0 mt-0.5">
            <Play className="h-3.5 w-3.5 text-[#525252]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-black">3. Video <span className="text-[11px] font-normal text-[#8C8C8C]">(optional)</span></p>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Embed a video to take customers behind the scenes.</p>
          </div>
        </div>
        <div className="px-4 py-3 space-y-1">
          <Input
            type="url"
            placeholder="Paste YouTube or Vimeo link…"
            className="h-8 text-[13px]"
            value={step7.video_url}
            onChange={(e) => setStep7({ video_url: e.target.value })}
          />
          <p className="text-[10px] text-[#8C8C8C]">Supports YouTube, Vimeo and direct video URLs</p>
        </div>
      </div>
    </div>
  );
}
