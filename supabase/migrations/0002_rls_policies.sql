-- OriginsID: Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_material_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circularity_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: get brand IDs accessible to the current user
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_brand_ids()
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT b.id
  FROM public.brands b
  INNER JOIN public.organisation_members om ON om.organisation_id = b.organisation_id
  WHERE om.user_id = auth.uid()
    AND om.accepted_at IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.user_organisation_ids()
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT organisation_id
  FROM public.organisation_members
  WHERE user_id = auth.uid()
    AND accepted_at IS NOT NULL
$$;

-- ============================================================
-- USERS
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ============================================================
-- ORGANISATIONS
-- ============================================================
CREATE POLICY "Members can view own organisation"
  ON public.organisations FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_organisation_ids()));

CREATE POLICY "Users can insert organisation during onboarding"
  ON public.organisations FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update organisation"
  ON public.organisations FOR UPDATE TO authenticated
  USING (id IN (
    SELECT organisation_id FROM public.organisation_members
    WHERE user_id = auth.uid() AND role = 'admin' AND accepted_at IS NOT NULL
  ));

-- ============================================================
-- ORGANISATION MEMBERS
-- ============================================================
CREATE POLICY "Members can view own membership rows"
  ON public.organisation_members FOR SELECT TO authenticated
  USING (
    organisation_id IN (SELECT public.user_organisation_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert self during onboarding"
  ON public.organisation_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert new members"
  ON public.organisation_members FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id IN (
      SELECT organisation_id FROM public.organisation_members
      WHERE user_id = auth.uid() AND role = 'admin' AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Admins can update member roles"
  ON public.organisation_members FOR UPDATE TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM public.organisation_members
      WHERE user_id = auth.uid() AND role = 'admin' AND accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Members can accept own invite"
  ON public.organisation_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- BRANDS
-- ============================================================
CREATE POLICY "Members can view own brands"
  ON public.brands FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_brand_ids()));

CREATE POLICY "Members can insert brands in own org"
  ON public.brands FOR INSERT TO authenticated
  WITH CHECK (
    organisation_id IN (SELECT public.user_organisation_ids())
  );

CREATE POLICY "Admins can update brands"
  ON public.brands FOR UPDATE TO authenticated
  USING (id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE POLICY "Members can manage own collections"
  ON public.collections FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()))
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE POLICY "Members can manage own products"
  ON public.products FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()))
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- PASSPORTS
-- ============================================================
CREATE POLICY "Members can view own passports"
  ON public.passports FOR SELECT TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()));

CREATE POLICY "Members can insert passports"
  ON public.passports FOR INSERT TO authenticated
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

CREATE POLICY "Members can update own passports"
  ON public.passports FOR UPDATE TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()));

CREATE POLICY "Members can delete own passports"
  ON public.passports FOR DELETE TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()));

-- Public can view published passports (for /p/[slug] pages)
CREATE POLICY "Public can view published passports"
  ON public.passports FOR SELECT TO anon
  USING (status = 'published');

-- ============================================================
-- PASSPORT SECTIONS
-- ============================================================
CREATE POLICY "Members can manage own passport sections"
  ON public.passport_sections FOR ALL TO authenticated
  USING (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())))
  WITH CHECK (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())));

CREATE POLICY "Public can view published passport sections"
  ON public.passport_sections FOR SELECT TO anon
  USING (passport_id IN (SELECT id FROM public.passports WHERE status = 'published'));

-- ============================================================
-- PASSPORT TEMPLATES
-- ============================================================
CREATE POLICY "Members can view public and own templates"
  ON public.passport_templates FOR SELECT TO authenticated
  USING (is_public = true OR brand_id IN (SELECT public.user_brand_ids()) OR brand_id IS NULL);

CREATE POLICY "Members can manage own templates"
  ON public.passport_templates FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()))
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- MATERIALS
-- ============================================================
CREATE POLICY "Members can manage own materials"
  ON public.materials FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()) OR brand_id IS NULL)
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- PRODUCT MATERIALS
-- ============================================================
CREATE POLICY "Members can manage own product materials"
  ON public.product_materials FOR ALL TO authenticated
  USING (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())))
  WITH CHECK (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())));

CREATE POLICY "Public can view published product materials"
  ON public.product_materials FOR SELECT TO anon
  USING (passport_id IN (SELECT id FROM public.passports WHERE status = 'published'));

-- ============================================================
-- PASSPORT MATERIAL EXTRAS
-- ============================================================
CREATE POLICY "Members can manage own material extras"
  ON public.passport_material_extras FOR ALL TO authenticated
  USING (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())))
  WITH CHECK (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())));

