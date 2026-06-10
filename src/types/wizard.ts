import type { ConfidenceLevel } from "./passport";

export interface SimilarProduct {
  name: string;
  image_url: string;
  url: string;
  rrp: string;
}

export interface WizardMaterial {
  id?: string;
  material_name: string;
  percentage: number;
  recycled_content_pct: number;
  bio_based_pct: number;
  fibre_origin: string;
  supplier_name: string;
  confidence_level: ConfidenceLevel;
}

export interface WizardFacility {
  id?: string;
  facility_name: string;
  facility_id?: string;
  tier: number;
  process_stage: string;
  country: string;
  city: string;
  website_url: string;
  facility_address: string;
  ownership_relationship: "brand_owned" | "tier1_supplier" | "subcontractor" | "";
  confidence_level: ConfidenceLevel;
  facility_certifications: { name: string; url: string }[];
}

export interface WizardCertification {
  id?: string;
  certification_name: string;
  certification_id?: string;
  certificate_number: string;
  issued_by: string;
  issued_at: string;
  expires_at: string;
  document_url: string;
  verification_url: string;
  claim_type: string;
  confidence_level: ConfidenceLevel;
  description: string;
  custom_logo_url: string;
}

export interface WizardCareInstruction {
  id?: string;
  type: string;
  instruction: string;
  icon_code: string;
}

export interface WizardCircularityAction {
  id?: string;
  type: "repair" | "take_back" | "resale" | "recycle" | "donate";
  title: string;
  description: string;
  url: string;
}

export type MetricType =
  | "carbon" | "water" | "energy" | "transport"
  | "waste" | "circularity" | "packaging" | "biodiversity"
  | "repairability" | "other";

export type VerificationStatus =
  | "claimed" | "evidence_attached" | "verified" | "third_party_verified";

export interface CoreMetricMeta {
  benchmark_value: number | null;
  avoided_value: number | null;
  savings_percentage: number | null;
  scope: string;
  source_name: string;
  source_method: string;
  evidence_url: string;
  verification_status: VerificationStatus;
  explanation: string;
  display_public: boolean;
}

export interface WizardImpactMetric {
  metric_key: string;
  metric_name: string;
  metric_type: MetricType;
  metric_value: number | null;
  metric_unit: string;
  benchmark_value: number | null;
  avoided_value: number | null;
  savings_percentage: number | null;
  explanation: string;
  evidence_url: string;
  verification_status: VerificationStatus;
  display_public: boolean;
  source_name: string;
  source_method: string;
  metric_scope: string;
  confidence_level: ConfidenceLevel;
}

export interface WizardStep1 {
  passport_code: string;
  product_name: string;
  sku: string;
  gtin: string;
  batch_id: string;
  category: string;
  gender: string;
  size_range: string;
  colour: string;
  season: string;
  collection_name: string;
  product_description: string;
  product_url: string;
  primary_image_url: string;
  additional_image_urls: string[];
  manufacturing_date: string;
  slug: string;
  country_of_origin: string;
  product_weight_g: number | "";
  product_lifetime_years: number | "";
  similar_products: SimilarProduct[];
  made_to_order: boolean;
  // Demo-account-only per-passport brand identity override
  brand_name_override: string;
  brand_logo_override: string;
}

export interface WizardStep2 {
  materials: WizardMaterial[];
  dyeing_notes: string;
  finishing_notes: string;
  restricted_substances_ok: boolean | null;
  animal_derived: boolean;
  pfas_free: boolean | null;
  trim_notes: {
    buttons: string;
    zips: string;
    labels: string;
    packaging: string;
  };
}

export interface WizardStep3 {
  facilities: WizardFacility[];
}

export interface WizardStep4 {
  carbon_footprint_kg: number | "";
  carbon_meta: CoreMetricMeta;
  water_usage_litres: number | "";
  water_meta: CoreMetricMeta;
  energy_use_kwh: number | "";
  energy_unit: string;
  energy_meta: CoreMetricMeta;
  sustainability_summary: string;
  sustainability_claims: string[];
  claim_evidence_urls: Record<string, string>;
  impact_data_source: string;
  impact_metrics: WizardImpactMetric[];
}

export interface WizardStep5 {
  certifications: WizardCertification[];
  compliance_notes: string;
}

export interface WizardStep6 {
  care_instructions: WizardCareInstruction[];
  circularity_actions: WizardCircularityAction[];
  repair_instructions: string;
  spare_parts_available: boolean;
  take_back_url: string;
  resale_url: string;
  recycling_instructions: string;
  end_of_life_guidance: string;
  warranty_info: string;
  repairability_score: number | "";
  recyclability: "recyclable" | "partially_recyclable" | "not_recyclable" | "";
}

export interface WizardStep7 {
  product_story: string;
  product_story_image_url: string;
  maker_story: string;
  makers_image_url: string;
  design_notes: string;
  brand_impact_statement: string;
  consumer_transparency_summary: string;
  video_url: string;
  designer_quote: string;
  gallery_image_urls: string[];
}

export interface WizardData {
  passportId: string | null;
  currentStep: number;
  step1: WizardStep1;
  step2: WizardStep2;
  step3: WizardStep3;
  step4: WizardStep4;
  step5: WizardStep5;
  step6: WizardStep6;
  step7: WizardStep7;
  isSaving: boolean;
  lastSaved: Date | null;
  isDirty: boolean;
  changeVersion: number;
}
