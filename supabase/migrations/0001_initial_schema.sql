-- OriginsID: Initial Schema
-- Run this in Supabase SQL editor or via supabase db push

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE public.users (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  full_name    text,
  avatar_url   text,
  role         text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'platform_admin')),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ============================================================
-- ORGANISATIONS
-- ============================================================
CREATE TABLE public.organisations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  plan       text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- ORGANISATION MEMBERS
-- ============================================================
CREATE TABLE public.organisation_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by      uuid REFERENCES public.users(id),
  invite_email    text,
  invite_token    text UNIQUE,
  accepted_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(organisation_id, user_id)
);

-- ============================================================
-- BRANDS
-- ============================================================
CREATE TABLE public.brands (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id      uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  slug                 text NOT NULL UNIQUE,
  logo_url             text,
  website_url          text,
  industry             text,
  product_category     text,
  country              text,
  sustainability_story text,
  primary_colour       text DEFAULT '#000000',
  default_theme        text DEFAULT 'origins_standard',
  contact_email        text,
  social_links         jsonb DEFAULT '{}',
  default_cta_links    jsonb DEFAULT '{}',
  default_footer       text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE TABLE public.collections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name       text NOT NULL,
  season     text,
  year       integer,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES public.collections(id),
  name          text NOT NULL,
  sku           text,
  category      text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ============================================================
-- PASSPORT TEMPLATES (needed before passports)
-- ============================================================
CREATE TABLE public.passport_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  category      text,
  template_data jsonb NOT NULL DEFAULT '{}',
  is_public     boolean DEFAULT false,
  sort_order    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- PASSPORTS (core entity)
-- ============================================================
CREATE TABLE public.passports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  product_id            uuid REFERENCES public.products(id),
  template_id           uuid REFERENCES public.passport_templates(id),

  -- Identity
  slug                  text UNIQUE,
  status                text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  wizard_step           integer DEFAULT 1,

  -- Step 1: Product Info
  product_name          text NOT NULL DEFAULT '',
  sku                   text,
  gtin                  text,
  batch_id              text,
  category              text,
  gender                text,
  size_range            text,
  colour                text,
  season                text,
  collection_name       text,
  product_description   text,
  product_url           text,
  primary_image_url     text,
  additional_image_urls text[] DEFAULT '{}',
  manufacturing_date    date,

  -- Step 4: Sustainability
  carbon_footprint_kg   numeric,
  water_usage_litres    numeric,
  sustainability_summary text,
  sustainability_claims  jsonb DEFAULT '[]',
  impact_data_source    text DEFAULT 'brand_declared' CHECK (impact_data_source IN ('verified', 'brand_declared', 'supplier_declared', 'ai_suggested')),

  -- Step 7: Story
  product_story         text,
  maker_story           text,
  brand_story           text,
  design_notes          text,
  brand_impact_statement text,
  consumer_transparency_summary text,
  video_url             text,
  designer_quote        text,
  gallery_image_urls    text[] DEFAULT '{}',

  -- Completeness
  completeness_score    integer DEFAULT 0,
  completeness_detail   jsonb DEFAULT '{}',

  -- Publishing
  published_at          timestamptz,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- ============================================================
-- PASSPORT SECTIONS (flexible additional content blocks)
-- ============================================================
CREATE TABLE public.passport_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text,
  content     jsonb NOT NULL DEFAULT '{}',
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- MATERIALS (shared library)
-- ============================================================
CREATE TABLE public.materials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  name          text NOT NULL,
  type          text,
  standard_name text,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCT MATERIALS (per-passport composition)
-- ============================================================
CREATE TABLE public.product_materials (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id          uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  material_id          uuid REFERENCES public.materials(id),
  material_name        text NOT NULL,
  percentage           numeric CHECK (percentage >= 0 AND percentage <= 100),
  recycled_content_pct numeric,
  bio_based_pct        numeric,
  fibre_origin         text,
  confidence_level     text DEFAULT 'brand_declared' CHECK (confidence_level IN ('verified', 'brand_declared', 'supplier_declared', 'ai_suggested', 'missing')),
  sort_order           integer DEFAULT 0,
  created_at           timestamptz DEFAULT now()
);

-- ============================================================
-- PASSPORT MATERIAL EXTRAS (dyeing, trims, restricted substances)
-- ============================================================
CREATE TABLE public.passport_material_extras (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id               uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  dyeing_notes              text,
  finishing_notes           text,
  restricted_substances_ok  boolean,
  animal_derived            boolean DEFAULT false,
  trim_notes                jsonb DEFAULT '{}',
  created_at                timestamptz DEFAULT now()
);

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE public.suppliers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name          text NOT NULL,
  country       text,
  website       text,
  contact_email text,
  verified      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- FACILITIES
-- ============================================================
CREATE TABLE public.facilities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id),
  name        text NOT NULL,
  type        text,
  country     text,
  city        text,
  address     text,
  latitude    numeric,
  longitude   numeric,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCT FACILITIES (supply chain tiers)
