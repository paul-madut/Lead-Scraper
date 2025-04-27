// src/lib/googlePlacesService.ts
import { Business } from "@/lib/types";

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/place";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async geocodeLocation(location: string): Promise<{ lat: number, lng: number } | null> {
    try {
      // Using Place Autocomplete API to get location coordinates
      const geocodeUrl = `${this.baseUrl}/findplacefromtext/json`;
      const params = new URLSearchParams({
        input: location,
        inputtype: "textquery",
        fields: "geometry",
        key: this.apiKey
      });
      
      const response = await fetch(`${geocodeUrl}?${params}`);
      const data = await response.json();
      
      if (data.status !== "OK" || !data.candidates?.length) {
        console.error(`Error geocoding location '${location}': ${data.status}`);
        return null;
      }
      
      return data.candidates[0].geometry.location;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }
  
  async getBusinessDetails(placeId: string): Promise<Business | null> {
    try {
      // Using Place Details API to get business information
      const detailsUrl = `${this.baseUrl}/details/json`;
      const params = new URLSearchParams({
        place_id: placeId,
        fields: "name,formatted_address,formatted_phone_number,website,url,business_status,user_ratings_total,photos,rating",
        key: this.apiKey
      });
      
      const response = await fetch(`${detailsUrl}?${params}`);
      const data = await response.json();
      
      if (data.status !== "OK") {
        console.error(`Error getting details for place ID ${placeId}: ${data.status}`);
        return null;
      }
      
      const result = data.result;
      
      return {
        name: result.name || "",
        address: result.formatted_address || "",
        phone: result.formatted_phone_number || "",
        website: result.website || "",
        maps_url: result.url || "",
        place_id: placeId,
        business_status: result.business_status || "OPERATIONAL",
        total_reviews: result.user_ratings_total || null,
        image_url: result.photos?.[0]?.photo_reference || null,
        rating: result.rating || null
      };
    } catch (error) {
      console.error("Error fetching business details:", error);
      return null;
    }
  }
  
  async searchNearbyBusinesses(
    keyword: string, 
    location: { lat: number, lng: number }, 
    radius: number, 
    maxResults: number
  ): Promise<Business[]> {
    try {
      // Using Place Nearby Search API to find businesses
      const searchUrl = `${this.baseUrl}/nearbysearch/json`;
      const params = new URLSearchParams({
        location: `${location.lat},${location.lng}`,
        radius: radius.toString(),
        keyword: keyword,
        // We don't need to restrict by 'type' as the keyword search is sufficient
        key: this.apiKey
      });
      
      const businesses: Business[] = [];
      let nextPageToken: string | null = null;
      let totalFound = 0;
      
      do {
        // If we have a next_page_token, use it instead of the original parameters
        const requestParams = nextPageToken 
          ? new URLSearchParams({ pagetoken: nextPageToken, key: this.apiKey })
          : params;
          
        const response:any = await fetch(`${searchUrl}?${requestParams}`);
        const data = await response.json();
        
        if (data.status !== "OK") {
          console.error(`Error searching for businesses: ${data.status}`);
          break;
        }
        
        // Process results
        for (const place of data.results || []) {
          if (totalFound >= maxResults) break;
          
          const businessInfo = await this.getBusinessDetails(place.place_id);
          if (businessInfo) {
            businesses.push(businessInfo);
            totalFound++;
          }
        }
        
        // Get next page token if available
        nextPageToken = data.next_page_token || null;
        
        // Need to wait a bit before using next_page_token
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } while (nextPageToken && totalFound < maxResults);
      
      return businesses.slice(0, maxResults);
    } catch (error) {
      console.error("Error searching businesses:", error);
      return [];
    }
  }
  
  // Alternative method using Text Search API
  async searchBusinessesByText(
    query: string,
    location: string,
    maxResults: number
  ): Promise<Business[]> {
    try {
      // Using Place Text Search API which can be more effective for some searches
      const searchUrl = `${this.baseUrl}/textsearch/json`;
      const params = new URLSearchParams({
        query: `${query} in ${location}`,
        key: this.apiKey
      });
      
      const businesses: Business[] = [];
      let nextPageToken: string | null = null;
      let totalFound = 0;
      
      do {
        // If we have a next_page_token, use it instead of the original parameters
        const requestParams = nextPageToken 
          ? new URLSearchParams({ pagetoken: nextPageToken, key: this.apiKey })
          : params;
          
        const response:any = await fetch(`${searchUrl}?${requestParams}`);
        const data = await response.json();
        
        if (data.status !== "OK") {
          console.error(`Error text searching for businesses: ${data.status}`);
          break;
        }
        
        // Process results
        for (const place of data.results || []) {
          if (totalFound >= maxResults) break;
          
          const businessInfo = await this.getBusinessDetails(place.place_id);
          if (businessInfo) {
            businesses.push(businessInfo);
            totalFound++;
          }
        }
        
        // Get next page token if available
        nextPageToken = data.next_page_token || null;
        
        // Need to wait a bit before using next_page_token
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } while (nextPageToken && totalFound < maxResults);
      
      return businesses.slice(0, maxResults);
    } catch (error) {
      console.error("Error text searching businesses:", error);
      return [];
    }
  }
}