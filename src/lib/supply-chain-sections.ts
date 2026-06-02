export interface SectionField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'date' | 'number' | 'select' | 'textarea' | 'file' | 'multi_checkbox';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  hint?: string;
  unit?: string;
}

export interface SectionConfig {
  id: string;
  label: string;
  description: string;
  optional?: boolean;
  repeating?: boolean;
  addLabel?: string;
  fields: SectionField[];
  mapsTo: string;
}

const COUNTRIES = [
  "Bangladesh", "Belgium", "Brazil", "Cambodia", "China", "Denmark",
  "England", "Ethiopia", "France", "Germany", "India", "Indonesia", "Italy",
  "Japan", "Morocco", "Northern Ireland", "Pakistan", "Peru", "Portugal", "Romania",
  "Scotland", "Spain", "Sri Lanka", "Sweden", "Thailand", "Turkey", "United Kingdom",
  "United States", "Vietnam", "Wales", "Other",
];

const PROCESSES = [
  "Cutting", "Sewing", "Assembly", "Washing", "Dyeing", "Finishing", "Packaging",
];

export const TIER1_SECTIONS: SectionConfig[] = [
  {
    id: "factory_info",
    label: "Factory Information",
    description: "Your factory's contact details and location",
    mapsTo: "supply_chain",
    fields: [
      { id: "factory_name",  label: "Factory name",    type: "text",   required: true,  placeholder: "e.g. Atelier Silva" },
      { id: "contact_name",  label: "Contact name",    type: "text",   required: true,  placeholder: "e.g. Maria Santos" },
      { id: "contact_email", label: "Contact email",   type: "email",  required: true,  placeholder: "maria@factory.com" },
      { id: "country",       label: "Country",         type: "select", required: true,  options: COUNTRIES },
      { id: "city",          label: "City / region",   type: "text",   placeholder: "e.g. Porto" },
      { id: "address",       label: "Street address",  type: "text",   placeholder: "e.g. Rua das Flores 12" },
      { id: "website",       label: "Website",         type: "url",    placeholder: "https://factory.com" },
    ],
  },
  {
    id: "manufacturing_info",
    label: "Manufacturing Information",
    description: "Details about the product being manufactured",
    mapsTo: "product_info",
    fields: [
      { id: "product_name",          label: "Product name",           type: "text", placeholder: "As you know it" },
      { id: "style_id",              label: "Style ID / SKU",         type: "text", placeholder: "e.g. VS-SS25-001" },
      { id: "manufacturing_date",    label: "Manufacturing date",      type: "date" },
      { id: "country_of_manufacture",label: "Country of manufacture", type: "select", options: COUNTRIES },
    ],
  },
  {
    id: "materials",
    label: "Materials & Composition",
    description: "The materials used to make this product (percentages must total 100%)",
    mapsTo: "materials",
    repeating: true,
    addLabel: "Add another material",
    fields: [
      { id: "material_name",    label: "Material name",    type: "text",   required: true, placeholder: "e.g. Organic Cotton" },
      { id: "composition_pct",  label: "Composition %",    type: "number", required: true, placeholder: "e.g. 60" },
      { id: "supplier_name",    label: "Supplier / mill",  type: "text",   placeholder: "e.g. Albini Group" },
      { id: "country_of_origin",label: "Country of origin",type: "select", options: COUNTRIES },
    ],
  },
  {
    id: "trims",
    label: "Trims & Components",
    description: "Details of any trims, fasteners or packaging",
    mapsTo: "materials_trims",
    fields: [
      { id: "buttons",   label: "Buttons / fastenings", type: "text", placeholder: "e.g. Natural horn buttons" },
      { id: "zips",      label: "Zips",                 type: "text", placeholder: "e.g. YKK brass zip" },
      { id: "labels",    label: "Labels",               type: "text", placeholder: "e.g. Woven organic cotton" },
      { id: "packaging", label: "Packaging",            type: "text", placeholder: "e.g. Recycled card, no plastic" },
    ],
  },
  {
    id: "processes",
    label: "Manufacturing Processes",
    description: "Which processes does your facility perform on this product?",
    mapsTo: "supply_chain",
    fields: [
      { id: "processes", label: "Select all that apply", type: "multi_checkbox", options: PROCESSES },
    ],
  },
  {
    id: "certifications",
    label: "Certifications",
    description: "Any certifications your facility or this product holds",
    mapsTo: "certifications",
    repeating: true,
    addLabel: "Add another certification",
    fields: [
      { id: "certification_name",  label: "Certification",         type: "text", required: true, placeholder: "e.g. GOTS, OEKO-TEX" },
      { id: "certificate_number",  label: "Certificate number",    type: "text", placeholder: "e.g. CU890768" },
      { id: "issue_date",          label: "Issue date",            type: "date" },
      { id: "expiry_date",         label: "Expiry date",           type: "date" },
      { id: "document_url",        label: "Certificate document",  type: "file", hint: "PDF or image" },
    ],
  },
  {
    id: "chemical_compliance",
    label: "Chemical & Compliance",
    description: "Compliance declarations for this product",
    mapsTo: "materials",
    fields: [
      { id: "reach_compliant", label: "REACH compliant — no SVHCs above threshold",     type: "multi_checkbox", options: ["Yes"] },
      { id: "no_pfas",         label: "No PFAS / fluorochemical treatments used",        type: "multi_checkbox", options: ["Yes"] },
      { id: "animal_derived",  label: "Contains animal-derived materials (wool, leather, etc.)", type: "multi_checkbox", options: ["Yes"] },
    ],
  },
  {
    id: "care",
    label: "Care Instructions",
    description: "How should customers care for this product?",
    mapsTo: "care",
    fields: [
      { id: "washing", label: "Washing instructions", type: "text", placeholder: "e.g. Machine wash 30°C gentle cycle" },
      { id: "drying",  label: "Drying instructions",  type: "text", placeholder: "e.g. Line dry in shade" },
      { id: "ironing", label: "Ironing instructions", type: "text", placeholder: "e.g. Iron on low heat" },
      { id: "storage", label: "Storage instructions", type: "text", placeholder: "e.g. Store in a cool, dry place" },
    ],
  },
  {
    id: "sustainability",
    label: "Sustainability Information",
    description: "Only complete if your facility tracks this data — every bit helps",
    mapsTo: "impact",
    optional: true,
    fields: [
      { id: "carbon_footprint",      label: "Carbon footprint",     type: "number", unit: "kg CO₂e", placeholder: "e.g. 3.2", hint: "Per garment, if known" },
      { id: "water_use",             label: "Water use",            type: "number", unit: "litres",  placeholder: "e.g. 2700", hint: "Per garment, if known" },
      { id: "energy_use",            label: "Energy use",           type: "number", unit: "kWh",     placeholder: "e.g. 8.4",  hint: "Per garment, if known" },
      { id: "renewable_energy_pct",  label: "Renewable energy %",   type: "number", unit: "%",       placeholder: "e.g. 40" },
    ],
  },
];

export function getSectionConfig(id: string): SectionConfig | undefined {
  return TIER1_SECTIONS.find((s) => s.id === id);
}

// Analyse a passport's current state and suggest which sections are missing
export function detectMissingSections(passport: {
  country_of_origin?: string | null;
  sku?: string | null;
  product_facilities?: unknown[];
  product_materials?: unknown[];
  product_certifications?: unknown[];
  product_care_instructions?: unknown[];
}): string[] {
  const missing: string[] = [];

  if (!passport.product_facilities?.length) missing.push("factory_info");
  if (!passport.country_of_origin || !passport.sku) missing.push("manufacturing_info");
  if (!passport.product_materials?.length) missing.push("materials");
  if (!passport.product_certifications?.length) missing.push("certifications");
  if (!passport.product_care_instructions?.length) missing.push("care");

  return missing;
}
