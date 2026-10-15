"use client";

import type { TableRow } from "@/types/dashboard";

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function csvEscape(value: unknown) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function downloadCSV(scope: string, rows: TableRow[]) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter((key) => key !== "actions");
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => csvEscape(row[key])).join(","))].join("\n");
  downloadBlob(`oswell-${scope}-${dateStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

export function downloadJSON(scope: string, rows: TableRow[]) {
  downloadBlob(`oswell-${scope}-${dateStamp()}.json`, new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }));
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export async function copyJSON(value: unknown) {
  await copyText(JSON.stringify(value, null, 2));
}
