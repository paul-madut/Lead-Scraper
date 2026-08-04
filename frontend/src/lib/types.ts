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
