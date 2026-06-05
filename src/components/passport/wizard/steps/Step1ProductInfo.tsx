"use client";

import { useRef, useState } from "react";
import { useWizardStore } from "@/stores/wizardStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2, ChevronDown, Lock, Plus, Trash2 } from "lucide-react";
import type { SimilarProduct } from "@/types/wizard";

const CATEGORIES = [
  "T-shirts & Tops", "Shirts & Blouses", "Knitwear", "Outerwear", "Coats & Jackets", "Dresses",
  "Trousers & Jeans", "Skirts", "Shorts", "Activewear", "Swimwear",
  "Underwear & Lingerie", "Footwear", "Bags", "Accessories", "Homeware", "Other",
];

const GENDERS = ["Womenswear", "Menswear", "Unisex", "Kidswear", "Gender-neutral"];

const COUNTRIES = [
  "Bangladesh", "Belgium", "Brazil", "Cambodia", "China", "Denmark",
  "England", "Ethiopia", "France", "Germany", "India", "Indonesia", "Italy",
  "Japan", "Morocco", "Northern Ireland", "Pakistan", "Peru", "Portugal", "Romania",
  "Scotland", "Spain", "Sri Lanka", "Sweden", "Taiwan", "Thailand", "Turkey",
  "United Kingdom", "United States", "Vietnam", "Wales", "Other",
];

