// lib/export.ts - single CSV exporter for leads.
import type { Business } from "@/lib/types";

function escapeCsvField(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADERS = [
  "Name",
  "Address",
  "Phone",
  "Website",
  "Rating",
  "Reviews",
  "Google Maps",
] as const;

export function businessesToCsv(businesses: Business[]): string {
  const rows = businesses.map((b) =>
    [
      b.name,
      b.address,
      b.phone ?? "",
      b.website ?? "",
      b.rating ?? "",
      b.total_reviews ?? "",
      b.maps_url ?? "",
    ]
      .map(escapeCsvField)
      .join(",")
  );
  return [HEADERS.join(","), ...rows].join("\n");
}

export function downloadLeadsCsv(businesses: Business[], filename = "leads.csv"): void {
  const csv = businessesToCsv(businesses);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
