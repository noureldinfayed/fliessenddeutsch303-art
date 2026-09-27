"use client";

import * as XLSX from "xlsx-js-style";

export type ExcelRow = Record<string, string | number | boolean | null | undefined>;

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

export function pick(row: ExcelRow, keys: string[]) {
  const entry = Object.entries(row).find(([key]) => keys.map(normalizeKey).includes(normalizeKey(key)));
  return entry?.[1];
}

export function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value.replace(/,/g, "")) || 0;
  return 0;
}

export function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") return ["yes", "true", "1", "y", "later", "اجل", "نعم"].includes(value.trim().toLowerCase());
  return false;
}

export async function readExcel(file: File): Promise<ExcelRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" });
}

type ExportExcelOptions = {
  widths?: number[];
  rowFill?: (row: ExcelRow, index: number) => string | undefined;
};

export function exportExcel(filename: string, rows: ExcelRow[], sheetName = "Sheet1", options: ExportExcelOptions = {}) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  if (options.widths) worksheet["!cols"] = options.widths.map((wch) => ({ wch }));
  worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "A1");
  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: column })];
    if (cell) cell.s = { fill: { fgColor: { rgb: "1B4332" } }, font: { bold: true, color: { rgb: "FFFFFF" } }, alignment: { vertical: "center", horizontal: "center", wrapText: true } };
  }
  if (options.rowFill) {
    rows.forEach((row, index) => {
      const fill = options.rowFill?.(row, index);
      if (!fill) return;
      const sheetRow = index + 1;
      for (let column = range.s.c; column <= range.e.c; column += 1) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: sheetRow, c: column })];
        if (cell) cell.s = { fill: { fgColor: { rgb: fill } }, alignment: { vertical: "center", horizontal: "left", wrapText: true } };
      }
    });
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
