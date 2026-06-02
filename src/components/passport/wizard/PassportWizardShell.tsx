"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWizardStore } from "@/stores/wizardStore";
import { WizardProgress } from "./WizardProgress";
import { Step1ProductInfo } from "./steps/Step1ProductInfo";
import { Step2Materials } from "./steps/Step2Materials";
import { Step3SupplyChain } from "./steps/Step3SupplyChain";
import { Step4Sustainability } from "./steps/Step4Sustainability";
import { Step5Certifications } from "./steps/Step5Certifications";
import { Step6Care } from "./steps/Step6Care";
import { Step7Story } from "./steps/Step7Story";
import { Step8Review } from "./steps/Step8Review";
import { Button } from "@/components/ui/button";
import { Loader2, Save, CheckCircle } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const STEPS = [
  "Product info",
  "Materials",
  "Supply chain",
  "Sustainability",
  "Certifications",
  "Care & circularity",
  "Story",
  "Review & publish",
];

interface PassportWizardShellProps {
  brandId: string;
  brandName: string;
  passportId?: string;
  initialStep?: number;
}

export function PassportWizardShell({
  brandId,
  brandName,
  passportId,
  initialStep = 1,
}: PassportWizardShellProps) {
  const router = useRouter();
  const store = useWizardStore();
  const [isInitialising, setIsInitialising] = useState(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyDebounced = useDebounce(store.isDirty, 2000);

  // Initialise: create or load passport
  useEffect(() => {
    async function init() {
      if (passportId) {
        // Load existing
        const res = await fetch(`/api/passports/${passportId}`);
        if (res.ok) {
          const data = await res.json();
          store.hydrate(data);
        }
      } else {
        // Create new draft
        const res = await fetch("/api/passports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand_id: brandId }),
        });
        if (res.ok) {
          const data = await res.json();
          store.reset();
          store.setPassportId(data.id);
          store.setCurrentStep(1);
          router.replace(`/passports/${data.id}`, { scroll: false });
        } else {
          toast.error("Failed to create passport. Please try again.");
        }
      }
      setIsInitialising(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save when dirty (debounced 2s)
  const saveCurrentStep = useCallback(async () => {
    if (!store.passportId || !store.isDirty) return;
    // Snapshot version before the async request so mid-flight edits aren't lost
    const savedVersion = useWizardStore.getState().changeVersion;
    store.setSaving(true);

    const payload = buildPayload(store);

    const res = await fetch(`/api/passports/${store.passportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, wizard_step: store.currentStep }),
    });

    useWizardStore.getState().setSaving(false);
    if (res.ok) {
      useWizardStore.getState().markSaved(savedVersion);
    }
  }, [store]);

  useEffect(() => {
    if (isDirtyDebounced && store.passportId) {
      saveCurrentStep();
    }
  }, [isDirtyDebounced, store.passportId, saveCurrentStep]);

  async function handleNext() {
    await saveCurrentStep();
    const next = Math.min(store.currentStep + 1, STEPS.length);
    store.setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleBack() {
    await saveCurrentStep();
    const prev = Math.max(store.currentStep - 1, 1);
    store.setCurrentStep(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveDraft() {
    await saveCurrentStep();
    toast.success("Draft saved");
  }

  if (isInitialising) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#8C8C8C]" />
      </div>
    );
  }

  const stepComponents = [
    <Step1ProductInfo key={1} />,
    <Step2Materials key={2} />,
    <Step3SupplyChain key={3} />,
    <Step4Sustainability key={4} />,
    <Step5Certifications key={5} />,
    <Step6Care key={6} />,
    <Step7Story key={7} />,
    <Step8Review key={8} passportId={store.passportId ?? ""} />,
  ];

  const isLastStep = store.currentStep === STEPS.length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#8C8C8C] mb-1">
            <a href="/passports" className="hover:text-black transition-colors">Passports</a>
            <span>/</span>
            <span>{store.step1.product_name || "New passport"}</span>
          </div>
          <h1 className="text-xl font-semibold text-black tracking-tight">
            {passportId ? "Edit passport" : "Create passport"}
          </h1>
          <p className="text-sm text-[#525252] mt-0.5">
            Step {store.currentStep} of {STEPS.length} — {STEPS[store.currentStep - 1]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {store.isSaving ? (
            <span className="flex items-center gap-1.5 text-xs text-[#8C8C8C]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          ) : store.lastSaved ? (
            <span className="flex items-center gap-1.5 text-xs text-[#8C8C8C]">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Saved
            </span>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-1.5" />
            Save draft
          </Button>
        </div>
      </div>

      {/* Progress */}
      <WizardProgress steps={STEPS} currentStep={store.currentStep} />

      {/* Step content */}
      <div className="bg-white border border-[#E8E8E6] rounded-xl p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
        {stepComponents[store.currentStep - 1]}
      </div>

      {/* Navigation */}
      {!isLastStep && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={store.currentStep === 1}
            className="text-[#525252]"
          >
            Back
          </Button>
          <Button onClick={handleNext}>
            Continue to {STEPS[store.currentStep]} →
          </Button>
        </div>
      )}
    </div>
  );
}

function buildPayload(store: ReturnType<typeof useWizardStore.getState>) {
  const s1 = store.step1;
  const s2 = store.step2;
  const s3 = store.step3;
  const s4 = store.step4;
  const s5 = store.step5;
  const s6 = store.step6;
  const s7 = store.step7;

  return {
    // Step 1
    product_name: s1.product_name,
    sku: s1.sku || null,
    gtin: s1.gtin || null,
    batch_id: s1.batch_id || null,
    category: s1.category || null,
    gender: s1.gender || null,
    size_range: s1.size_range || null,
    colour: s1.colour || null,
    season: s1.season || null,
    collection_name: s1.collection_name || null,
    product_description: s1.product_description || null,
    product_url: s1.product_url || null,
    primary_image_url: s1.primary_image_url || null,
    additional_image_urls: s1.additional_image_urls,
    manufacturing_date: s1.manufacturing_date || null,
    slug: s1.slug || null,
    country_of_origin: s1.country_of_origin || null,
    product_weight_g: s1.product_weight_g === "" ? null : s1.product_weight_g,
    product_lifetime_years: s1.product_lifetime_years === "" ? null : s1.product_lifetime_years,

    // Step 2
    product_materials: s2.materials,
    passport_material_extras: {
      dyeing_notes: s2.dyeing_notes,
      finishing_notes: s2.finishing_notes,
      restricted_substances_ok: s2.restricted_substances_ok,
      animal_derived: s2.animal_derived,
      pfas_free: s2.pfas_free,
      trim_notes: s2.trim_notes,
    },

    // Step 3
    product_facilities: s3.facilities,

    // Step 4
    carbon_footprint_kg: s4.carbon_footprint_kg === "" ? null : s4.carbon_footprint_kg,
    water_usage_litres: s4.water_usage_litres === "" ? null : s4.water_usage_litres,
    energy_use_kwh: s4.energy_use_kwh === "" ? null : s4.energy_use_kwh,
    sustainability_summary: s4.sustainability_summary || null,
    sustainability_claims: s4.sustainability_claims,
    claim_evidence_urls: s4.claim_evidence_urls,
    impact_data_source: s4.impact_data_source,

    // Step 5
    product_certifications: s5.certifications,

    // Step 6
    care_instructions: s6.care_instructions,
    circularity_actions: s6.circularity_actions,

    // Step 7
    product_story: s7.product_story || null,
    maker_story: s7.maker_story || null,
    design_notes: s7.design_notes || null,
    brand_impact_statement: s7.brand_impact_statement || null,
    consumer_transparency_summary: s7.consumer_transparency_summary || null,
    video_url: s7.video_url || null,
    designer_quote: s7.designer_quote || null,
    gallery_image_urls: s7.gallery_image_urls,
  };
}
