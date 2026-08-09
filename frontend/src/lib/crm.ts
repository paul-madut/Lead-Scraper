// lib/crm.ts - CRM constants and helpers shared client + server.
import type { Business, CallStatus } from "@/lib/types";

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

// --- Call-blitz disposition (separate from the sales pipeline) ---
export interface CallStatusOption {
  id: CallStatus;
  label: string;
  tone: "muted" | "default" | "secondary" | "success";
}

export const CALL_STATUSES: CallStatusOption[] = [
  { id: "todo", label: "To call", tone: "muted" },
  { id: "called", label: "Called", tone: "secondary" },
  { id: "no_answer", label: "No answer", tone: "muted" },
  { id: "callback", label: "Callback", tone: "default" },
  { id: "not_interested", label: "Not interested", tone: "muted" },
  { id: "booked", label: "Booked", tone: "success" },
];

export const DEFAULT_CALL_STATUS: CallStatus = "todo";

export function callStatusLabel(id: string): string {
  return CALL_STATUSES.find((s) => s.id === id)?.label ?? id;
}

export function callStatusTone(id: string): CallStatusOption["tone"] {
  return CALL_STATUSES.find((s) => s.id === id)?.tone ?? "muted";
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
