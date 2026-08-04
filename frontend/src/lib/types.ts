import type { AuthError, User } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";

export type Business = {
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  maps_url: string | null;
  place_id: string;
  business_status: string | null;
  total_reviews: number | null;
  /** Google Places photo reference; render via /api/photo?ref=... */
  photo_reference: string | null;
  rating: number | null;
};

export interface SearchRequest {
  keyword: string;
  location: string;
  radius: number;
  max_results: number;
  /** Optional client-generated key to make retries idempotent. */
  idempotencyKey?: string;
}

export interface CostBreakdown {
  base_cost: number;
  per_result_cost: number;
  new_results: number;
  total_cost: number;
}

export interface SearchMeta {
  query: string;
  location: string;
  radius: number;
  max_results: number;
  results_count: number;
  new_results: number;
  tokens_charged: number;
  remaining_tokens: number;
  /** More unseen leads remain in this area on a follow-up search. */
  has_more: boolean;
  /** Google has no further results for this keyword+area; stop searching. */
  area_exhausted: boolean;
  cost_breakdown: CostBreakdown;
}

export interface SearchResponse {
  success: boolean;
  businesses: Business[];
  meta: SearchMeta;
}

export interface SearchErrorResponse {
  error: string;
  currentTokens?: number;
  requiredTokens?: number;
}

/** Server-side pagination cursor, one per (user, normalized query). */
export interface SearchSessionDocument {
  userId: string;
  queryKey: string;
  keyword: string;
  location: string;
  radius: number;
  seenPlaceIds: string[];
  areaExhausted: boolean;
  lastIdempotencyKey?: string;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: AuthError | null;
}

export interface SearchQuery {
  id: string;
  userId: string;
  searchTerm: string;
  timestamp: Date;
  resultCount: number;
  results: Business[];
}

export interface SearchQueryDocument {
  userId: string;
  searchTerm: string;
  timestamp: Timestamp;
  resultCount: number;
  results: Business[];
}

export interface TokenBalanceResponse {
  success: boolean;
  balance: number;
  error?: string;
}

// --- CRM (Phase 0) ---

export type ConsentState = "unknown" | "granted" | "denied";

export interface Workspace {
  id: string;
  name: string;
  ownerUserId: string;
}

export interface Membership {
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member";
}

/** A CRM contact. Promoted from a scraped Business or created manually. */
export interface Contact {
  id: string;
  workspaceId: string;
  name: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  source: "scrape" | "manual" | "import";
  placeId: string | null;
  rating: number | null;
  totalReviews: number | null;
  tags: string[];
  stage: string;
  ownerId: string;
  // Compliance - carried from day one, not bolted on later.
  smsConsent: ConsentState;
  callConsent: ConsentState;
  dncCall: boolean;
  optOutSms: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date | null;
}

export type ActivityType =
  | "created"
  | "note"
  | "call"
  | "sms"
  | "email"
  | "stage_change"
  | "tag"
  | "consent";

/** Append-only timeline entry on a contact. */
export interface Activity {
  id: string;
  workspaceId: string;
  contactId: string;
  type: ActivityType;
  body: string;
  direction: "inbound" | "outbound" | null;
  createdBy: string;
  createdAt: Date;
}

// --- Messaging (Phase 1: SMS) ---

export type MessageDirection = "inbound" | "outbound";
export type MessageStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "undelivered"
  | "failed"
  | "received";

/** A phone number owned by a workspace, used to route inbound messages. */
export interface WorkspaceNumber {
  id: string; // E.164, doubles as the doc id
  workspaceId: string;
  phoneNumber: string;
  label: string | null;
  createdAt: Date;
}

/** One SMS thread between a workspace number and a contact/phone. */
export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string | null;
  channel: "sms";
  contactPhone: string;
  workspacePhone: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string;
  lastDirection: MessageDirection | null;
  unread: boolean;
}

export interface Message {
  id: string;
  workspaceId: string;
  conversationId: string;
  contactId: string | null;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  from: string;
  to: string;
  twilioSid: string | null;
  errorMessage: string | null;
  createdAt: Date;
}

// --- Calls (Phase 2) ---

export type CallOutcome =
  | "completed"
  | "no-answer"
  | "busy"
  | "failed"
  | "canceled";

export interface Call {
  id: string;
  workspaceId: string;
  contactId: string | null;
  direction: MessageDirection;
  from: string;
  to: string;
  outcome: CallOutcome;
  durationSec: number;
  twilioCallSid: string | null;
  createdBy: string;
  createdAt: Date;
}

// --- Sequences / flows (Phase 3) ---

export type SequenceStep =
  | { id: string; type: "sms"; body: string }
  | { id: string; type: "wait"; days: number }
  // Simple branch: if the contact has replied, jump to step `jumpTo`
  // (an index into steps, or -1 to exit); otherwise continue.
  | { id: string; type: "branch"; condition: "replied"; jumpTo: number };

export interface Sequence {
  id: string;
  workspaceId: string;
  name: string;
  status: "draft" | "active";
  stopOnReply: boolean;
  steps: SequenceStep[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EnrollmentStatus = "active" | "completed" | "stopped" | "failed";

export interface Enrollment {
  id: string;
  workspaceId: string;
  sequenceId: string;
  contactId: string;
  contactPhone: string;
  currentStep: number;
  status: EnrollmentStatus;
  startedAt: Date;
  nextRunAt: Date;
  lastError: string | null;
}
