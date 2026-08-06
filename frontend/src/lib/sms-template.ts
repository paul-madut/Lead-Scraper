// lib/sms-template.ts
// Merge-field rendering and opt-out enforcement for outbound SMS. Cold texts
// that look mass-produced get filtered by carriers and ignored by people, so
// personalization matters; and 10DLC/CTIA rules require an opt-out path on the
// messages we send. Both are applied at send time from the contact record.

export interface TemplateContact {
  name: string;
  companyName?: string | null;
  phone?: string | null;
  address?: string | null;
}

/** Merge fields an author can use in a sequence SMS body. */
export const SUPPORTED_MERGE_FIELDS = [
  "business_name",
  "company",
  "city",
  "phone",
] as const;

/** Best-effort city from a "street, city, region postal, country" address. */
export function cityFromAddress(address: string | null | undefined): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim());
  // parts[1] is the city in the standard Places format; guard short arrays.
  return parts.length >= 2 ? parts[1] : "";
}

function valueFor(field: string, c: TemplateContact): string {
  switch (field.toLowerCase()) {
    case "business_name":
    case "name":
      return c.name ?? "";
    case "company":
      return c.companyName || c.name || "";
    case "city":
      return cityFromAddress(c.address);
    case "phone":
      return c.phone ?? "";
    default:
      return "";
  }
}

/**
 * Replace {{field}} tokens from the contact. Known fields are substituted;
 * unknown tokens are stripped (never shipped literally). Collapses the double
 * spaces that stripping can leave behind.
 */
export function renderTemplate(body: string, c: TemplateContact): string {
  return body
    .replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_m, field: string) =>
      valueFor(field, c)
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const OPT_OUT_SUFFIX = "Reply STOP to opt out.";

/** Ensure a message carries an opt-out path (idempotent, case-insensitive). */
export function ensureOptOut(body: string): string {
  if (/\bstop\b/i.test(body)) return body;
  const trimmed = body.trimEnd();
  const sep = /[.!?]$/.test(trimmed) ? " " : ". ";
  return `${trimmed}${sep}${OPT_OUT_SUFFIX}`;
}

/** Tokens present in a body that are not supported merge fields (for the UI). */
export function unknownMergeFields(body: string): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi)) {
    const field = m[1].toLowerCase();
    if (
      !SUPPORTED_MERGE_FIELDS.includes(
        field as (typeof SUPPORTED_MERGE_FIELDS)[number]
      ) &&
      field !== "name"
    ) {
      found.add(field);
    }
  }
  return [...found];
}
