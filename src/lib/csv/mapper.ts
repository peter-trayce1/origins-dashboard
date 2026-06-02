export interface ColumnMapping {
  csvColumn: string;
  passportField: string;
}

export interface ColumnSuggestion extends ColumnMapping {
  confidence: number; // 0–1
  matchedAlias: string;
}

export interface PassportField {
  key: string;
  label: string;
  required: boolean;
  group: "core" | "ids" | "impact" | "story" | "compound";
  hint?: string;
}

export const PASSPORT_FIELDS: PassportField[] = [
  // Core
  { key: "product_name",               label: "Product Name",               required: true,  group: "core" },
  { key: "product_description",        label: "Product Description",        required: false, group: "core" },
  { key: "category",                   label: "Category",                   required: false, group: "core" },
  { key: "collection_name",            label: "Collection",                 required: false, group: "core" },
  { key: "season",                     label: "Season",                     required: false, group: "core" },
  { key: "country_of_origin",          label: "Country of Origin",          required: false, group: "core" },
  { key: "product_weight_g",           label: "Product Weight (g)",         required: false, group: "core" },
  { key: "product_lifetime_years",     label: "Product Lifetime (Years)",   required: false, group: "core" },
  { key: "product_url",                label: "Product URL",                required: false, group: "core" },
  { key: "primary_image_url",          label: "Primary Image URL",          required: false, group: "core" },
  { key: "gender",                     label: "Gender",                     required: false, group: "core" },
  { key: "colour",                     label: "Colour",                     required: false, group: "core" },
  { key: "size_range",                 label: "Size Range",                 required: false, group: "core" },

  // Identifiers
  { key: "gtin",                       label: "GTIN / Barcode",             required: false, group: "ids" },
  { key: "internal_product_reference", label: "Internal Product Reference", required: false, group: "ids", hint: "Stored as internal SKU. Not shown publicly." },

  // Story
  { key: "product_story",              label: "Product Story",              required: false, group: "story" },
  { key: "sustainability_summary",     label: "Sustainability Summary",     required: false, group: "story" },

  // Impact
  { key: "carbon_footprint_kg",        label: "Carbon Footprint (kg CO₂e)", required: false, group: "impact" },
  { key: "water_usage_litres",         label: "Water Usage (litres)",       required: false, group: "impact" },

  // Compound — parsed into related records
  { key: "material_composition",       label: "Material Composition",       required: false, group: "compound", hint: 'e.g. "98% Organic Cotton; 2% Elastane"' },
  { key: "factory_name",               label: "Factory Name",               required: false, group: "compound", hint: "Tier 1 manufacturer name" },
  { key: "certifications",             label: "Certifications",             required: false, group: "compound", hint: 'e.g. "GOTS; OEKO-TEX; GRS"' },
  { key: "care_instructions",          label: "Care Instructions",          required: false, group: "compound", hint: 'e.g. "Machine wash 30°C; Do not tumble dry"' },
];

// ── Alias map for AI-style column recognition ─────────────────────────────────

