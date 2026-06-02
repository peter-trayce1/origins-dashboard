"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { onboardingSchema, type OnboardingFormData } from "@/schemas/brand";

const INDUSTRIES = [
  "Fashion & Apparel",
  "Sportswear & Activewear",
  "Footwear",
  "Accessories & Jewellery",
  "Homeware & Textiles",
  "Childrenswear",
  "Luxury",
  "Other",
];

const PRODUCT_CATEGORIES = [
  "Womenswear",
  "Menswear",
  "Unisex",
  "Kidswear",
  "Footwear",
  "Bags & Accessories",
  "Homeware",
  "Sportswear",
  "Other",
];

const COUNTRIES = [
  "United Kingdom", "France", "Italy", "Germany", "Spain", "Portugal",
  "Netherlands", "Denmark", "Sweden", "United States", "Canada",
  "Australia", "Japan", "South Korea", "Other",
];

const steps = [
  { title: "Your brand", description: "Tell us about your brand" },
  { title: "Product focus", description: "What do you make?" },
  { title: "Get started", description: "How would you like to begin?" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      organisation_name: "",
      brand_name: "",
      website_url: "",
      industry: "",
      product_category: "",
      country: "",
      default_theme: "origins_standard",
      onboarding_method: "manual",
    },
  });

  const industry = watch("industry");
  const productCategory = watch("product_category");
  const country = watch("country");
  const onboardingMethod = watch("onboarding_method");

  async function handleNext() {
    const fieldsToValidate: (keyof OnboardingFormData)[][] = [
      ["organisation_name", "brand_name"],
      ["industry", "product_category", "country"],
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
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Something went wrong");

      toast.success("Brand set up! Let's create your first passport.");

      if (data.onboarding_method === "csv") {
        router.push("/bulk-upload");
      } else {
        router.push("/dashboard");
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
              i < currentStep
                ? "bg-black text-white"
                : i === currentStep
                ? "bg-black text-white"
                : "bg-[#E8E8E6] text-[#8C8C8C]"
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
                  <Input
                    placeholder="e.g. Verdana Studio Ltd"
                    {...register("organisation_name")}
                  />
                  {errors.organisation_name && (
                    <p className="text-xs text-red-600">{errors.organisation_name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Brand name</Label>
                  <Input
                    placeholder="e.g. Verdana Studio"
                    {...register("brand_name")}
                  />
                  {errors.brand_name && (
                    <p className="text-xs text-red-600">{errors.brand_name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Website <span className="text-[#8C8C8C] font-normal">(optional)</span></Label>
                  <Input
                    type="url"
                    placeholder="https://yourbrand.com"
                    {...register("website_url")}
                  />
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-xs text-red-600">{errors.industry.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Primary product category</Label>
                  <Select onValueChange={(v) => setValue("product_category", v ?? "")} value={productCategory ?? ""}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.product_category && (
                    <p className="text-xs text-red-600">{errors.product_category.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select onValueChange={(v) => setValue("country", v ?? "")} value={country ?? ""}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && (
                    <p className="text-xs text-red-600">{errors.country.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: How to start */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-black">{steps[2].title}</h2>
                  <p className="text-sm text-[#525252] mt-0.5">How would you like to create your first passport?</p>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      value: "manual",
                      label: "Create manually",
                      description: "Step-by-step wizard — great for your first passport",
                    },
                    {
                      value: "csv",
                      label: "Bulk upload CSV",
                      description: "Import multiple products from a spreadsheet",
                    },
                    {
                      value: "integration",
                      label: "Connect my store",
                      description: "Sync products from Shopify or WooCommerce (coming soon)",
                      disabled: true,
                    },
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
                        {onboardingMethod === option.value && (
                          <div className="w-2 h-2 rounded-full bg-black" />
                        )}
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
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up…
                    </>
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
