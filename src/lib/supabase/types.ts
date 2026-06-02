// Auto-generated types — run `supabase gen types typescript` to regenerate
// For now, minimal type stubs to enable development

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Helper: make all fields optional except listed required ones
type OptionalExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "platform_admin";
          created_at: string;
          updated_at: string;
        };
        Insert: OptionalExcept<Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at">, "id" | "email">;
        Update: Partial<Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      organisations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: "free" | "starter" | "pro" | "enterprise";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["organisations"]["Row"], "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["organisations"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      organisation_members: {
        Row: {
          id: string;
          organisation_id: string;
          user_id: string;
          role: "admin" | "editor" | "viewer";
          invited_by: string | null;
          invite_email: string | null;
          invite_token: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["organisation_members"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["organisation_members"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      brands: {
        Row: {
          id: string;
          organisation_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          website_url: string | null;
          industry: string | null;
          product_category: string | null;
          country: string | null;
          sustainability_story: string | null;
          primary_colour: string;
          default_theme: string;
          contact_email: string | null;
          social_links: Json;
          default_cta_links: Json;
          default_footer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["brands"]["Row"], "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["brands"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      collections: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          season: string | null;
          year: number | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["collections"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["collections"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      products: {
        Row: {
          id: string;
          brand_id: string;
          collection_id: string | null;
          name: string;
          sku: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      passports: {
        Row: {
          id: string;
          brand_id: string;
          product_id: string | null;
          template_id: string | null;
          slug: string | null;
          status: "draft" | "published" | "archived";
          wizard_step: number;
          product_name: string;
          sku: string | null;
          gtin: string | null;
          batch_id: string | null;
          category: string | null;
          gender: string | null;
          size_range: string | null;
          colour: string | null;
          season: string | null;
          collection_name: string | null;
          product_description: string | null;
          product_url: string | null;
          primary_image_url: string | null;
          additional_image_urls: string[];
          manufacturing_date: string | null;
          carbon_footprint_kg: number | null;
          carbon_meta: Json;
          water_usage_litres: number | null;
          water_meta: Json;
          energy_use_kwh: number | null;
          energy_unit: string;
          energy_meta: Json;
          sustainability_summary: string | null;
          sustainability_claims: Json;
          claim_evidence_urls: Json;
          impact_data_source: string;
          country_of_origin: string | null;
          product_weight_g: number | null;
          product_lifetime_years: number | null;
          product_story: string | null;
          product_story_image_url: string | null;
          maker_story: string | null;
          makers_image_url: string | null;
          brand_story: string | null;
          design_notes: string | null;
          brand_impact_statement: string | null;
          consumer_transparency_summary: string | null;
          video_url: string | null;
          designer_quote: string | null;
          gallery_image_urls: string[];
          passport_code: string | null;
          warranty_info: string | null;
          repairability_score: number | null;
          spare_parts_available: boolean;
          repair_instructions: string | null;
          recyclability: string | null;
          recycling_instructions: string | null;
          end_of_life_guidance: string | null;
          completeness_score: number;
          completeness_detail: Json;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["passports"]["Row"], "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["passports"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      passport_sections: {
        Row: {
          id: string;
          passport_id: string;
          type: string;
          title: string | null;
          content: Json;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["passport_sections"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["passport_sections"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      materials: {
        Row: {
          id: string;
          brand_id: string | null;
          name: string;
          type: string | null;
          standard_name: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["materials"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["materials"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      product_materials: {
        Row: {
          id: string;
          passport_id: string;
          material_id: string | null;
          material_name: string;
          percentage: number | null;
          recycled_content_pct: number | null;
          bio_based_pct: number | null;
          fibre_origin: string | null;
          confidence_level: "verified" | "brand_declared" | "supplier_declared" | "ai_suggested" | "missing";
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["product_materials"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["product_materials"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      passport_material_extras: {
        Row: {
          id: string;
          passport_id: string;
          dyeing_notes: string | null;
          finishing_notes: string | null;
          restricted_substances_ok: boolean | null;
          animal_derived: boolean;
          trim_notes: Json;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["passport_material_extras"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["passport_material_extras"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      suppliers: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          country: string | null;
          website: string | null;
          contact_email: string | null;
          verified: boolean;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["suppliers"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["suppliers"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      facilities: {
        Row: {
          id: string;
          brand_id: string;
          supplier_id: string | null;
          name: string;
          type: string | null;
          country: string | null;
          city: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["facilities"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["facilities"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      product_facilities: {
        Row: {
          id: string;
          passport_id: string;
          facility_id: string | null;
          facility_name: string;
          tier: number | null;
          process_stage: string | null;
          country: string | null;
          city: string | null;
          website_url: string | null;
          confidence_level: "verified" | "brand_declared" | "supplier_declared" | "ai_suggested" | "missing";
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["product_facilities"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["product_facilities"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      certifications: {
        Row: {
          id: string;
          name: string;
          full_name: string | null;
          logo_url: string | null;
          description: string | null;
          category: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["certifications"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["certifications"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      product_certifications: {
        Row: {
          id: string;
          passport_id: string;
          certification_id: string | null;
          certification_name: string;
          certificate_number: string | null;
          issued_by: string | null;
          issued_at: string | null;
          expires_at: string | null;
          document_url: string | null;
          verification_url: string | null;
          claim_type: string | null;
          confidence_level: "verified" | "brand_declared" | "supplier_declared" | "ai_suggested" | "missing";
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["product_certifications"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["product_certifications"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      impact_metrics: {
        Row: {
          id: string;
          passport_id: string;
          metric_key: string;
          metric_value: number | null;
          metric_unit: string | null;
          label: string | null;
          confidence_level: "verified" | "brand_declared" | "supplier_declared" | "ai_suggested" | "missing";
          evidence_url: string | null;
          metric_type: "carbon" | "water" | "energy" | "transport" | "waste" | "circularity" | "packaging" | "biodiversity" | "repairability" | "other" | null;
          benchmark_value: number | null;
          avoided_value: number | null;
          savings_percentage: number | null;
          explanation: string | null;
          evidence_file_path: string | null;
          verification_status: "claimed" | "evidence_attached" | "verified" | "third_party_verified" | null;
          display_public: boolean;
          sort_order: number;
          source_name: string | null;
          source_method: string | null;
          metric_scope: string | null;
          semantic_id: string | null;
          updated_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["impact_metrics"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["impact_metrics"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      care_instructions: {
        Row: {
          id: string;
          passport_id: string;
          type: "wash" | "dry" | "iron" | "bleach" | "dry_clean" | "storage" | "repair" | "warranty";
          instruction: string;
          icon_code: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["care_instructions"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["care_instructions"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      circularity_actions: {
        Row: {
          id: string;
          passport_id: string;
          type: "repair" | "take_back" | "resale" | "recycle" | "donate";
          title: string;
          description: string | null;
          url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["circularity_actions"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["circularity_actions"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      qr_codes: {
        Row: {
          id: string;
          passport_id: string;
          brand_id: string;
          label: string;
          target_url: string;
          style_config: Json;
          is_active: boolean;
          scan_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["qr_codes"]["Row"], "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["qr_codes"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      scans: {
        Row: {
          id: string;
          qr_code_id: string | null;
          passport_id: string;
          brand_id: string;
          ip_hash: string | null;
          user_agent: string | null;
          device_type: "mobile" | "desktop" | "tablet" | "unknown" | null;
          country_code: string | null;
          referrer: string | null;
          scanned_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["scans"]["Row"], "id" | "scanned_at">>;
        Update: never;
        Relationships: never[];
      };
      data_connections: {
        Row: {
          id: string;
          brand_id: string;
          type: string;
          status: "connected" | "disconnected" | "error" | "coming_soon";
          config: Json;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["data_connections"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["data_connections"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      ai_generation_logs: {
        Row: {
          id: string;
          brand_id: string;
          passport_id: string | null;
          user_id: string | null;
          provider: string;
          model: string;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          input_text: string | null;
          output_json: Json | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ai_generation_logs"]["Row"], "id" | "created_at">>;
        Update: never;
        Relationships: never[];
      };
      files: {
        Row: {
          id: string;
          brand_id: string;
          passport_id: string | null;
          storage_path: string;
          public_url: string;
          filename: string;
          mime_type: string | null;
          file_size: number | null;
          purpose: "product_image" | "cert_document" | "gallery" | "brand_logo" | "other" | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["files"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["files"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
      audit_logs: {
        Row: {
          id: string;
          organisation_id: string | null;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at">>;
        Update: never;
        Relationships: never[];
      };
      passport_templates: {
        Row: {
          id: string;
          brand_id: string | null;
          name: string;
          description: string | null;
          category: string | null;
          template_data: Json;
          is_public: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["passport_templates"]["Row"], "id" | "created_at">>;
        Update: Partial<Omit<Database["public"]["Tables"]["passport_templates"]["Row"], "id" | "created_at">>;
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_brand_ids: { Args: Record<string, never>; Returns: string[] };
      user_organisation_ids: { Args: Record<string, never>; Returns: string[] };
    };
    Enums: Record<string, never>;
  };
};
