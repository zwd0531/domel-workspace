import { z } from "zod";
import { IMPORT_DATASETS, type ImportDataset, type ImportRow, type ImportValidation } from "@/domain/admin/types";

const shared = {
  plant_code: z.string().trim().min(1).max(40),
  product_code: z.string().trim().min(1).max(80),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, "Use YYYY-MM-01."),
};

const nonNegative = z.coerce.number().finite().min(0).max(1_000_000_000);
const nonNegativeInteger = nonNegative.int();
const percentage = z.union([z.literal(""), z.coerce.number().finite().min(0).max(100)]).transform((value) => value === "" ? null : value);
const currency = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);

const schemas = {
  sales: z.object({
    ...shared,
    order_count: nonNegativeInteger,
    shipped_units: nonNegativeInteger,
    unit_price: nonNegative,
    currency,
  }),
  production: z.object({
    ...shared,
    planned_units: nonNegativeInteger,
    produced_units: nonNegativeInteger,
    on_time_rate: percentage,
  }),
  quality: z.object({
    ...shared,
    tested_units: nonNegativeInteger,
    passed_units: nonNegativeInteger,
    field_returns: nonNegativeInteger,
    defect_rate: percentage,
    risk: z.enum(["Low", "Medium", "High"]),
    quality_note: z.string().trim().max(2_000).transform((value) => value || null),
  }).refine((row) => row.passed_units <= row.tested_units, {
    path: ["passed_units"],
    message: "Passed units cannot exceed tested units.",
  }),
  costs: z.object({
    ...shared,
    unit_variable_cost: nonNegative,
    monthly_fixed_cost: nonNegative,
    currency,
  }),
} satisfies Record<ImportDataset, z.ZodType<ImportRow>>;

export const IMPORT_DEFINITIONS: Record<ImportDataset, { label: string; headers: string[]; template: string }> = {
  sales: {
    label: "Monthly sales",
    headers: ["plant_code", "product_code", "month", "order_count", "shipped_units", "unit_price", "currency"],
    template: "/templates/monthly-sales.csv",
  },
  production: {
    label: "Monthly production",
    headers: ["plant_code", "product_code", "month", "planned_units", "produced_units", "on_time_rate"],
    template: "/templates/monthly-production.csv",
  },
  quality: {
    label: "Monthly quality",
    headers: ["plant_code", "product_code", "month", "tested_units", "passed_units", "field_returns", "defect_rate", "risk", "quality_note"],
    template: "/templates/monthly-quality.csv",
  },
  costs: {
    label: "Monthly costs",
    headers: ["plant_code", "product_code", "month", "unit_variable_cost", "monthly_fixed_cost", "currency"],
    template: "/templates/monthly-costs.csv",
  },
};

export function isImportDataset(value: string): value is ImportDataset {
  return (IMPORT_DATASETS as readonly string[]).includes(value);
}

export function validateImportCsv(dataset: ImportDataset, text: string): ImportValidation {
  const errors: string[] = [];
  let matrix: string[][];
  try {
    matrix = parseCsv(text.replace(/^\uFEFF/, ""));
  } catch (error) {
    return { dataset, headers: [], rows: [], errors: [error instanceof Error ? error.message : "The CSV file is invalid."] };
  }

  const nonEmpty = matrix.filter((row) => row.some((cell) => cell.trim() !== ""));
  if (!nonEmpty.length) return { dataset, headers: [], rows: [], errors: ["The CSV file is empty."] };

  const headers = nonEmpty[0].map((header) => header.trim().toLowerCase());
  const expected = IMPORT_DEFINITIONS[dataset].headers;
  const missing = expected.filter((header) => !headers.includes(header));
  const unknown = headers.filter((header) => !expected.includes(header));
  if (new Set(headers).size !== headers.length) errors.push("Header names must be unique.");
  if (missing.length) errors.push(`Missing columns: ${missing.join(", ")}.`);
  if (unknown.length) errors.push(`Unexpected columns: ${unknown.join(", ")}.`);
  if (errors.length) return { dataset, headers, rows: [], errors };

  const dataRows = nonEmpty.slice(1);
  if (!dataRows.length) errors.push("The CSV file contains no data rows.");
  if (dataRows.length > 500) errors.push("A single import can contain at most 500 rows.");

  const rows: ImportRow[] = [];
  const keys = new Set<string>();
  dataRows.slice(0, 500).forEach((cells, index) => {
    const line = index + 2;
    if (cells.length !== headers.length) {
      errors.push(`Row ${line}: expected ${headers.length} cells but found ${cells.length}.`);
      return;
    }
    const raw = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex].trim()]));
    const parsed = schemas[dataset].safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push(`Row ${line}, ${issue.path.join(".") || "record"}: ${issue.message}`);
      return;
    }
    const key = `${parsed.data.plant_code}\u0000${parsed.data.product_code}\u0000${parsed.data.month}`;
    if (keys.has(key)) {
      errors.push(`Row ${line}: duplicate plant, product and month in this file.`);
      return;
    }
    keys.add(key);
    rows.push(parsed.data);
  });

  return { dataset, headers, rows, errors };
}

function parseCsv(text: string): string[][] {
  if (text.includes("\u0000")) throw new Error("The CSV file contains an invalid null character.");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell === "") {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }

  if (quoted) throw new Error("The CSV file has an unclosed quoted cell.");
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