function FieldGroup({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#F0F0EE] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAF8] hover:bg-[#F4F4F2] transition-colors"
      >
        <span className="text-[11px] font-semibold text-[#525252] uppercase tracking-wider">{title}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#8C8C8C] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3 py-3 space-y-3">{children}</div>}
    </div>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-[#525252]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {!required && !hint && <span className="text-[10px] font-normal text-[#BDBDBB] ml-1">Optional</span>}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-[#8C8C8C] leading-snug">{hint}</p>}
    </div>
  );
}

export function Step1ProductInfo() {
  const { step1, setStep1 } = useWizardStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function update(key: string, value: string | string[] | number | "") {
    setStep1({ [key]: value } as Parameters<typeof setStep1>[0]);
  }

  async function uploadFile(file: File) {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      update("primary_image_url", data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  }

  return (
    <div className="space-y-3">
      {/* Passport ID — read-only, generated on creation */}
      {step1.passport_code && (
        <div className="flex items-center justify-between px-3 py-2 bg-[#F4F4F2] border border-[#E8E8E6] rounded-lg">
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-widest text-[#8C8C8C] mb-0.5">Passport ID</p>
            <p className="text-[13px] font-mono font-medium text-[#333]">{step1.passport_code}</p>
          </div>
          <Lock className="h-3.5 w-3.5 text-[#BDBDBB] shrink-0 ml-3" />
        </div>
      )}

      {/* Product name — always visible at top */}
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#525252]">
          Product name <span className="text-red-500">*</span>
        </Label>
        <Input
          className="h-8 text-[13px]"
          placeholder="e.g. The Linen Overshirt"
          value={step1.product_name}
          onChange={(e) => update("product_name", e.target.value)}
        />
      </div>

      {/* Image upload — prominent and early */}
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#525252]">Product image <span className="text-[10px] font-normal text-[#8C8C8C]">Recommended</span></Label>
        {step1.primary_image_url ? (
          <div className="relative group w-full rounded-xl overflow-hidden border border-[#E8E8E6] bg-[#F9F9F8]" style={{ height: 160 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={step1.primary_image_url}
              alt="Product"
              className="w-full h-full object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <button
              type="button"
              onClick={() => update("primary_image_url", "")}
              className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            disabled={isUploading}
            className={`w-full flex flex-col items-center justify-center gap-1.5 py-7 border-2 border-dashed rounded-xl transition-colors ${
              isDragging ? "border-black/40 bg-[#F0F0EE]" : "border-[#E8E8E6] bg-[#F9F9F8] hover:border-black/25 hover:bg-[#F4F4F3]"
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 text-[#8C8C8C] animate-spin" />
            ) : (
              <Upload className="h-4 w-4 text-[#8C8C8C]" />
            )}
            <span className="text-[11px] text-[#525252] font-medium">
              {isUploading ? "Uploading…" : isDragging ? "Drop to upload" : "Click or drag to upload"}
            </span>
            <span className="text-[10px] text-[#BDBDBB]">JPG, PNG, WebP up to 10MB</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
        {!step1.primary_image_url && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[#E8E8E6]" />
              <span className="text-[10px] text-[#BDBDBB]">or paste URL</span>
              <div className="h-px flex-1 bg-[#E8E8E6]" />
            </div>
            <Input
              className="h-8 text-[11px]"
              type="url"
              placeholder="https://yourbrand.com/image.jpg"
              value={step1.primary_image_url}
              onChange={(e) => update("primary_image_url", e.target.value)}
            />
          </>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#525252]">Description <span className="text-[10px] font-normal text-[#8C8C8C]">Recommended</span></Label>
        <Textarea
          className="text-[13px] resize-none"
          placeholder="What is it, how does it fit, what makes it special…"
          rows={3}
          value={step1.product_description}
          onChange={(e) => update("product_description", e.target.value)}
        />
      </div>

      {/* Category + Gender */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#525252]">Category</Label>
          <Select value={step1.category} onValueChange={(v) => update("category", v ?? "")}>
            <SelectTrigger className="h-8 text-[13px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-[#525252]">Gender / Audience</Label>
          <Select value={step1.gender} onValueChange={(v) => update("gender", v ?? "")}>
            <SelectTrigger className="h-8 text-[13px]">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => <SelectItem key={g} value={g} className="text-[13px]">{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Country of origin — DPP required */}
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-[#525252]">
          Country of origin <span className="text-red-500">*</span>
          <span className="text-[10px] font-normal text-[#8C8C8C] ml-1">Required by EU textile regulations</span>
        </Label>
        <Select value={step1.country_of_origin} onValueChange={(v) => update("country_of_origin", v ?? "")}>
          <SelectTrigger className="h-8 text-[13px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Identifiers */}
      <FieldGroup title="Identifiers & codes" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="GTIN / Barcode">
            <Input className="h-8 text-[13px]" placeholder="5060123456789" value={step1.gtin} onChange={(e) => update("gtin", e.target.value)} />
          </Field>
          <Field label="Batch ID">
            <Input className="h-8 text-[13px]" placeholder="BATCH-2025-04" value={step1.batch_id} onChange={(e) => update("batch_id", e.target.value)} />
          </Field>
          <Field label="Manufacturing date" hint="Month and year only">
            <Input className="h-8 text-[13px]" type="month" value={step1.manufacturing_date} onChange={(e) => update("manufacturing_date", e.target.value)} />
          </Field>
        </div>
      </FieldGroup>

      {/* Collection & variant */}
      <FieldGroup title="Collection & variant" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Collection name">
            <Input className="h-8 text-[13px]" placeholder="The Quietude Collection" value={step1.collection_name} onChange={(e) => update("collection_name", e.target.value)} />
          </Field>
          <Field label="Season">
            <Input className="h-8 text-[13px]" placeholder="SS25" value={step1.season} onChange={(e) => update("season", e.target.value)} />
          </Field>
          <Field label="Colour">
            <Input className="h-8 text-[13px]" placeholder="Natural ecru" value={step1.colour} onChange={(e) => update("colour", e.target.value)} />
          </Field>
          <Field label="Size range">
            <Input className="h-8 text-[13px]" placeholder="XS–XL" value={step1.size_range} onChange={(e) => update("size_range", e.target.value)} />
          </Field>
        </div>
      </FieldGroup>

      {/* Physical */}
      <FieldGroup title="Physical attributes" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Weight (grams)" hint="Per unit, packed">
            <Input
              className="h-8 text-[13px]"
              type="number" min={0} placeholder="e.g. 280"
              value={step1.product_weight_g}
              onChange={(e) => update("product_weight_g", e.target.value === "" ? "" : Number(e.target.value))}
            />
          </Field>
          <Field label="Expected lifetime (years)" hint="Durability signal for ESPR">
            <Input
              className="h-8 text-[13px]"
              type="number" min={0} placeholder="e.g. 5"
              value={step1.product_lifetime_years}
              onChange={(e) => update("product_lifetime_years", e.target.value === "" ? "" : Number(e.target.value))}
            />
          </Field>
        </div>
      </FieldGroup>

      {/* Links */}
      <FieldGroup title="Links" defaultOpen={false}>
        <Field label="Product page URL">
          <Input className="h-8 text-[13px]" type="url" placeholder="https://yourbrand.com/products/…" value={step1.product_url} onChange={(e) => update("product_url", e.target.value)} />
        </Field>
      </FieldGroup>

      {/* Similar products (upsell strip) */}
      <FieldGroup title="Similar products" defaultOpen={false}>
        <p className="text-[11px] text-[#8C8C8C] -mt-1 mb-3">
          Add up to 4 products — shown as a swipeable strip at the bottom of this passport. Each card shows the image, name, and optional price.
        </p>
        <SimilarProductsEditor
          items={step1.similar_products ?? []}
          onChange={(items) => setStep1({ similar_products: items })}
        />
      </FieldGroup>
    </div>
  );
}

// ── Similar products editor ───────────────────────────────────────────────────

function SimilarProductsEditor({
  items,
  onChange,
}: {
  items: SimilarProduct[];
  onChange: (items: SimilarProduct[]) => void;
}) {
  function add() {
    if (items.length >= 4) return;
    onChange([...items, { name: "", image_url: "", url: "", rrp: "" }]);
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function update(idx: number, field: keyof SimilarProduct, value: string) {
    onChange(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <SimilarProductCard
          key={idx}
          item={item}
          index={idx}
          onUpdate={(field, value) => update(idx, field, value)}
          onRemove={() => remove(idx)}
        />
      ))}
      {items.length < 4 && (
        <button
          type="button"
          onClick={add}
          className="w-full h-8 flex items-center justify-center gap-1.5 border border-dashed border-[#E8E8E6] rounded-xl text-[11px] text-[#525252] hover:border-black/25 hover:bg-[#FAFAF8] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add product {items.length > 0 ? `(${items.length}/4)` : ""}
        </button>
      )}
    </div>
  );
}

function SimilarProductCard({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: SimilarProduct;
  index: number;
  onUpdate: (field: keyof SimilarProduct, value: string) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUpdate("image_url", data.url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="border border-[#E8E8E6] rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[#525252] uppercase tracking-wide">Product {index + 1}</span>
        <button type="button" onClick={onRemove} className="p-1 rounded hover:bg-red-50 text-[#8C8C8C] hover:text-red-600 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Image */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg border border-[#E8E8E6] bg-[#F9F9F8] overflow-hidden shrink-0 flex items-center justify-center">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Upload className="h-4 w-4 text-[#BDBDBB]" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-[10px] font-medium text-[#8C8C8C]">Product image</Label>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="h-7 px-2.5 flex items-center gap-1 border border-[#E8E8E6] rounded-lg text-[11px] text-[#525252] hover:bg-[#F5F5F3] transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              {uploading ? "Uploading…" : "Upload"}
            </button>
            {item.image_url && (
              <button type="button" onClick={() => onUpdate("image_url", "")} className="h-7 px-2 text-[#8C8C8C] hover:text-red-600 transition-colors">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      </div>

      {/* Name + URL */}
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-[#8C8C8C]">Product name *</Label>
        <Input className="h-8 text-[13px]" placeholder="e.g. The Slim Fit Chino" value={item.name} onChange={(e) => onUpdate("name", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-[#8C8C8C]">Link URL *</Label>
        <Input className="h-8 text-[13px]" type="url" placeholder="https://yourbrand.com/products/…" value={item.url} onChange={(e) => onUpdate("url", e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-[#8C8C8C]">
          RRP <span className="font-normal text-[#BDBDBB]">Optional</span>
        </Label>
        <Input className="h-8 text-[13px]" placeholder="e.g. £89 or $120" value={item.rrp} onChange={(e) => onUpdate("rrp", e.target.value)} />
      </div>
    </div>
  );
}
