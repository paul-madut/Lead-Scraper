// services/businessLead.ts - picks a Places strategy and forwards the
// already-seen place_ids so duplicates never reach the billable Details step.
import { SearchRequest } from "@/lib/types";
import { GooglePlacesService, PlacesSearchResult } from "./googlePlaces";

const LARGE_AREA_SEGMENTS = new Set<string>([
  // Countries
  "canada", "united states", "usa", "america", "mexico", "australia", "uk", "england",
  // Canadian provinces / territories
  "ontario", "quebec", "british columbia", "alberta", "manitoba", "saskatchewan",
  "nova scotia", "new brunswick", "newfoundland", "prince edward island",
  "northwest territories", "nunavut", "yukon", "bc",
  // US states
  "california", "texas", "florida", "new york", "pennsylvania", "illinois", "ohio",
  "georgia", "north carolina", "michigan", "new jersey", "virginia", "washington",
  "arizona", "massachusetts", "tennessee", "indiana", "missouri", "maryland",
  "wisconsin", "colorado", "minnesota", "south carolina", "alabama", "louisiana",
  "kentucky", "oregon", "oklahoma", "connecticut", "utah", "iowa", "nevada",
  "arkansas", "mississippi", "kansas", "new mexico", "nebraska", "west virginia",
  "idaho", "hawaii", "new hampshire", "maine", "montana", "rhode island", "delaware",
  "south dakota", "north dakota", "alaska", "vermont", "wyoming",
]);

const PROVINCE_MAP: Record<string, string> = {
  ontario: "Ontario, Canada",
  quebec: "Quebec, Canada",
  alberta: "Alberta, Canada",
  "british columbia": "British Columbia, Canada",
  bc: "British Columbia, Canada",
  manitoba: "Manitoba, Canada",
  saskatchewan: "Saskatchewan, Canada",
  "nova scotia": "Nova Scotia, Canada",
  "new brunswick": "New Brunswick, Canada",
  newfoundland: "Newfoundland, Canada",
  "prince edward island": "Prince Edward Island, Canada",
};

export class BusinessLeadService {
  private placesService: GooglePlacesService;

  constructor(apiKey: string) {
    this.placesService = new GooglePlacesService(apiKey);
  }

  async searchBusinesses(
    request: SearchRequest,
    excludePlaceIds: Set<string>
  ): Promise<PlacesSearchResult> {
    const { keyword, location, radius, max_results } = request;
    const enhancedLocation = this.enhanceLocation(location);

    if (this.isLargeArea(location, radius)) {
      return this.placesService.searchByText(
        keyword,
        enhancedLocation,
        max_results,
        excludePlaceIds
      );
    }

    const coordinates = await this.placesService.geocodeLocation(enhancedLocation);
    if (coordinates) {
      return this.placesService.searchNearby(
        keyword,
        coordinates,
        radius,
        max_results,
        excludePlaceIds
      );
    }

    // Geocoding found nothing usable - fall back to text search.
    return this.placesService.searchByText(
      keyword,
      enhancedLocation,
      max_results,
      excludePlaceIds
    );
  }

  /**
   * True when the location names a whole province/state/country. Matches on
   * comma-delimited segments (whole words), so "Kansas City" or "Ontario,
   * California" are NOT mistaken for the province/state of the same name.
   */
  private isLargeArea(location: string, radius: number): boolean {
    if (radius > 25000) return true;
    const segments = location
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return segments.some((segment) => LARGE_AREA_SEGMENTS.has(segment));
  }

  private enhanceLocation(location: string): string {
    const key = location.toLowerCase().trim();
    return PROVINCE_MAP[key] ?? location;
  }
}