const FIELD_ALIASES: Record<string, string[]> = {
  product_name: [
    "product name", "product title", "name", "title", "style name", "style", "item name", "item", "product", "article name", "model name", "model",
  ],
  product_description: [
    "product description", "description", "desc", "item description", "full description", "long description", "body", "details", "product details",
  ],
  category: [
    "category", "product category", "type", "product type", "class", "product class", "department", "group",
  ],
  collection_name: [
    "collection", "collection name", "range", "line", "product line", "collection range",
  ],
  season: [
    "season", "season name", "season code", "drop", "drop name",
  ],
  country_of_origin: [
    "country of origin", "country", "origin", "made in", "manufactured in", "produced in", "coo", "production country", "manufacturing country",
  ],
  product_weight_g: [
    "weight", "product weight", "weight (g)", "weight g", "weight grams", "gram weight", "grams",
  ],
  product_lifetime_years: [
    "product lifetime", "lifetime", "lifespan", "expected lifespan", "product lifespan", "lifetime (years)", "expected lifetime",
  ],
  product_url: [
    "product url", "url", "link", "product link", "website", "page url", "product page", "shop link",
  ],
  primary_image_url: [
    "primary image url", "image url", "image", "photo url", "photo", "image link", "main image", "thumbnail url",
  ],
  gender: ["gender", "sex", "target gender"],
  colour: ["colour", "color", "color name", "colourway"],
  size_range: ["size range", "size", "sizes", "size guide"],
  gtin: [
    "gtin", "gtin / barcode", "barcode", "ean", "ean13", "ean-13", "upc", "upc-a", "barcode number", "product barcode",
  ],
  internal_product_reference: [
    "internal product reference", "internal reference", "internal ref", "ref", "reference", "product ref",
    "sku", "style number", "article number", "item number", "product number", "style no", "art no",
  ],
  product_story: [
    "product story", "story", "product narrative", "narrative", "brand story", "about", "product history",
  ],
  sustainability_summary: [
    "sustainability summary", "sustainability", "sustainability statement", "green claims", "eco summary",
    "environmental summary", "environmental claims", "impact statement",
  ],
  carbon_footprint_kg: [
    "carbon footprint", "carbon footprint (kg co₂e)", "carbon", "co2", "co2e", "emissions", "carbon emissions",
    "carbon footprint kg", "ghg emissions", "greenhouse gas",
  ],
  water_usage_litres: [
    "water usage", "water usage (litres)", "water", "water consumption", "litres", "liters", "water footprint",
  ],
  material_composition: [
    "material composition", "material", "materials", "fabric", "fabric composition", "composition", "content",
    "fibre content", "fiber content", "fibre composition", "fabric content", "material content",
  ],
  factory_name: [
    "factory name", "factory", "manufacturer", "manufacturer name", "supplier", "supplier name",
    "made by", "produced by", "vendor", "production facility", "tier 1 factory",
  ],
  certifications: [
    "certifications", "certification", "certificates", "certs", "cert", "standards", "accreditations",
    "labels", "eco labels",
  ],
  care_instructions: [
    "care instructions", "care", "washing instructions", "wash instructions", "care label",
    "care guide", "laundering", "care & washing",
  ],
};

// ── Confidence scoring ────────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function autoMapColumns(csvHeaders: string[]): ColumnSuggestion[] {
  const suggestions: ColumnSuggestion[] = [];
  const usedFields = new Set<string>();

  for (const header of csvHeaders) {
    const normHeader = normalise(header);
    let bestField = "";
    let bestConfidence = 0;
    let bestAlias = "";

    for (const [fieldKey, aliases] of Object.entries(FIELD_ALIASES)) {
      if (usedFields.has(fieldKey)) continue;

      for (const alias of aliases) {
        const normAlias = normalise(alias);
        let confidence = 0;

        if (normHeader === normAlias) {
          confidence = 1.0;
        } else if (normHeader === normalise(fieldKey)) {
          confidence = 0.95;
        } else if (normAlias === normHeader) {
          confidence = 1.0;
        } else if (normHeader.startsWith(normAlias) || normAlias.startsWith(normHeader)) {
          confidence = 0.85;
        } else if (normHeader.includes(normAlias) || normAlias.includes(normHeader)) {
          confidence = 0.75;
        }

        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestField = fieldKey;
          bestAlias = alias;
        }
      }
    }

    if (bestConfidence >= 0.75) {
      suggestions.push({
        csvColumn: header,
        passportField: bestField,
        confidence: bestConfidence,
        matchedAlias: bestAlias,
      });
      usedFields.add(bestField);
    } else {
      // Suggest but don't auto-map low-confidence matches
      suggestions.push({
        csvColumn: header,
        passportField: "",
        confidence: bestConfidence,
        matchedAlias: bestAlias,
      });
    }
  }

  return suggestions;
}

export function applyMapping(
  rows: Record<string, string>[],
  mappings: ColumnMapping[]
): Record<string, string>[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const { csvColumn, passportField } of mappings) {
      if (row[csvColumn] !== undefined) {
        mapped[passportField] = row[csvColumn];
      }
    }
    return mapped;
  });
}
