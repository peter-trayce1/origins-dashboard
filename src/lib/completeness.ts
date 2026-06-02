import type { Database } from "./supabase/types";

type Passport = Database["public"]["Tables"]["passports"]["Row"];

interface CompletenessResult {
  score: number;
  label: string;
  detail: {
    required: { key: string; label: string; met: boolean; weight: number }[];
    recommended: { key: string; label: string; met: boolean; weight: number }[];
  };
  canPublish: boolean;
}

interface PassportWithRelations extends Passport {
  product_materials?: { id: string }[];
  product_facilities?: { id: string }[];
  care_instructions?: { id: string }[];
  product_certifications?: { id: string }[];
  circularity_actions?: { id: string }[];
}

const REQUIRED_FIELDS = [
  { key: "product_name", label: "Product name", weight: 10 },
  { key: "brand_id", label: "Brand", weight: 10 },
  { key: "primary_image_url", label: "Product image", weight: 10 },
  { key: "product_description", label: "Product description", weight: 8 },
  { key: "materials", label: "Material composition", weight: 12 },
  { key: "origin", label: "Country of origin", weight: 10 },
  { key: "care", label: "Care instructions", weight: 8 },
  { key: "slug", label: "Public URL slug", weight: 4 },
];

const RECOMMENDED_FIELDS = [
  { key: "supplier", label: "Supplier / Facility", weight: 5 },
  { key: "certifications", label: "Certifications", weight: 5 },
  { key: "sustainability_summary", label: "Sustainability summary", weight: 4 },
  { key: "circularity", label: "Circularity action", weight: 4 },
  { key: "product_story", label: "Product story", weight: 2 },
];

export function calculateCompleteness(passport: PassportWithRelations): CompletenessResult {
  const requiredDetail = REQUIRED_FIELDS.map((field) => {
    let met = false;
    switch (field.key) {
      case "product_name":
        met = Boolean(passport.product_name && passport.product_name.trim().length > 0);
        break;
      case "brand_id":
        met = Boolean(passport.brand_id);
        break;
      case "primary_image_url":
        met = Boolean(passport.primary_image_url);
        break;
      case "product_description":
        met = Boolean(passport.product_description && passport.product_description.length > 20);
        break;
      case "materials":
        met = (passport.product_materials?.length ?? 0) > 0;
        break;
      case "origin":
        met = (passport.product_facilities?.length ?? 0) > 0;
        break;
      case "care":
        met = (passport.care_instructions?.length ?? 0) > 0;
        break;
      case "slug":
        met = Boolean(passport.slug);
        break;
    }
    return { ...field, met };
  });

  const recommendedDetail = RECOMMENDED_FIELDS.map((field) => {
    let met = false;
    switch (field.key) {
      case "supplier":
        met = (passport.product_facilities?.length ?? 0) > 0;
        break;
      case "certifications":
        met = (passport.product_certifications?.length ?? 0) > 0;
        break;
      case "sustainability_summary":
        met = Boolean(passport.sustainability_summary && passport.sustainability_summary.length > 20);
        break;
      case "circularity":
        met = (passport.circularity_actions?.length ?? 0) > 0;
        break;
      case "product_story":
        met = Boolean(passport.product_story && passport.product_story.length > 20);
        break;
    }
    return { ...field, met };
  });

  const requiredScore = requiredDetail
    .filter((f) => f.met)
    .reduce((sum, f) => sum + f.weight, 0);
  const recommendedScore = recommendedDetail
    .filter((f) => f.met)
    .reduce((sum, f) => sum + f.weight, 0);

  const score = requiredScore + recommendedScore;

  let label: string;
  if (score < 40) label = "Needs more information";
  else if (score < 70) label = "Getting there";
  else if (score < 90) label = "Ready to publish";
  else label = "Best-in-class passport";

  const canPublish = requiredDetail.filter((f) => !f.met).length === 0;

  return {
    score,
    label,
    detail: { required: requiredDetail, recommended: recommendedDetail },
    canPublish,
  };
}
