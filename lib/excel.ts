import * as XLSX from "xlsx";

/**
 * Reads an uploaded Excel file into a 2D array of raw cell strings, matching
 * the reference app's client-side SheetJS approach (header:1, defval:'').
 */
export function readSheetAsRows(buffer: ArrayBuffer): string[][] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  return raw.map((row) => row.map((cell) => String(cell).trim()));
}

/**
 * Scans the first `maxScanRows` rows for a header row whose cells match the
 * given alias map (lowercased), and returns the header row index plus a
 * column-index -> field-name map. Returns null if no row matches at least
 * one of `requiredFields`.
 */
export function detectHeaderRow(
  rows: string[][],
  aliasMap: Record<string, string>,
  requiredFields: string[],
  maxScanRows = 10
): { headerRowIndex: number; colMap: Record<number, string> } | null {
  const scanLimit = Math.min(rows.length, maxScanRows);
  for (let ri = 0; ri < scanLimit; ri++) {
    const headerCells = rows[ri].map((h) => h.toLowerCase().trim());
    const colMap: Record<number, string> = {};
    headerCells.forEach((h, i) => {
      const field = aliasMap[h];
      if (field) colMap[i] = field;
    });
    const mappedFields = Object.values(colMap);
    if (requiredFields.every((f) => mappedFields.includes(f))) {
      return { headerRowIndex: ri, colMap };
    }
  }
  return null;
}

export function extractDataRows(
  rows: string[][],
  headerRowIndex: number,
  colMap: Record<number, string>
): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((c) => c.trim() === "")) continue;
    const obj: Record<string, string> = {};
    Object.entries(colMap).forEach(([idx, field]) => {
      obj[field] = (row[Number(idx)] ?? "").trim();
    });
    out.push(obj);
  }
  return out;
}

/** Builds a UTF-8 BOM-prefixed CSV string from row objects, Excel-safe. */
export function buildCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escapeCell = (value: unknown): string => {
    const v = (value ?? "").toString();
    const needsQuotes = v.includes(",") || v.includes('"') || v.includes("\n");
    const escaped = v.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  return "﻿" + lines.join("\n");
}