CREATE POLICY "Public can view published material extras"
  ON public.passport_material_extras FOR SELECT TO anon
  USING (passport_id IN (SELECT id FROM public.passports WHERE status = 'published'));

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE POLICY "Members can manage own suppliers"
  ON public.suppliers FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()))
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- FACILITIES
-- ============================================================
CREATE POLICY "Members can manage own facilities"
  ON public.facilities FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()))
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- PRODUCT FACILITIES
-- ============================================================
CREATE POLICY "Members can manage own product facilities"
  ON public.product_facilities FOR ALL TO authenticated
  USING (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())))
  WITH CHECK (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())));

CREATE POLICY "Public can view published product facilities"
  ON public.product_facilities FOR SELECT TO anon
  USING (passport_id IN (SELECT id FROM public.passports WHERE status = 'published'));

-- ============================================================
-- CERTIFICATIONS (public reference table)
-- ============================================================
CREATE POLICY "Anyone can view certifications"
  ON public.certifications FOR SELECT
  USING (true);

-- ============================================================
-- PRODUCT CERTIFICATIONS
-- ============================================================
CREATE POLICY "Members can manage own product certifications"
  ON public.product_certifications FOR ALL TO authenticated
  USING (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())))
  WITH CHECK (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())));

CREATE POLICY "Public can view published product certifications"
  ON public.product_certifications FOR SELECT TO anon
  USING (passport_id IN (SELECT id FROM public.passports WHERE status = 'published'));

-- ============================================================
-- IMPACT METRICS
-- ============================================================
CREATE POLICY "Members can manage own impact metrics"
  ON public.impact_metrics FOR ALL TO authenticated
  USING (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())))
  WITH CHECK (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())));

CREATE POLICY "Public can view published impact metrics"
  ON public.impact_metrics FOR SELECT TO anon
  USING (passport_id IN (SELECT id FROM public.passports WHERE status = 'published'));

-- ============================================================
-- CARE INSTRUCTIONS
-- ============================================================
CREATE POLICY "Members can manage own care instructions"
  ON public.care_instructions FOR ALL TO authenticated
  USING (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())))
  WITH CHECK (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())));

CREATE POLICY "Public can view published care instructions"
  ON public.care_instructions FOR SELECT TO anon
  USING (passport_id IN (SELECT id FROM public.passports WHERE status = 'published'));

-- ============================================================
-- CIRCULARITY ACTIONS
-- ============================================================
CREATE POLICY "Members can manage own circularity actions"
  ON public.circularity_actions FOR ALL TO authenticated
  USING (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())))
  WITH CHECK (passport_id IN (SELECT id FROM public.passports WHERE brand_id IN (SELECT public.user_brand_ids())));

CREATE POLICY "Public can view published circularity actions"
  ON public.circularity_actions FOR SELECT TO anon
  USING (passport_id IN (SELECT id FROM public.passports WHERE status = 'published'));

-- ============================================================
-- QR CODES
-- ============================================================
CREATE POLICY "Members can manage own QR codes"
  ON public.qr_codes FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()))
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

CREATE POLICY "Public can view active QR codes"
  ON public.qr_codes FOR SELECT TO anon
  USING (is_active = true);

-- ============================================================
-- SCANS
-- ============================================================
CREATE POLICY "Members can view own scans"
  ON public.scans FOR SELECT TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()));

-- Anyone can record a scan (QR scan tracking)
CREATE POLICY "Anyone can record a scan"
  ON public.scans FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can record a scan"
  ON public.scans FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- DATA CONNECTIONS
-- ============================================================
CREATE POLICY "Members can manage own data connections"
  ON public.data_connections FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()))
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- AI GENERATION LOGS
-- ============================================================
CREATE POLICY "Members can view own AI logs"
  ON public.ai_generation_logs FOR SELECT TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()));

CREATE POLICY "Members can insert AI logs"
  ON public.ai_generation_logs FOR INSERT TO authenticated
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- FILES
-- ============================================================
CREATE POLICY "Members can manage own files"
  ON public.files FOR ALL TO authenticated
  USING (brand_id IN (SELECT public.user_brand_ids()))
  WITH CHECK (brand_id IN (SELECT public.user_brand_ids()));

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE POLICY "Members can view own org audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (organisation_id IN (SELECT public.user_organisation_ids()));

CREATE POLICY "Members can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (organisation_id IN (SELECT public.user_organisation_ids()));
