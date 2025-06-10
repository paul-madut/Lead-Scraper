// app/api/search/route.ts - Fixed to properly import admin services
import { NextResponse, NextRequest } from 'next/server';
import { BusinessLeadService } from '@/services/businessLead';
import { AdminTokenService } from '@/services/adminTokenService';

interface SearchRequest {
  keyword: string;
  location: string;
  radius?: number;
  max_results?: number;
}

interface SearchResponse {
  success: boolean;
  businesses: any[];
  meta: {
    query: string;
    location: string;
    radius: number;
    max_results: number;
    results_count: number;
    tokens_charged: number;
    remaining_tokens: number;
    cost_breakdown: {
      base_cost: number;
      per_result_cost: number;
      actual_results: number;
      total_cost: number;
    };
  };
}

interface ErrorResponse {
  error: string;
  currentTokens?: number;
  requiredTokens?: number;
}

// Pricing configuration
const PRICING_CONFIG = {
  BASE_SEARCH_COST: 1,
  COST_PER_RESULT: 1,
  MIN_CHARGE: 5,
  MAX_RESULTS_LIMIT: 100
};

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse | ErrorResponse>> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract the ID token
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token using Admin SDK
    let decodedToken;
    try {
      // Dynamic import to ensure it only runs on server
      const { adminAuth } = await import('@/lib/firebase-admin');
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId: string = decodedToken.uid;

    // Parse the request body
    const data: SearchRequest = await request.json();

    // Validate inputs
    if (!data.keyword || !data.location) {
      return NextResponse.json(
        { error: 'Missing required parameters: keyword and location are required' },
        { status: 400 }
      );
    }

    // Validate and sanitize numeric inputs
    const maxResults: number = Math.min(
      Math.max(parseInt(String(data.max_results)) || 20, 1), 
      PRICING_CONFIG.MAX_RESULTS_LIMIT
    );
    const radius: number = Math.min(Math.max(parseInt(String(data.radius)) || 5000, 100), 50000);

    // Check token balance using Admin SDK
    let currentTokens: number;
    try {
      currentTokens = await AdminTokenService.getTokenBalance(userId);
    } catch (tokenError) {
      console.error('Failed to get token balance:', tokenError);
      return NextResponse.json(
        { error: 'Failed to validate token balance' },
        { status: 500 }
      );
    }

    // Calculate estimated cost
    const estimatedCost = Math.max(
      PRICING_CONFIG.BASE_SEARCH_COST + (maxResults * PRICING_CONFIG.COST_PER_RESULT),
      PRICING_CONFIG.MIN_CHARGE
    );
    
    // Pre-flight token check
    if (currentTokens < estimatedCost) {
      return NextResponse.json({
        error: `Insufficient tokens. You have ${currentTokens} tokens but need at least ${estimatedCost} tokens for this search (up to ${maxResults} results).`,
        currentTokens,
        requiredTokens: estimatedCost
      }, { status: 403 });
    }

    // Get the API key from environment variables
    const apiKey: string | undefined = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key not configured');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 500 }
      );
    }

    // Create the service and search for businesses
    let businesses: any[];
    try {
      const leadService = new BusinessLeadService(apiKey);
      businesses = await leadService.searchBusinesses({
        keyword: data.keyword,
        location: data.location,
        radius: radius,
        max_results: maxResults
      });
    } catch (searchError) {
      console.error('Business search failed:', searchError);
      return NextResponse.json(
        { error: 'Failed to search for businesses. Please try again.' },
        { status: 500 }
      );
    }

    // Calculate actual cost based on results
    const actualResults: number = businesses?.length || 0;
    const actualCost = Math.max(
      PRICING_CONFIG.BASE_SEARCH_COST + (actualResults * PRICING_CONFIG.COST_PER_RESULT),
      PRICING_CONFIG.MIN_CHARGE
    );

    // Deduct tokens using Admin SDK
    let updatedTokens: number;
    try {
      updatedTokens = await AdminTokenService.deductTokens(userId, actualCost);
    } catch (deductError) {
      console.error('Failed to deduct tokens:', deductError);
      return NextResponse.json(
        { error: 'Failed to process token deduction. Please try again.' },
        { status: 500 }
      );
    }

    const response: SearchResponse = {
      success: true,
      businesses: businesses || [],
      meta: {
        query: data.keyword,
        location: data.location,
        radius: radius,
        max_results: maxResults,
        results_count: actualResults,
        tokens_charged: actualCost,
        remaining_tokens: updatedTokens,
        cost_breakdown: {
          base_cost: PRICING_CONFIG.BASE_SEARCH_COST,
          per_result_cost: PRICING_CONFIG.COST_PER_RESULT,
          actual_results: actualResults,
          total_cost: actualCost
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}