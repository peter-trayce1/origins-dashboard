export type RequestStatus = 'draft' | 'sent' | 'opened' | 'in_progress' | 'completed' | 'expired';
export type RequestType = 'tier1_manufacturer' | 'material_supplier' | 'certification' | 'logistics' | 'brand_team';

export interface RequestSection {
  id: string;
  included: boolean;
}

export interface SupplyChainRequest {
  id: string;
  brand_id: string;
  passport_id: string | null;
  request_code: string;
  request_type: RequestType;
  supplier_name: string | null;
  supplier_email: string | null;
  status: RequestStatus;
  sections: RequestSection[];
  message: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  response_data: Record<string, unknown> | null;
  // joined
  passports?: { product_name: string; passport_code: string | null } | null;
}

export interface SupplyChainResponseData {
  factory_info?: {
    factory_name: string;
    contact_name: string;
    contact_email: string;
    country: string;
    city: string;
    address: string;
    website: string;
  };
  manufacturing_info?: {
    product_name: string;
    style_id: string;
    manufacturing_date: string;
    country_of_manufacture: string;
  };
  materials?: Array<{
    material_name: string;
    composition_pct: number;
    supplier_name: string;
    country_of_origin: string;
  }>;
  trims?: {
    buttons: string;
    zips: string;
    labels: string;
    packaging: string;
  };
  processes?: string[];
  certifications?: Array<{
    certification_name: string;
    certificate_number: string;
    issue_date: string;
    expiry_date: string;
    document_url: string;
  }>;
  chemical_compliance?: {
    reach_compliant: boolean;
    no_pfas: boolean;
    animal_derived: boolean;
  };
  care?: {
    washing: string;
    drying: string;
    ironing: string;
    storage: string;
  };
  sustainability?: {
    energy_use: number | null;
    energy_unit: string;
    water_use: number | null;
    carbon_footprint: number | null;
    renewable_energy_pct: number | null;
  };
}
