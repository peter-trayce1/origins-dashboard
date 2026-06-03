"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ChevronRight, Upload, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { onboardingSchema, type OnboardingFormData } from "@/schemas/brand";

const INDUSTRIES = [
  "Fashion & Apparel", "Sportswear & Activewear", "Footwear",
  "Accessories & Jewellery", "Homeware & Textiles", "Childrenswear",
  "Luxury", "Other",
];

const PRODUCT_CATEGORIES = [
  "Womenswear", "Menswear", "Unisex", "Kidswear", "Footwear",
  "Bags & Accessories", "Homeware", "Sportswear", "Other",
];

const COUNTRIES = [
  "United Kingdom", "France", "Italy", "Germany", "Spain", "Portugal",
  "Netherlands", "Denmark", "Sweden", "United States", "Canada",
  "Australia", "Japan", "South Korea", "Other",
];

const steps = [
  { title: "Your brand",      description: "Tell us about your brand" },
  { title: "Product focus",   description: "What do you make?" },
  { title: "Brand identity",  description: "Add your logo and brand story" },
  { title: "Get started",     description: "How would you like to begin?" },
];

interface ExistingBrand {
  name: string;
  website_url: string | null;
  logo_url: string | null;
  sustainability_story: string | null;
  industry: string | null;
  product_category: string | null;
  country: string | null;
}

interface OnboardingWizardProps {
  existingBrand?: ExistingBrand | null;
  hasExistingOrg?: boolean;
}

