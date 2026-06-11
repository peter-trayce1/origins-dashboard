"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brandSettingsSchema, type BrandSettingsInput } from "@/schemas/brand";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";

export default function BrandSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<BrandSettingsInput>({
    resolver: zodResolver(brandSettingsSchema) as Resolver<BrandSettingsInput>,
    defaultValues: { name: "", website_url: "", sustainability_story: "", primary_colour: "#0A0A0A" },
  });

  useEffect(() => {
    fetch("/api/brands/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) {
          form.reset({
            name: data.name ?? "",
            website_url: data.website_url ?? "",
            sustainability_story: data.sustainability_story ?? "",
            primary_colour: data.primary_colour ?? "#0A0A0A",
          });
        }
        setLogoUrl(data.logo_url ?? null);
      })
      .finally(() => setIsLoading(false));
  }, [form]);

  async function handleLogoFile(file: File) {
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const patchRes = await fetch("/api/brands/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: data.url }),
      });
      if (!patchRes.ok) throw new Error("Failed to save logo");

      setLogoUrl(data.url);
      toast.success("Logo updated");
    } catch (err) {
      toast.error("Logo upload failed");
      console.error(err);
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeLogo() {
    const res = await fetch("/api/brands/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo_url: null }),
    });
    if (res.ok) {
      setLogoUrl(null);
      toast.success("Logo removed");
    } else {
      toast.error("Failed to remove logo");
    }
  }

  async function onSubmit(values: BrandSettingsInput) {
    setIsSaving(true);
    const res = await fetch("/api/brands/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      toast.success("Brand settings saved");
    } else {
      toast.error("Failed to save settings");
    }
    setIsSaving(false);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-5 w-5 animate-spin text-[#8C8C8C]" /></div>;
  }

  return (
    <div className="space-y-8 max-w-xl">
      <PageHeader title="Brand settings" description="Update your brand profile and identity." />

      {/* Logo section */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Brand logo</Label>
          <p className="text-xs text-[#8C8C8C] mt-0.5">Shown in the top-left of every product passport and in your profile.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="h-16 w-16 rounded-xl border border-[#E8E8E6] bg-[#F7F7F5] flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt="Brand logo" width={64} height={64} className="object-contain w-full h-full p-1" />
            ) : (
              <span className="text-[10px] text-[#8C8C8C] font-medium text-center px-1">No logo</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={logoUploading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E8E8E6] bg-white px-3 text-[12px] font-medium text-[#444] hover:border-black/30 hover:bg-[#FAFAF8] transition-colors disabled:opacity-50"
            >
              {logoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {logoUploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={removeLogo}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
            <p className="text-[10px] text-[#8C8C8C]">PNG or SVG · transparent background recommended · max 2 MB</p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleLogoFile(file);
          }}
        />
      </div>

      <div className="border-t border-[#F0F0EE]" />

      <form onSubmit={form.handleSubmit(onSubmit as Parameters<typeof form.handleSubmit>[0])} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Brand name</Label>
          <Input {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Website URL</Label>
          <Input type="url" placeholder="https://yourbrand.com" {...form.register("website_url")} />
        </div>

        <div className="space-y-1.5">
          <Label>Brand colour <span className="text-[#8C8C8C] font-normal text-xs">Used on public passport pages</span></Label>
          <div className="flex items-center gap-3">
            <input type="color" {...form.register("primary_colour")} className="h-9 w-14 rounded border border-[#E8E8E6] cursor-pointer p-0.5" />
            <Input {...form.register("primary_colour")} className="font-mono w-32" placeholder="#0A0A0A" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Our Story</Label>
          <Textarea
            rows={5}
            placeholder="Tell your brand's story — your values, what drives your approach, and why you exist…"
            {...form.register("sustainability_story")}
          />
          <p className="text-xs text-[#8C8C8C]">Pre-fills the Product Story on new passports. Also used as context for the AI generator.</p>
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
