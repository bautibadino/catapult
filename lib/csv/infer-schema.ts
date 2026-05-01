import { z } from "zod";

export const GpsMetricsSchema = z.object({
  dur: z.number().min(0).default(0),
  dist: z.number().min(0).default(0),
  m_min: z.number().min(0).default(0),
  z3: z.number().min(0).default(0),
  z4: z.number().min(0).default(0),
  z5: z.number().min(0).default(0),
  top_speed: z.number().min(0).default(0),
  a23: z.number().min(0).default(0),
  a34: z.number().min(0).default(0),
  a4: z.number().min(0).default(0),
  d23: z.number().min(0).default(0),
  d34: z.number().min(0).default(0),
  d4: z.number().min(0).default(0),
  max_acc: z.number().min(0).default(0),
  max_dec: z.number().min(0).default(0),
  pl: z.number().min(0).default(0),
});

export type ValidatedGpsMetrics = z.infer<typeof GpsMetricsSchema>;

export function parseNumeric(value: string | undefined | null): number {
  if (value === undefined || value === null || value.trim() === "") return 0;
  const cleaned = value.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function inferSchema(columns: string[]) {
  const numericColumns: string[] = [];
  const textColumns: string[] = [];

  for (const col of columns) {
    const lower = col.toLowerCase();
    if (
      lower.includes("dist") ||
      lower.includes("speed") ||
      lower.includes("acc") ||
      lower.includes("dec") ||
      lower.includes("load") ||
      lower.includes("min") ||
      lower.includes("dur") ||
      lower.includes("z3") ||
      lower.includes("z4") ||
      lower.includes("z5") ||
      lower.includes("pl") ||
      lower.includes("m/min")
    ) {
      numericColumns.push(col);
    } else {
      textColumns.push(col);
    }
  }

  return { numericColumns, textColumns };
}
