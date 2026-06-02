import Papa from "papaparse";

export interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  errors: string[];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        const errors = results.errors.map((e) => `Row ${e.row}: ${e.message}`);
        resolve({ headers, rows, rowCount: rows.length, errors });
      },
      error(err) {
        resolve({ headers: [], rows: [], rowCount: 0, errors: [err.message] });
      },
    });
  });
}

export function parseCSVText(text: string): ParseResult {
  const results = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return {
    headers: results.meta.fields ?? [],
    rows: results.data,
    rowCount: results.data.length,
    errors: results.errors.map((e) => `Row ${e.row}: ${e.message}`),
  };
}

// ── Compound field parsers ─────────────────────────────────────────────────────

export interface ParsedMaterial {
  name: string;
  percentage: number | null;
}

export function parseMaterials(value: string): ParsedMaterial[] {
  if (!value?.trim()) return [];
  return value
    .split(/;|,(?=\s*\d)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+(?:\.\d+)?)\s*%\s*(.+)$/);
      if (match) {
        return { percentage: parseFloat(match[1]), name: match[2].trim() };
      }
      // Try trailing percentage: "Organic Cotton 98%"
      const trailingMatch = part.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*%$/);
      if (trailingMatch) {
        return { percentage: parseFloat(trailingMatch[2]), name: trailingMatch[1].trim() };
      }
      return { percentage: null, name: part };
    });
}

export function parseSemicolonList(value: string): string[] {
  if (!value?.trim()) return [];
  return value
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type CareType = "wash" | "dry" | "iron" | "bleach" | "dry_clean" | "storage" | "repair" | "warranty";

export function inferCareType(instruction: string): CareType {
  const text = instruction.toLowerCase();
  if (text.includes("dry clean")) return "dry_clean";
  if (text.includes("bleach")) return "bleach";
  if (text.includes("iron")) return "iron";
  if (text.includes("tumble") || (text.includes("dry") && !text.includes("wash"))) return "dry";
  if (text.includes("store") || text.includes("storage")) return "storage";
  if (text.includes("repair") || text.includes("mend")) return "repair";
  return "wash";
}
