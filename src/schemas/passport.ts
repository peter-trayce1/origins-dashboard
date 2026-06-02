import { z } from "zod";

const confidenceLevel = z.enum(["verified", "brand_declared", "supplier_declared", "ai_suggested", "missing"]);

export const materialSchema = z.object({
  material_name: z.string().min(1, "Material name is required"),
  percentage: z.number().min(0).max(100),
  recycled_content_pct: z.number().min(0).max(100).default(0),
  bio_based_pct: z.number().min(0).max(100).default(0),
  fibre_origin: z.string().optional(),
  confidence_level: confidenceLevel.default("brand_declared"),
});

export const facilitySchema = z.object({
  facility_name: z.string().min(1, "Facility name is required"),
  facility_id: z.string().optional(),
  tier: z.number().min(1).max(10),
  process_stage: z.string().min(1, "Process stage is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().optional(),
  confidence_level: confidenceLevel.default("brand_declared"),
});

export const certificationSchema = z.object({
  certification_name: z.string().min(1, "Certification name is required"),
  certification_id: z.string().optional(),
  certificate_number: z.string().optional(),
  issued_by: z.string().optional(),
  issued_at: z.string().optional(),
  expires_at: z.string().optional(),
  document_url: z.string().optional(),
  verification_url: z.string().optional(),
  claim_type: z.string().optional(),
  confidence_level: confidenceLevel.default("brand_declared"),
});

export const careInstructionSchema = z.object({
  type: z.enum(["wash", "dry", "iron", "bleach", "dry_clean", "storage", "repair", "warranty"]),
  instruction: z.string().min(1, "Instruction is required"),
  icon_code: z.string().optional(),
});

export const circularityActionSchema = z.object({
  type: z.enum(["repair", "take_back", "resale", "recycle", "donate"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().optional(),
});

export const step1Schema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  gtin: z.string().optional(),
  batch_id: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  size_range: z.string().optional(),
  colour: z.string().optional(),
  season: z.string().optional(),
  collection_name: z.string().optional(),
  product_description: z.string().optional(),
  product_url: z.string().optional(),
  primary_image_url: z.string().optional(),
  additional_image_urls: z.array(z.string()).default([]),
  manufacturing_date: z.string().optional(),
  slug: z.string().optional(),
});

export const step2Schema = z.object({
  materials: z.array(materialSchema),
  dyeing_notes: z.string().optional(),
  finishing_notes: z.string().optional(),
  restricted_substances_ok: z.boolean().nullable().optional(),
  animal_derived: z.boolean().default(false),
  trim_notes: z.object({
    buttons: z.string().optional(),
    zips: z.string().optional(),
    labels: z.string().optional(),
    packaging: z.string().optional(),
  }).optional(),
});

export const step3Schema = z.object({
  facilities: z.array(facilitySchema),
});

export const step4Schema = z.object({
  carbon_footprint_kg: z.union([z.number(), z.literal("")]).optional(),
  water_usage_litres: z.union([z.number(), z.literal("")]).optional(),
  sustainability_summary: z.string().optional(),
  sustainability_claims: z.array(z.string()).default([]),
  impact_data_source: z.string().default("brand_declared"),
});

export const step5Schema = z.object({
  certifications: z.array(certificationSchema),
  compliance_notes: z.string().optional(),
});

export const step6Schema = z.object({
  care_instructions: z.array(careInstructionSchema),
  circularity_actions: z.array(circularityActionSchema),
  repair_instructions: z.string().optional(),
  spare_parts_available: z.boolean().default(false),
  take_back_url: z.string().optional(),
  resale_url: z.string().optional(),
  recycling_instructions: z.string().optional(),
  end_of_life_guidance: z.string().optional(),
  warranty_info: z.string().optional(),
});

export const step7Schema = z.object({
  product_story: z.string().optional(),
  maker_story: z.string().optional(),
  design_notes: z.string().optional(),
  brand_impact_statement: z.string().optional(),
  consumer_transparency_summary: z.string().optional(),
  video_url: z.string().optional(),
  designer_quote: z.string().optional(),
  gallery_image_urls: z.array(z.string()).default([]),
});
