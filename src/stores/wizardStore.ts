"use client";

import { create } from "zustand";
import type {
  WizardData,
  WizardStep1,
  WizardStep2,
  WizardStep3,
  WizardStep4,
  WizardStep5,
  WizardStep6,
  WizardStep7,
} from "@/types/wizard";

const defaultStep1: WizardStep1 = {
  passport_code: "",
  product_name: "",
  sku: "",
  gtin: "",
  batch_id: "",
  category: "",
  gender: "",
  size_range: "",
  colour: "",
  season: "",
  collection_name: "",
  product_description: "",
  product_url: "",
  primary_image_url: "",
  additional_image_urls: [],
  manufacturing_date: "",
  slug: "",
  country_of_origin: "",
  product_weight_g: "",
  product_lifetime_years: "",
  similar_products: [],
  made_to_order: false,
  brand_name_override: "",
  brand_logo_override: "",
};

const defaultStep2: WizardStep2 = {
  materials: [],
  dyeing_notes: "",
  finishing_notes: "",
  restricted_substances_ok: null,
  animal_derived: false,
  pfas_free: null,
  trim_notes: { buttons: "", zips: "", labels: "", packaging: "" },
};

const defaultStep3: WizardStep3 = { facilities: [] };

const defaultCoreMeta = {
  benchmark_value: null,
  avoided_value: null,
  savings_percentage: null,
  scope: "",
  source_name: "",
  source_method: "",
  evidence_url: "",
  verification_status: "claimed" as const,
  explanation: "",
  display_public: true,
};

const defaultStep4: WizardStep4 = {
  carbon_footprint_kg: "",
  carbon_meta: { ...defaultCoreMeta },
  water_usage_litres: "",
  water_meta: { ...defaultCoreMeta },
  energy_use_kwh: "",
  energy_unit: "kWh",
  energy_meta: { ...defaultCoreMeta },
  sustainability_summary: "",
  sustainability_claims: [],
  claim_evidence_urls: {},
  impact_data_source: "brand_declared",
  impact_metrics: [],
};

const defaultStep5: WizardStep5 = {
  certifications: [],
  compliance_notes: "",
};

const defaultStep6: WizardStep6 = {
  care_instructions: [],
  circularity_actions: [],
  repair_instructions: "",
  spare_parts_available: false,
  take_back_url: "",
  resale_url: "",
  recycling_instructions: "",
  end_of_life_guidance: "",
  warranty_info: "",
  repairability_score: "",
  recyclability: "",
};

const defaultStep7: WizardStep7 = {
  product_story: "",
  product_story_image_url: "",
  maker_story: "",
  makers_image_url: "",
  design_notes: "",
  brand_impact_statement: "",
  consumer_transparency_summary: "",
  video_url: "",
  designer_quote: "",
  gallery_image_urls: [],
};

interface WizardStore extends WizardData {
  setPassportId: (id: string) => void;
  setCurrentStep: (step: number) => void;
  setStep1: (data: Partial<WizardStep1>) => void;
  setStep2: (data: Partial<WizardStep2>) => void;
  setStep3: (data: Partial<WizardStep3>) => void;
  setStep4: (data: Partial<WizardStep4>) => void;
  setStep5: (data: Partial<WizardStep5>) => void;
  setStep6: (data: Partial<WizardStep6>) => void;
  setStep7: (data: Partial<WizardStep7>) => void;
  setSaving: (saving: boolean) => void;
  markSaved: (savedVersion: number) => void;
  markDirty: () => void;
  setSlugFromServer: (slug: string) => void;
  reset: () => void;
  hydrate: (passport: Record<string, unknown>) => void;
}

const initialState: WizardData = {
  passportId: null,
  currentStep: 1,
  step1: defaultStep1,
  step2: defaultStep2,
  step3: defaultStep3,
  step4: defaultStep4,
  step5: defaultStep5,
  step6: defaultStep6,
  step7: defaultStep7,
  isSaving: false,
  lastSaved: null,
  isDirty: false,
  changeVersion: 0,
};

