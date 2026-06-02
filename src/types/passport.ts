import type { Database } from "@/lib/supabase/types";

export type Passport = Database["public"]["Tables"]["passports"]["Row"];
export type PassportInsert = Database["public"]["Tables"]["passports"]["Insert"];
export type PassportUpdate = Database["public"]["Tables"]["passports"]["Update"];
export type ProductMaterial = Database["public"]["Tables"]["product_materials"]["Row"];
export type ProductFacility = Database["public"]["Tables"]["product_facilities"]["Row"];
export type ProductCertification = Database["public"]["Tables"]["product_certifications"]["Row"];
export type CareInstruction = Database["public"]["Tables"]["care_instructions"]["Row"];
export type CircularityAction = Database["public"]["Tables"]["circularity_actions"]["Row"];
export type ImpactMetric = Database["public"]["Tables"]["impact_metrics"]["Row"];
export type PassportMaterialExtras = Database["public"]["Tables"]["passport_material_extras"]["Row"];
export type Brand = Database["public"]["Tables"]["brands"]["Row"];
export type Organisation = Database["public"]["Tables"]["organisations"]["Row"];
export type Collection = Database["public"]["Tables"]["collections"]["Row"];
export type QRCode = Database["public"]["Tables"]["qr_codes"]["Row"];
export type Scan = Database["public"]["Tables"]["scans"]["Row"];
export type Certification = Database["public"]["Tables"]["certifications"]["Row"];

export type ConfidenceLevel =
  | "verified"
  | "brand_declared"
  | "supplier_declared"
  | "ai_suggested"
  | "missing";

export type PassportStatus = "draft" | "published" | "archived";

export interface PassportWithRelations extends Passport {
  product_materials: ProductMaterial[];
  product_facilities: ProductFacility[];
  product_certifications: ProductCertification[];
  care_instructions: CareInstruction[];
  circularity_actions: CircularityAction[];
  impact_metrics: ImpactMetric[];
  passport_material_extras: PassportMaterialExtras[] | PassportMaterialExtras | null;
  qr_codes: QRCode[];
  brands: Brand;
}

export interface DashboardStats {
  totalPassports: number;
  publishedPassports: number;
  draftPassports: number;
  totalScans: number;
  qrCodesGenerated: number;
}
