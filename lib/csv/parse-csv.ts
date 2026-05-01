import Papa from "papaparse";

export function parseCSV(fileContent: string): { data: Record<string, string>[]; errors: Papa.ParseError[]; meta: Papa.ParseMeta } {
  const result = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.trim(),
  });

  return {
    data: result.data,
    errors: result.errors,
    meta: result.meta,
  };
}

export function csvPreview(fileContent: string, limit = 5): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    preview: limit,
    dynamicTyping: false,
  });
  return result.data;
}
