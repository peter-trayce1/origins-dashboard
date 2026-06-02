-- Seed: Verdana Studio (demo brand)
-- This seed creates a complete demo organisation for testing and demos.
-- All IDs are fixed UUIDs so the seed is idempotent.

-- Organisation
insert into organisations (id, name, slug, plan) values
  ('00000000-0000-0000-0000-000000000001', 'Verdana Studio', 'verdana-studio', 'pro')
on conflict (id) do nothing;

-- Brand
insert into brands (id, organisation_id, name, slug, website_url, sustainability_story, primary_colour) values
  (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Verdana Studio',
    'verdana-studio',
    'https://verdanastudio.com',
    'At Verdana Studio, we believe fashion should last. We work exclusively with certified organic and recycled fibres, partner with family-run factories in Europe where we can verify wages and working conditions firsthand, and design every piece to be repaired, not replaced. Transparency isn''t a marketing strategy — it''s how we hold ourselves accountable.',
    '#2D5016'
  )
on conflict (id) do nothing;

-- Suppliers
insert into suppliers (id, brand_id, name, country, website, contact_email) values
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Linhares & Filhos', 'PT', 'https://linhares.pt', null),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', 'Lanifício Joana', 'IT', null, null),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010', 'Belgian Flax Cooperative', 'BE', null, null)
on conflict (id) do nothing;

-- Facilities
insert into facilities (id, brand_id, supplier_id, name, type, country, city, latitude, longitude) values
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000022', 'Belgian Flax Fields', 'raw_material', 'BE', 'Kortrijk', 50.8290, 3.2650),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000022', 'Libeco-Lagae Mill', 'spinning_weaving', 'BE', 'Meulebeke', 50.9507, 3.2838),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'Linhares & Filhos Factory', 'cut_sew', 'PT', 'Braga', 41.5518, -8.4229),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000021', 'Lanifício Joana', 'spinning_weaving', 'IT', 'Prato', 43.8777, 11.1020),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'Verdana Studio HQ', 'design', 'PT', 'Lisbon', 38.7223, -9.1393)
on conflict (id) do nothing;

-- ============================================================
-- PASSPORT 1: The Linen Overshirt (published, score 94)
-- ============================================================
insert into passports (
  id, brand_id, slug, status, product_name, sku, category, collection_name,
  product_description, primary_image_url, carbon_footprint_kg, water_usage_litres,
  sustainability_summary, product_story, maker_story, designer_quote,
  consumer_transparency_summary, completeness_score, wizard_step
) values (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000010',
  'verdana-studio-linen-overshirt',
  'published',
  'The Linen Overshirt',
  'VS-LOS-001',
  'Tops',
  'The Quietude Collection — SS25',
  'A relaxed, slightly oversized overshirt in 100% Belgian Flax linen — the material that gets better with every wash. Cut for layering over a t-shirt or wearing open as a light jacket. Mother-of-pearl buttons. Raw hem finish. Made to last 10+ years.',
  'https://images.unsplash.com/photo-1594938298603-c8148c4b3685?w=800',
  1.2,
  340,
  '100% European Flax certified Belgian linen. Made at a family-run factory in Braga, Portugal — workers earn above the living wage. OEKO-TEX certified: no harmful dyes or finishes. Carbon footprint 1.2 kg CO₂e — 60% below industry average for comparable garments.',
  'This shirt began as a sketch on a Post-it note — a shirt you could wear at the farmers'' market on Saturday and a gallery opening on Saturday evening. We spent eight months working with Libeco-Lagae in Belgium and Linhares & Filhos in Portugal to get the weight and drape right. The result is a linen that feels broken-in from the first wear.',
  'Linhares & Filhos is a three-generation family business in Braga, northern Portugal. António, the current owner, started as a cutter aged 14 alongside his grandfather. Every Verdana piece that passes through their hands is sewn by workers who have been with the factory for an average of nine years.',
  'Linen is one of the most honest textiles. It''s uncomfortable when it''s pretending to be something it''s not, and extraordinary when you let it be itself.',
  'This shirt is made from Belgian Flax linen grown without irrigation or pesticides in the Normandy and Flanders regions. It was woven in Belgium and sewn in Portugal at a factory where we''ve visited and verified working conditions. It contains no harmful substances (OEKO-TEX certified) and is designed to last a decade.',
  94,
  8
) on conflict (id) do nothing;

-- Materials for Linen Overshirt
insert into product_materials (passport_id, material_name, percentage, recycled_content_pct, fibre_origin, confidence_level, sort_order) values
  ('00000000-0000-0000-0000-000000000100', 'Belgian Linen', 100, 0, 'Belgium / France (Normandy & Flanders)', 'verified', 1)
on conflict do nothing;

