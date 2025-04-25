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
    
    // Option 1: Geocode + Nearby Search
    const coordinates = await this.placesService.geocodeLocation(location);
    if (coordinates) {
      return await this.placesService.searchNearbyBusinesses(
        keyword,
        coordinates,
        radius,
        max_results
      );
    }
    
    // Option 2: Fallback to Text Search if geocoding fails
    return await this.placesService.searchBusinessesByText(
      keyword,
      location,
      max_results
    );
  }
}