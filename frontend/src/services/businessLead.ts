// src/services/businessLeadService.ts
import { Business, SearchRequest } from '@/lib/types';
import { GooglePlacesService } from './googlePlaces';

export class BusinessLeadService {
  private placesService: GooglePlacesService;
  
  constructor(apiKey: string) {
    this.placesService = new GooglePlacesService(apiKey);
  }
  
  async searchBusinesses(request: SearchRequest): Promise<Business[]> {
    const { keyword, location, radius, max_results } = request;
    
    // Enhance location with better context (e.g., "Ontario" -> "Ontario, Canada")
    const enhancedLocation = this.enhanceLocationForSearch(location);
    
    // Determine if this is a large area search
    const isLargeAreaSearch = this.isLargeArea(location, radius || 5000);
    
    if (isLargeAreaSearch) {
      console.log(`Using text search for large area: ${location} -> ${enhancedLocation}`);
      // Use text search for large areas like provinces, countries, or large radius
      return await this.placesService.searchBusinessesByText(
        keyword,
        enhancedLocation,
        max_results
      );
    }
    
    // For specific cities/small areas, try geocode + nearby search first
    const coordinates = await this.placesService.geocodeLocation(enhancedLocation);
    if (coordinates) {
      console.log(`Using nearby search for specific location: ${location} -> ${enhancedLocation}`);
      return await this.placesService.searchNearbyBusinesses(
        keyword,
        coordinates,
        radius,
        max_results
      );
    }
    
    // Fallback to text search if geocoding fails
    console.log(`Falling back to text search for: ${location} -> ${enhancedLocation}`);
    return await this.placesService.searchBusinessesByText(
      keyword,
      enhancedLocation,
      max_results
    );
  }
  
  private isLargeArea(location: string, radius: number): boolean {
    const lowerLocation = location.toLowerCase().trim();
    
    // Large geographical areas that should use text search
    const largeAreaKeywords = [
      // Countries
      'canada', 'united states', 'usa', 'america', 'mexico', 'australia', 'uk', 'england',
      // Canadian provinces/territories - exact matches preferred
      'ontario', 'quebec', 'british columbia', 'alberta', 'manitoba', 'saskatchewan',
      'nova scotia', 'new brunswick', 'newfoundland', 'prince edward island',
      'northwest territories', 'nunavut', 'yukon', 'bc', 'ont',
      // US states
      'california', 'texas', 'florida', 'new york', 'pennsylvania', 'illinois',
      'ohio', 'georgia', 'north carolina', 'michigan', 'new jersey', 'virginia',
      'washington', 'arizona', 'massachusetts', 'tennessee', 'indiana', 'missouri',
      'maryland', 'wisconsin', 'colorado', 'minnesota', 'south carolina', 'alabama',
      'louisiana', 'kentucky', 'oregon', 'oklahoma', 'connecticut', 'utah', 'iowa',
      'nevada', 'arkansas', 'mississippi', 'kansas', 'new mexico', 'nebraska',
      'west virginia', 'idaho', 'hawaii', 'new hampshire', 'maine', 'montana',
      'rhode island', 'delaware', 'south dakota', 'north dakota', 'alaska', 'vermont', 'wyoming',
      // Regions
      'region', 'county', 'province', 'state', 'territory'
    ];
    
    // Special handling for common ambiguous locations
    const isExactProvinceMatch = lowerLocation === 'ontario' || 
                                lowerLocation === 'quebec' || 
                                lowerLocation === 'alberta' ||
                                lowerLocation === 'british columbia' ||
                                lowerLocation === 'bc';
    
    // Check if location contains large area keywords
    const hasLargeAreaKeyword = largeAreaKeywords.some(keyword => 
      lowerLocation.includes(keyword)
    );
    
    // Check if radius is large (> 25km suggests wide area search)
    const hasLargeRadius = radius > 25000;
    
    return isExactProvinceMatch || hasLargeAreaKeyword || hasLargeRadius;
  }
  
  private enhanceLocationForSearch(location: string): string {
    const lowerLocation = location.toLowerCase().trim();
    
    // Add country context for common provinces to avoid ambiguity
    const provinceMap: Record<string, string> = {
      'ontario': 'Ontario, Canada',
      'quebec': 'Quebec, Canada', 
      'alberta': 'Alberta, Canada',
      'british columbia': 'British Columbia, Canada',
      'bc': 'British Columbia, Canada',
      'manitoba': 'Manitoba, Canada',
      'saskatchewan': 'Saskatchewan, Canada',
      'nova scotia': 'Nova Scotia, Canada',
      'new brunswick': 'New Brunswick, Canada',
      'newfoundland': 'Newfoundland, Canada',
      'prince edward island': 'Prince Edward Island, Canada'
    };
    
    // If it's a known province without country context, add it
    if (provinceMap[lowerLocation]) {
      return provinceMap[lowerLocation];
    }
    
    return location;
  }
}