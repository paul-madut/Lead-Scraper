// src/app/api/search/route.ts
import { NextResponse } from 'next/server';
import { BusinessLeadService } from '@/services/businessLead';
import { SearchRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }
    
    // Parse the request body
    const data: SearchRequest = await request.json();
    
    // Validate the request
    if (!data.keyword || !data.location) {
      return NextResponse.json(
        { error: 'Keyword and location are required' },
        { status: 400 }
      );
    }
    
    // Create the service and search for businesses
    const leadService = new BusinessLeadService(apiKey);
    const businesses = await leadService.searchBusinesses({
      keyword: data.keyword,
      location: data.location,
      radius: data.radius || 5000,
      max_results: data.max_results || 20
    });
    
    // Return the results
    return NextResponse.json({
      businesses,
      count: businesses.length
    });
    
  } catch (error) {
    console.error('Error processing search request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}