import { PASSPORT_FIELDS } from "./mapper";

export interface ValidationResult {
  rowIndex: number;
  errors: string[];
}

export function validateRows(
  mappedRows: Record<string, string>[]
): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (let i = 0; i < mappedRows.length; i++) {
    const row = mappedRows[i];
    const errors: string[] = [];

    for (const field of PASSPORT_FIELDS) {
      if (field.required && !row[field.key]?.trim()) {
        errors.push(`${field.label} is required`);
      }
    }

    if (row.carbon_footprint_kg && isNaN(parseFloat(row.carbon_footprint_kg))) {
      errors.push("Carbon Footprint must be a number");
    }
    if (row.water_usage_litres && isNaN(parseFloat(row.water_usage_litres))) {
      errors.push("Water Usage must be a number");
    }
    if (row.product_weight_g && isNaN(parseFloat(row.product_weight_g))) {
      errors.push("Product Weight must be a number");
    }
    if (row.product_lifetime_years && isNaN(parseFloat(row.product_lifetime_years))) {
      errors.push("Product Lifetime must be a number");
    }
    if (row.product_url && !isValidUrl(row.product_url)) {
      errors.push("Product URL must be a valid URL (include https://)");
    }
    if (row.primary_image_url && !isValidUrl(row.primary_image_url)) {
      errors.push("Primary Image URL must be a valid URL (include https://)");
    }

    if (errors.length > 0) {
      results.push({ rowIndex: i, errors });
    }
  }

  return results;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
