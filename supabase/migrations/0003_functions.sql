-- Helper function to get accessible brand IDs for the current user
create or replace function public.user_brand_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select b.id
  from brands b
  join organisation_members om on om.organisation_id = b.organisation_id
  where om.user_id = auth.uid()
    and om.accepted_at is not null;
$$;

-- Function to handle new user signup — creates user profile record
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger fires on every new auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to auto-update updated_at timestamps
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to mutable tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'organisations', 'brands', 'passports', 'products', 'materials',
    'suppliers', 'facilities', 'certifications', 'qr_codes', 'data_connections', 'files'
  ] loop
    execute format(
      'drop trigger if exists set_updated_at on %I; ' ||
      'create trigger set_updated_at before update on %I ' ||
      'for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end;
$$;

-- Trigger to keep qr_codes.scan_count in sync when a scan is inserted
create or replace function public.increment_qr_scan_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.qr_code_id is not null then
    update public.qr_codes
    set scan_count = scan_count + 1,
        updated_at = now()
    where id = new.qr_code_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_scan_inserted on public.scans;
create trigger on_scan_inserted
  after insert on public.scans
  for each row
  execute function public.increment_qr_scan_count();

-- Completeness score calculation (called from application layer, but kept here for reference)
-- Required: product_name(10), brand_id(10), sku(8), primary_image_url(10), product_description(8),
--           product_materials.count>0(12), product_facilities.count>0(10), care_instructions.count>0(8), slug(4)
-- Recommended: certifications(5), sustainability_summary(4), circularity_actions(4), product_story(2), suppliers(5)

-- System certifications seed
insert into certifications (name, full_name, category, description) values
  ('GOTS', 'Global Organic Textile Standard', 'organic', 'The leading standard for organic fibres, including ecological and social criteria across the entire textile supply chain.'),
  ('OEKO-TEX 100', 'OEKO-TEX Standard 100', 'safety', 'Tests for harmful substances — every component of the article has been tested for harmful substances.'),
  ('GRS', 'Global Recycled Standard', 'recycled', 'Verifies recycled content and chain of custody across the supply chain.'),
  ('Fair Trade', 'Fair Trade Certified', 'social', 'Ensures fair wages and safe conditions for farmers and workers.'),
  ('European Flax', 'European Flax', 'origin', 'Certifies flax grown in Western Europe without irrigation or pesticides.'),
  ('Bluesign', 'Bluesign Approved', 'environmental', 'Restricts harmful substances and promotes resource efficiency in textile manufacturing.'),
  ('Cradle to Cradle', 'Cradle to Cradle Certified', 'circular', 'Assesses products for safe, circular, and responsibly made credentials.'),
  ('EU Ecolabel', 'EU Ecolabel', 'environmental', 'The European Union''s voluntary label for products with a reduced environmental footprint.'),
  ('B Corp', 'Certified B Corporation', 'social', 'Certifies companies that meet high standards of verified social and environmental performance.'),
  ('RDS', 'Responsible Down Standard', 'animal_welfare', 'Ensures responsible treatment of ducks and geese from which down and feathers are sourced.')
on conflict (name) do nothing;