export const useWizardStore = create<WizardStore>((set) => ({
  ...initialState,

  setPassportId: (id) => set({ passportId: id }),
  setCurrentStep: (step) => set({ currentStep: step }),

  setStep1: (data) =>
    set((s) => ({ step1: { ...s.step1, ...data }, isDirty: true, changeVersion: s.changeVersion + 1 })),
  setStep2: (data) =>
    set((s) => ({ step2: { ...s.step2, ...data }, isDirty: true, changeVersion: s.changeVersion + 1 })),
  setStep3: (data) =>
    set((s) => ({ step3: { ...s.step3, ...data }, isDirty: true, changeVersion: s.changeVersion + 1 })),
  setStep4: (data) =>
    set((s) => ({ step4: { ...s.step4, ...data }, isDirty: true, changeVersion: s.changeVersion + 1 })),
  setStep5: (data) =>
    set((s) => ({ step5: { ...s.step5, ...data }, isDirty: true, changeVersion: s.changeVersion + 1 })),
  setStep6: (data) =>
    set((s) => ({ step6: { ...s.step6, ...data }, isDirty: true, changeVersion: s.changeVersion + 1 })),
  setStep7: (data) =>
    set((s) => ({ step7: { ...s.step7, ...data }, isDirty: true, changeVersion: s.changeVersion + 1 })),

  setSaving: (saving) => set({ isSaving: saving }),
  // Only clear dirty if no new edits arrived while the save was in-flight
  markSaved: (savedVersion) =>
    set((s) => ({
      lastSaved: new Date(),
      isDirty: s.changeVersion !== savedVersion,
    })),
  markDirty: () => set((s) => ({ isDirty: true, changeVersion: s.changeVersion + 1 })),
  setSlugFromServer: (slug) => set((s) => ({ step1: { ...s.step1, slug } })),

  reset: () => set(initialState),

  hydrate: (passport) => {
    const p = passport as Record<string, unknown>;
    set({
      passportId: p.id as string,
      currentStep: (p.wizard_step as number) ?? 1,
      step1: {
        passport_code: (p.passport_code as string) ?? "",
        product_name: (p.product_name as string) ?? "",
        sku: (p.sku as string) ?? "",
        gtin: (p.gtin as string) ?? "",
        batch_id: (p.batch_id as string) ?? "",
        category: (p.category as string) ?? "",
        gender: (p.gender as string) ?? "",
        size_range: (p.size_range as string) ?? "",
        colour: (p.colour as string) ?? "",
        season: (p.season as string) ?? "",
        collection_name: (p.collection_name as string) ?? "",
        product_description: (p.product_description as string) ?? "",
        product_url: (p.product_url as string) ?? "",
        primary_image_url: (p.primary_image_url as string) ?? "",
        additional_image_urls: (p.additional_image_urls as string[]) ?? [],
        manufacturing_date: ((p.manufacturing_date as string) ?? "").slice(0, 7),
        slug: (p.slug as string) ?? "",
        country_of_origin: (p.country_of_origin as string) ?? "",
        product_weight_g: (p.product_weight_g as number) ?? "",
        product_lifetime_years: (p.product_lifetime_years as number) ?? "",
        similar_products: (p.similar_products as import("@/types/wizard").SimilarProduct[]) ?? [],
        made_to_order: (p.made_to_order as boolean) ?? false,
        brand_name_override: (p.brand_name_override as string) ?? "",
        brand_logo_override: (p.brand_logo_override as string) ?? "",
      },
      step2: {
        materials: (p.product_materials as WizardStep2["materials"]) ?? [],
        dyeing_notes: "",
        finishing_notes: "",
        restricted_substances_ok: null,
        animal_derived: false,
        pfas_free: null,
        trim_notes: { buttons: "", zips: "", labels: "", packaging: "" },
        ...((p.passport_material_extras as Record<string, unknown>) ?? {}),
      },
      step3: {
        facilities: ((p.product_facilities as Record<string, unknown>[]) ?? []).map((f) => ({
          facility_name:          (f.facility_name as string) ?? "",
          tier:                   (f.tier as number) ?? 1,
          process_stage:          (f.process_stage as string) ?? "",
          country:                (f.country as string) ?? "",
          city:                   (f.city as string) ?? "",
          website_url:            (f.website_url as string) ?? "",
          facility_address:       (f.facility_address as string) ?? "",
          ownership_relationship:    ((f.ownership_relationship as string) ?? "") as import("@/types/wizard").WizardFacility["ownership_relationship"],
          confidence_level:          ((f.confidence_level as string) ?? "brand_declared") as import("@/types/passport").ConfidenceLevel,
          facility_certifications:   (f.facility_certifications as { name: string; url: string }[]) ?? [],
        })),
      },
      step4: {
        carbon_footprint_kg: (p.carbon_footprint_kg as number) ?? "",
        carbon_meta: { ...defaultCoreMeta, ...((p.carbon_meta as Record<string, unknown>) ?? {}) },
        water_usage_litres: (p.water_usage_litres as number) ?? "",
        water_meta: { ...defaultCoreMeta, ...((p.water_meta as Record<string, unknown>) ?? {}) },
        energy_use_kwh: (p.energy_use_kwh as number) ?? "",
        energy_unit: (p.energy_unit as string) ?? "kWh",
        energy_meta: { ...defaultCoreMeta, ...((p.energy_meta as Record<string, unknown>) ?? {}) },
        sustainability_summary: (p.sustainability_summary as string) ?? "",
        sustainability_claims: (p.sustainability_claims as string[]) ?? [],
        claim_evidence_urls: (p.claim_evidence_urls as Record<string, string>) ?? {},
        impact_data_source: (p.impact_data_source as string) ?? "brand_declared",
        impact_metrics: ((p.impact_metrics as Record<string, unknown>[]) ?? []).map((m) => ({
          metric_key: (m.metric_key as string) ?? "",
          metric_name: (m.label as string) ?? (m.metric_name as string) ?? "",
          metric_type: (m.metric_type as WizardStep4["impact_metrics"][0]["metric_type"]) ?? "other",
          metric_value: (m.metric_value as number | null) ?? null,
          metric_unit: (m.metric_unit as string) ?? "",
          benchmark_value: (m.benchmark_value as number | null) ?? null,
          avoided_value: (m.avoided_value as number | null) ?? null,
          savings_percentage: (m.savings_percentage as number | null) ?? null,
          explanation: (m.explanation as string) ?? "",
          evidence_url: (m.evidence_url as string) ?? "",
          verification_status: (m.verification_status as WizardStep4["impact_metrics"][0]["verification_status"]) ?? "claimed",
          display_public: m.display_public !== false,
          source_name: (m.source_name as string) ?? "",
          source_method: (m.source_method as string) ?? "",
          metric_scope: (m.metric_scope as string) ?? "",
          confidence_level: (m.confidence_level as WizardStep4["impact_metrics"][0]["confidence_level"]) ?? "brand_declared",
        })),
      },
      step5: {
        certifications: ((p.product_certifications as Record<string, unknown>[]) ?? []).map((c) => ({
          certification_name: (c.certification_name as string) ?? "",
          certificate_number: (c.certificate_number as string) ?? "",
          issued_by: (c.issued_by as string) ?? "",
          issued_at: (c.issued_at as string) ?? "",
          expires_at: (c.expires_at as string) ?? "",
          document_url: (c.document_url as string) ?? "",
          verification_url: (c.verification_url as string) ?? "",
          claim_type:        (c.claim_type as string) ?? "",
          confidence_level:  ((c.confidence_level as string) ?? "brand_declared") as import("@/types/passport").ConfidenceLevel,
          description:       (c.description as string) ?? "",
          custom_logo_url:   (c.custom_logo_url as string) ?? "",
        })),
        compliance_notes: "",
      },
      step6: {
        care_instructions: (p.care_instructions as WizardStep6["care_instructions"]) ?? [],
        circularity_actions: (p.circularity_actions as WizardStep6["circularity_actions"]) ?? [],
        warranty_info: (p.warranty_info as string) ?? "",
        repairability_score: (p.repairability_score as number) ?? "",
        spare_parts_available: (p.spare_parts_available as boolean) ?? false,
        repair_instructions: (p.repair_instructions as string) ?? "",
        recyclability: (p.recyclability as WizardStep6["recyclability"]) ?? "",
        recycling_instructions: (p.recycling_instructions as string) ?? "",
        end_of_life_guidance: (p.end_of_life_guidance as string) ?? "",
        take_back_url: "",
        resale_url: "",
      },
      step7: {
        product_story: (p.product_story as string) ?? "",
        product_story_image_url: (p.product_story_image_url as string) ?? "",
        maker_story: (p.maker_story as string) ?? "",
        makers_image_url: (p.makers_image_url as string) ?? "",
        design_notes: (p.design_notes as string) ?? "",
        brand_impact_statement: (p.brand_impact_statement as string) ?? "",
        consumer_transparency_summary: (p.consumer_transparency_summary as string) ?? "",
        video_url: (p.video_url as string) ?? "",
        designer_quote: (p.designer_quote as string) ?? "",
        gallery_image_urls: (p.gallery_image_urls as string[]) ?? [],
      },
      isDirty: false,
      lastSaved: null,
    });
  },
}));
