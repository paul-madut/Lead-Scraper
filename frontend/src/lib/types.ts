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