-- Facilities for Linen Overshirt
insert into product_facilities (passport_id, facility_id, facility_name, tier, process_stage, country, confidence_level, sort_order) values
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000030', 'Belgian Flax Fields', 1, 'Raw material', 'BE', 'verified', 1),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000031', 'Libeco-Lagae Mill', 2, 'Spinning & weaving', 'BE', 'verified', 2),
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000032', 'Linhares & Filhos Factory', 1, 'Cut & sew', 'PT', 'verified', 3)
on conflict do nothing;

-- Certifications for Linen Overshirt
insert into product_certifications (passport_id, certification_name, issued_by, confidence_level) values
  ('00000000-0000-0000-0000-000000000100', 'European Flax', 'European Flax Association', 'verified'),
  ('00000000-0000-0000-0000-000000000100', 'OEKO-TEX 100', 'OEKO-TEX Association', 'verified')
on conflict do nothing;

-- Impact metrics for Linen Overshirt
insert into impact_metrics (passport_id, metric_key, metric_value, metric_unit, label, confidence_level) values
  ('00000000-0000-0000-0000-000000000100', 'carbon_footprint', '1.2', 'kg CO₂e', 'Carbon footprint', 'brand_declared'),
  ('00000000-0000-0000-0000-000000000100', 'water_usage', '340', 'litres', 'Water usage', 'brand_declared'),
  ('00000000-0000-0000-0000-000000000100', 'industry_average_carbon', '3.1', 'kg CO₂e', 'Industry average', 'brand_declared')
on conflict do nothing;

-- Care instructions for Linen Overshirt
insert into care_instructions (passport_id, type, instruction, icon_code, sort_order) values
  ('00000000-0000-0000-0000-000000000100', 'wash', 'Machine wash 30°C or cooler', 'wash_30', 1),
  ('00000000-0000-0000-0000-000000000100', 'dry', 'Hang to dry — do not tumble dry', 'hang_dry', 2),
  ('00000000-0000-0000-0000-000000000100', 'iron', 'Iron on medium heat while slightly damp', 'iron_medium', 3),
  ('00000000-0000-0000-0000-000000000100', 'bleach', 'Do not bleach', 'no_bleach', 4)
on conflict do nothing;

-- Circularity actions for Linen Overshirt
insert into circularity_actions (passport_id, type, title, description, url) values
  ('00000000-0000-0000-0000-000000000100', 'repair', 'Free repair service', 'Send it back and we''ll repair any loose seams, missing buttons, or tears — free of charge, for the life of the garment.', 'https://verdanastudio.com/repair'),
  ('00000000-0000-0000-0000-000000000100', 'take_back', 'Take-back programme', 'When you''re done with it, send it back and we''ll rehome it or recycle it responsibly.', 'https://verdanastudio.com/returns')
on conflict do nothing;

-- QR code for Linen Overshirt
insert into qr_codes (id, passport_id, brand_id, label, target_url, is_active, scan_count) values
  ('00000000-0000-0000-0000-000000000200', '00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010', 'Swing tag', 'https://originsid.com/p/verdana-studio-linen-overshirt', true, 147)
on conflict (id) do nothing;

-- ============================================================
-- PASSPORT 2: The Recycled Wool Coat (published, score 89)
-- ============================================================
insert into passports (
  id, brand_id, slug, status, product_name, sku, category, collection_name,
  product_description, primary_image_url, carbon_footprint_kg, water_usage_litres,
  sustainability_summary, product_story, maker_story, consumer_transparency_summary,
  completeness_score, wizard_step
) values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000010',
  'verdana-studio-recycled-wool-coat',
  'published',
  'The Recycled Wool Coat',
  'VS-RWC-002',
  'Outerwear',
  'The Quietude Collection — SS25',
  'A structured, mid-length coat in 78% GRS-certified recycled wool and 22% GOTS organic cotton. The wool is recovered from post-consumer garments collected in Italy and respun at Lanifício Joana in Prato — the historic home of Italian recycled wool. Unlined for breathability. Designed to transition from autumn through spring.',
  'https://images.unsplash.com/photo-1539533018257-aef8e9f4f5c6?w=800',
  4.2,
  890,
  '78% GRS-certified recycled wool from Prato, Italy. By using recycled wool, this coat uses 90% less water than the equivalent virgin wool coat. GRS and GOTS certified. Made at Linhares & Filhos in Portugal.',
  'Prato has been recycling wool for 200 years. When the rest of the world was still throwing old clothes in landfill, Prato''s mills were quietly grinding them up and spinning them into new yarns. Lanifício Joana is part of that tradition — a fourth-generation mill that takes post-consumer wool garments and turns them into something new.',
  'Lanifício Joana in Prato has been in the Joana family since 1923. They collect used wool garments from charities, sort by colour and fibre type, shred them back to raw fibres, and re-spin into yarn — all without dyeing. The flecked, heathered finish is a natural result of this process.',
  'This coat is made from wool recovered from post-consumer garments in Italy, respun by a 100-year-old family mill in Prato. Using recycled wool requires 90% less water than virgin wool production. The coat is GRS and GOTS certified. It was cut and sewn at Linhares & Filhos in Portugal, a factory we visit twice yearly.',
  89,
  8
) on conflict (id) do nothing;

