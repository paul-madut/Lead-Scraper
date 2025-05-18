import { AuthError } from "firebase/auth";
export type Business = {
  name: string;
  address: string;
  phone: string;
  website?: string;
  maps_url?: string;
  place_id: string;
  business_status?: string;
  total_reviews?: number;
  image_url?: string;
  rating?: number;
};

export interface SearchResponse {
  businesses: Business[];
  count: number;
}

export interface SearchRequest {
  keyword: string;
  location: string;
  radius: number;
  max_results: number;
}

export interface AuthContextType {
  user: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<any>;
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
  timestamp: any; 
  resultCount: number;
  results: Business[];
}

export interface TokenCheckRequest {
  requestedTokens: number;
}

export interface TokenCheckResponse {
  sufficient: boolean;
  currentBalance: number;
  requested: number;
}

export interface TokenDeductRequest {
  tokensToDeduct: number;
  searchParams: SearchQuery;
}

export interface TokenDeductResponse {
  success: boolean;
  newBalance: number;
}

export interface TokenHistoryEntry {
  amount: number;
  timestamp: Date;
  type: string;
  details: {
    keyword: string;
    location: string;
    radius: number;
    max_results: number;
  };
  resultsFound?: number;
}
export interface UserTokenData {
  tokens: number;
  tokenHistory?: TokenHistoryEntry[];
}