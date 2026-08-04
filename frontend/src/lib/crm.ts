// lib/crm.ts - CRM constants and helpers shared client + server.
import type { Business } from "@/lib/types";

export interface PipelineStage {
  id: string;
  label: string;
  /** Tailwind badge tone for the stage chip. */
  tone: "muted" | "default" | "secondary" | "success";
}

// Fixed default pipeline for now; becomes per-workspace configurable later.
export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "new", label: "New", tone: "muted" },
  { id: "contacted", label: "Contacted", tone: "secondary" },
  { id: "interested", label: "Interested", tone: "default" },
  { id: "qualified", label: "Qualified", tone: "default" },
  { id: "won", label: "Won", tone: "success" },
  { id: "lost", label: "Lost", tone: "muted" },
];

export const DEFAULT_STAGE = "new";

export function stageLabel(id: string): string {
  return PIPELINE_STAGES.find((s) => s.id === id)?.label ?? id;
}

export function stageTone(id: string): PipelineStage["tone"] {
  return PIPELINE_STAGES.find((s) => s.id === id)?.tone ?? "muted";
}

/** Shape a scraped Business into the contact fields (server + client share this). */
export function contactFieldsFromBusiness(business: Business) {
  return {
    name: business.name,
    companyName: business.name,
    phone: business.phone ?? null,
    email: null as string | null,
    website: business.website ?? null,
    address: business.address ?? null,
    source: "scrape" as const,
    placeId: business.place_id,
    rating: business.rating ?? null,
    totalReviews: business.total_reviews ?? null,
  };
}