-- ============================================================
CREATE TABLE public.product_facilities (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id    uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  facility_id    uuid REFERENCES public.facilities(id),
  facility_name  text NOT NULL,
  tier           integer,
  process_stage  text,
  country        text,
  city           text,
  confidence_level text DEFAULT 'brand_declared' CHECK (confidence_level IN ('verified', 'brand_declared', 'supplier_declared', 'ai_suggested', 'missing')),
  sort_order     integer DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- ============================================================
-- CERTIFICATIONS (system reference table)
-- ============================================================
CREATE TABLE public.certifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  full_name   text,
  logo_url    text,
  description text,
  category    text,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCT CERTIFICATIONS
-- ============================================================
CREATE TABLE public.product_certifications (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id        uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  certification_id   uuid REFERENCES public.certifications(id),
  certification_name text NOT NULL,
  certificate_number text,
  issued_by          text,
  issued_at          date,
  expires_at         date,
  document_url       text,
  verification_url   text,
  claim_type         text,
  confidence_level   text DEFAULT 'brand_declared' CHECK (confidence_level IN ('verified', 'brand_declared', 'supplier_declared', 'ai_suggested', 'missing')),
  created_at         timestamptz DEFAULT now()
);

-- ============================================================
-- IMPACT METRICS
-- ============================================================
CREATE TABLE public.impact_metrics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id      uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  metric_key       text NOT NULL,
  metric_value     numeric,
  metric_unit      text,
  label            text,
  confidence_level text DEFAULT 'brand_declared' CHECK (confidence_level IN ('verified', 'brand_declared', 'supplier_declared', 'ai_suggested', 'missing')),
  evidence_url     text,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- CARE INSTRUCTIONS
-- ============================================================
CREATE TABLE public.care_instructions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('wash', 'dry', 'iron', 'bleach', 'dry_clean', 'storage', 'repair', 'warranty')),
  instruction text NOT NULL,
  icon_code   text,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- CIRCULARITY ACTIONS
-- ============================================================
CREATE TABLE public.circularity_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('repair', 'take_back', 'resale', 'recycle', 'donate')),
  title       text NOT NULL,
  description text,
  url         text,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- QR CODES
-- ============================================================
CREATE TABLE public.qr_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id  uuid NOT NULL REFERENCES public.passports(id) ON DELETE CASCADE,
  brand_id     uuid NOT NULL REFERENCES public.brands(id),
  label        text DEFAULT 'Default',
  target_url   text NOT NULL,
  style_config jsonb DEFAULT '{}',
  is_active    boolean DEFAULT true,
  scan_count   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ============================================================
-- SCANS
-- ============================================================
CREATE TABLE public.scans (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id   uuid REFERENCES public.qr_codes(id),
  passport_id  uuid NOT NULL REFERENCES public.passports(id),
  brand_id     uuid NOT NULL REFERENCES public.brands(id),
  ip_hash      text,
  user_agent   text,
  device_type  text CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
  country_code text,
  referrer     text,
  scanned_at   timestamptz DEFAULT now()
);

-- ============================================================
-- DATA CONNECTIONS
-- ============================================================
CREATE TABLE public.data_connections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id       uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  type           text NOT NULL,
  status         text DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'coming_soon')),
  config         jsonb DEFAULT '{}',
  last_synced_at timestamptz,
  created_at     timestamptz DEFAULT now()
);

-- ============================================================
-- AI GENERATION LOGS
-- ============================================================
CREATE TABLE public.ai_generation_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id          uuid NOT NULL REFERENCES public.brands(id),
  passport_id       uuid REFERENCES public.passports(id),
  user_id           uuid REFERENCES public.users(id),
  provider          text NOT NULL,
  model             text NOT NULL,
  prompt_tokens     integer,
  completion_tokens integer,
  input_text        text,
  output_json       jsonb,
  created_at        timestamptz DEFAULT now()
);

-- ============================================================
-- FILES
-- ============================================================
CREATE TABLE public.files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id     uuid NOT NULL REFERENCES public.brands(id),
  passport_id  uuid REFERENCES public.passports(id),
  storage_path text NOT NULL,
  public_url   text NOT NULL,
  filename     text NOT NULL,
  mime_type    text,
  file_size    integer,
  purpose      text CHECK (purpose IN ('product_image', 'cert_document', 'gallery', 'brand_logo', 'other')),
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES public.organisations(id),
  user_id         uuid REFERENCES public.users(id),
  action          text NOT NULL,
  resource_type   text,
  resource_id     uuid,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_passports_brand_id ON public.passports(brand_id);
CREATE INDEX idx_passports_slug ON public.passports(slug);
CREATE INDEX idx_passports_status ON public.passports(status);
CREATE INDEX idx_product_materials_passport_id ON public.product_materials(passport_id);
CREATE INDEX idx_product_facilities_passport_id ON public.product_facilities(passport_id);
CREATE INDEX idx_product_certifications_passport_id ON public.product_certifications(passport_id);
CREATE INDEX idx_care_instructions_passport_id ON public.care_instructions(passport_id);
CREATE INDEX idx_circularity_actions_passport_id ON public.circularity_actions(passport_id);
CREATE INDEX idx_qr_codes_passport_id ON public.qr_codes(passport_id);
CREATE INDEX idx_scans_passport_id ON public.scans(passport_id);
CREATE INDEX idx_scans_brand_id ON public.scans(brand_id);
CREATE INDEX idx_scans_scanned_at ON public.scans(scanned_at);
CREATE INDEX idx_audit_logs_organisation_id ON public.audit_logs(organisation_id);
CREATE INDEX idx_organisation_members_user_id ON public.organisation_members(user_id);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.passports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