insert into product_materials (passport_id, material_name, percentage, recycled_content_pct, fibre_origin, confidence_level, sort_order) values
  ('00000000-0000-0000-0000-000000000101', 'Recycled Wool', 78, 100, 'Post-consumer, Italy (Prato region)', 'verified', 1),
  ('00000000-0000-0000-0000-000000000101', 'Organic Cotton', 22, 0, 'India (GOTS certified)', 'verified', 2)
on conflict do nothing;

insert into product_facilities (passport_id, facility_id, facility_name, tier, process_stage, country, confidence_level, sort_order) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000033', 'Lanifício Joana', 1, 'Fibre recovery & spinning', 'IT', 'verified', 1),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000032', 'Linhares & Filhos Factory', 1, 'Cut & sew', 'PT', 'verified', 2)
on conflict do nothing;

insert into product_certifications (passport_id, certification_name, issued_by, confidence_level) values
  ('00000000-0000-0000-0000-000000000101', 'GRS', 'Textile Exchange', 'verified'),
  ('00000000-0000-0000-0000-000000000101', 'GOTS', 'Global Standard gGmbH', 'verified')
on conflict do nothing;

insert into impact_metrics (passport_id, metric_key, metric_value, metric_unit, label, confidence_level) values
  ('00000000-0000-0000-0000-000000000101', 'carbon_footprint', '4.2', 'kg CO₂e', 'Carbon footprint', 'brand_declared'),
  ('00000000-0000-0000-0000-000000000101', 'water_savings', '90', '%', 'Water saved vs virgin wool', 'brand_declared'),
  ('00000000-0000-0000-0000-000000000101', 'water_usage', '890', 'litres', 'Water usage', 'brand_declared')
on conflict do nothing;

insert into care_instructions (passport_id, type, instruction, icon_code, sort_order) values
  ('00000000-0000-0000-0000-000000000101', 'wash', 'Hand wash or dry clean only', 'hand_wash', 1),
  ('00000000-0000-0000-0000-000000000101', 'dry', 'Dry flat away from direct heat', 'dry_flat', 2),
  ('00000000-0000-0000-0000-000000000101', 'iron', 'Do not iron', 'no_iron', 3),
  ('00000000-0000-0000-0000-000000000101', 'bleach', 'Do not bleach', 'no_bleach', 4)
on conflict do nothing;

insert into circularity_actions (passport_id, type, title, description, url) values
  ('00000000-0000-0000-0000-000000000101', 'repair', 'Free repair service', 'Bring or post it back — we''ll repair any damage free of charge.', 'https://verdanastudio.com/repair'),
  ('00000000-0000-0000-0000-000000000101', 'resale', 'Verdana pre-owned', 'When you''re ready to pass it on, list it on our authenticated pre-owned platform.', 'https://verdanastudio.com/preowned')
on conflict do nothing;

insert into qr_codes (id, passport_id, brand_id, label, target_url, is_active, scan_count) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', 'Swing tag', 'https://originsid.com/p/verdana-studio-recycled-wool-coat', true, 83)
on conflict (id) do nothing;

-- ============================================================
-- PASSPORT 3: The Organic Cotton Tee (draft, score ~61)
-- ============================================================
insert into passports (
  id, brand_id, slug, status, product_name, sku, category, collection_name,
  product_description, primary_image_url, sustainability_summary,
  completeness_score, wizard_step
) values (
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000010',
  'verdana-studio-organic-cotton-tee',
  'draft',
  'The Organic Cotton Tee',
  'VS-OCT-003',
  'Tops',
  'The Quietude Collection — SS25',
  'An unassuming everyday t-shirt in 100% GOTS certified organic cotton. Fitted through the body with a slightly longer back hem. The fabric is a 180gsm jersey — substantial enough to drape well, lightweight enough for summer.',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  'GOTS certified organic cotton. Supply chain and impact data still being collected.',
  61,
  5
) on conflict (id) do nothing;

insert into product_materials (passport_id, material_name, percentage, recycled_content_pct, confidence_level, sort_order) values
  ('00000000-0000-0000-0000-000000000102', 'Organic Cotton', 100, 0, 'verified', 1)
on conflict do nothing;

insert into product_certifications (passport_id, certification_name, issued_by, confidence_level) values
  ('00000000-0000-0000-0000-000000000102', 'GOTS', 'Global Standard gGmbH', 'verified')
on conflict do nothing;

insert into care_instructions (passport_id, type, instruction, icon_code, sort_order) values
  ('00000000-0000-0000-0000-000000000102', 'wash', 'Machine wash 30°C', 'wash_30', 1),
  ('00000000-0000-0000-0000-000000000102', 'dry', 'Hang to dry', 'hang_dry', 2)
on conflict do nothing;