export function OnboardingWizard({ existingBrand, hasExistingOrg }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(existingBrand?.logo_url ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingFormData>,
    defaultValues: {
      organisation_name:    existingBrand?.name ?? "",
      brand_name:           existingBrand?.name ?? "",
      website_url:          existingBrand?.website_url ?? "",
      industry:             existingBrand?.industry ?? "",
      product_category:     existingBrand?.product_category ?? "",
      country:              existingBrand?.country ?? "",
      logo_url:             existingBrand?.logo_url ?? "",
      sustainability_story: existingBrand?.sustainability_story ?? "",
      default_theme:        "origins_standard",
      onboarding_method:    "manual",
    },
  });

  const industry         = watch("industry");
  const productCategory  = watch("product_category");
  const country          = watch("country");
  const onboardingMethod = watch("onboarding_method");

  async function handleLogoFile(file: File) {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload/image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setValue("logo_url", data.url);
      setLogoPreview(data.url);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Logo upload failed — you can add it in Brand Settings later");
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleNext() {
    const fieldsToValidate: (keyof OnboardingFormData)[][] = [
      ["organisation_name", "brand_name"],
      ["industry", "product_category", "country"],
      [], // logo + story are optional
      [],
    ];
    const valid = await trigger(fieldsToValidate[currentStep]);
    if (valid && currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  }

  async function onSubmit(data: OnboardingFormData) {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, has_existing_org: hasExistingOrg }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Something went wrong");

      toast.success("Brand set up! Let's create your first passport.");

      if (data.onboarding_method === "csv") {
        router.push("/bulk-upload");
      } else {
        router.push("/passports/new");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-colors ${
              i <= currentStep ? "bg-black text-white" : "bg-[#E8E8E6] text-[#8C8C8C]"
            }`}>
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:inline transition-colors ${
              i === currentStep ? "text-black" : "text-[#8C8C8C]"
            }`}>
              {step.title}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px transition-colors ${i < currentStep ? "bg-black" : "bg-[#E8E8E6]"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="border border-[#E8E8E6] shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])}>

            {/* Step 0: Brand basics */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-black">{steps[0].title}</h2>
                  <p className="text-sm text-[#525252] mt-0.5">{steps[0].description}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Organisation / Company name</Label>
                  <Input placeholder="e.g. Verdana Studio Ltd" {...register("organisation_name")} />
                  {errors.organisation_name && <p className="text-xs text-red-600">{errors.organisation_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Brand name</Label>
                  <Input placeholder="e.g. Verdana Studio" {...register("brand_name")} />
                  {errors.brand_name && <p className="text-xs text-red-600">{errors.brand_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Website <span className="text-[#8C8C8C] font-normal">(optional)</span></Label>
                  <Input type="url" placeholder="https://yourbrand.com" {...register("website_url")} />
                </div>
              </div>
            )}

            {/* Step 1: Product focus */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-black">{steps[1].title}</h2>
                  <p className="text-sm text-[#525252] mt-0.5">{steps[1].description}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Select onValueChange={(v) => setValue("industry", v ?? "")} value={industry ?? ""}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.industry && <p className="text-xs text-red-600">{errors.industry.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Primary product category</Label>
                  <Select onValueChange={(v) => setValue("product_category", v ?? "")} value={productCategory ?? ""}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{PRODUCT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.product_category && <p className="text-xs text-red-600">{errors.product_category.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select onValueChange={(v) => setValue("country", v ?? "")} value={country ?? ""}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.country && <p className="text-xs text-red-600">{errors.country.message}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Brand identity — logo + story */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-black">{steps[2].title}</h2>
                  <p className="text-sm text-[#525252] mt-0.5">{steps[2].description}</p>
                </div>

                {/* Logo upload */}
                <div className="space-y-2">
                  <Label>Brand logo <span className="text-[#8C8C8C] font-normal">(optional)</span></Label>
                  <p className="text-xs text-[#8C8C8C]">Shown in the top-left of every product passport. PNG or SVG with a transparent background works best.</p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl border border-[#E8E8E6] bg-[#F7F7F5] flex items-center justify-center overflow-hidden shrink-0">
                      {logoPreview ? (
                        <Image src={logoPreview} alt="Brand logo" width={64} height={64} className="object-contain w-full h-full p-1" />
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
                        {logoUploading ? "Uploading…" : logoPreview ? "Replace logo" : "Upload logo"}
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => { setValue("logo_url", ""); setLogoPreview(null); }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
                  />
                </div>

                {/* Brand story */}
                <div className="space-y-1.5">
                  <Label>Our Story <span className="text-[#8C8C8C] font-normal">(optional)</span></Label>
                  <Textarea
                    rows={5}
                    placeholder="Tell your brand's story — your values, what drives your approach, and why you exist…"
                    {...register("sustainability_story")}
                  />
                  <p className="text-xs text-[#8C8C8C]">Pre-fills the Product Story on new passports and is used as context for the AI generator.</p>
                </div>
              </div>
            )}

            {/* Step 3: How to start */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-black">{steps[3].title}</h2>
                  <p className="text-sm text-[#525252] mt-0.5">How would you like to create your first passport?</p>
                </div>
                <div className="space-y-2">
                  {[
                    { value: "manual",      label: "Create manually",    description: "Step-by-step builder — great for your first passport" },
                    { value: "csv",         label: "Bulk upload CSV",    description: "Import multiple products from a spreadsheet" },
                    { value: "integration", label: "Connect my store",   description: "Sync products from Shopify or WooCommerce (coming soon)", disabled: true },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => !option.disabled && setValue("onboarding_method", option.value as "manual" | "csv" | "integration")}
                      className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        onboardingMethod === option.value
                          ? "border-black bg-[#F9F9F8]"
                          : option.disabled
                          ? "border-[#E8E8E6] opacity-50 cursor-not-allowed"
                          : "border-[#E8E8E6] hover:border-black/30"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                        onboardingMethod === option.value ? "border-black" : "border-[#E8E8E6]"
                      }`}>
                        {onboardingMethod === option.value && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">{option.label}</p>
                        <p className="text-xs text-[#525252] mt-0.5">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E8E8E6]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={currentStep === 0}
                className="text-[#525252]"
              >
                Back
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting up…</>
                  ) : (
                    "Get started"
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
