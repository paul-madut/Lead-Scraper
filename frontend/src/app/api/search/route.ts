// app/api/search/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { BusinessLeadService } from '@/services/businessLead';
import { getTokenBalance, deductTokens } from '@/services/tokenService';
import { adminAuth } from '@/lib/firebase-admin';

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
    tokens_used: number;
    remaining_tokens: number;
  };
}

interface ErrorResponse {
  error: string;
  currentTokens?: number;
  requiredTokens?: number;
}

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
    
    // Verify the Firebase ID token
    let decodedToken;
    try {
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
    const maxResults: number = Math.min(Math.max(parseInt(String(data.max_results)) || 20, 1), 100);
    const radius: number = Math.min(Math.max(parseInt(String(data.radius)) || 5000, 100), 50000);

    // Check token balance
    let currentTokens: number;
    try {
      currentTokens = await getTokenBalance(userId);
    } catch (tokenError) {
      console.error('Failed to get token balance:', tokenError);
      return NextResponse.json(
        { error: 'Failed to validate token balance' },
        { status: 500 }
      );
    }

    // Calculate cost (assuming 1 token per result requested)
    const tokenCost: number = maxResults;
    
    if (currentTokens < tokenCost) {
      return NextResponse.json({
        error: `Insufficient tokens. You have ${currentTokens} tokens but need ${tokenCost} tokens for this search.`,
        currentTokens,
        requiredTokens: tokenCost
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

    // Deduct tokens based on the cost model (charge for the request, not just results)
    const actualResults: number = businesses?.length || 0;
    const tokensToDeduct: number = tokenCost;
    
    if (tokensToDeduct > 0) {
      try {
        await deductTokens(userId, tokensToDeduct);
      } catch (deductError) {
        console.error('Failed to deduct tokens:', deductError);
        return NextResponse.json(
          { error: 'Failed to process token deduction. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Get updated token balance
    let updatedTokens: number;
    try {
      updatedTokens = await getTokenBalance(userId);
    } catch (balanceError) {
      console.error('Failed to get updated balance:', balanceError);
      updatedTokens = currentTokens - tokensToDeduct; // Fallback calculation
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
        tokens_used: tokensToDeduct,
        remaining_tokens: updatedTokens
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
