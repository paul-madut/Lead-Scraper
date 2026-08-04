// services/googlePlaces.ts - Google Places (legacy) client.
// Design notes:
//  - Throws PlacesApiError on hard failures so the caller can refund and 500
//    instead of silently charging for an empty result.
//  - Dedupes place_ids and skips already-seen ones BEFORE the expensive Place
//    Details calls, so re-searching an area never re-bills for known leads.
//  - Fetches Details with bounded concurrency rather than one-at-a-time.
import { Business } from "@/lib/types";

const DETAILS_CONCURRENCY = 6;
const DETAILS_FIELDS =
  "name,formatted_address,formatted_phone_number,website,url,business_status,user_ratings_total,photos,rating";

export class PlacesApiError extends Error {
  status: string;
  constructor(status: string, message?: string) {
    super(message ?? `Google Places error: ${status}`);
    this.name = "PlacesApiError";
    this.status = status;
  }
}

export interface PlacesSearchResult {
  /** Detailed leads for previously-unseen places, capped at maxResults. */
  businesses: Business[];
  /**
   * Every unseen place_id we ATTEMPTED to fetch this call (includes ones whose
   * Details lookup returned nothing). Marked as seen so they are not retried
   * forever, which would keep an area from ever reporting "exhausted".
   */
  attemptedPlaceIds: string[];
  /** More unseen leads remain than we attempted (a follow-up will yield more). */
  hasMoreUnseen: boolean;
}

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/place";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async getJson(url: string): Promise<Record<string, unknown>> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new PlacesApiError(
        `HTTP_${response.status}`,
        `Places API HTTP ${response.status}`
      );
    }
    return (await response.json()) as Record<string, unknown>;
  }

  async geocodeLocation(
    location: string
  ): Promise<{ lat: number; lng: number } | null> {
    const params = new URLSearchParams({
      input: location,
      inputtype: "textquery",
      fields: "geometry",
      key: this.apiKey,
    });
    const data = await this.getJson(`${this.baseUrl}/findplacefromtext/json?${params}`);
    const status = data.status as string;

    if (status === "ZERO_RESULTS") return null;
    if (status !== "OK") throw new PlacesApiError(status);

    const candidates = data.candidates as
      | Array<{ geometry?: { location?: { lat: number; lng: number } } }>
      | undefined;
    return candidates?.[0]?.geometry?.location ?? null;
  }

  async getBusinessDetails(placeId: string): Promise<Business | null> {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: DETAILS_FIELDS,
      key: this.apiKey,
    });
    const data = await this.getJson(`${this.baseUrl}/details/json?${params}`);
    const status = data.status as string;

    if (status === "NOT_FOUND" || status === "ZERO_RESULTS") return null;
    if (status !== "OK") throw new PlacesApiError(status);

    const result = data.result as Record<string, unknown>;
    const photos = result.photos as Array<{ photo_reference?: string }> | undefined;

    return {
      name: (result.name as string) || "",
      address: (result.formatted_address as string) || "",
      phone: (result.formatted_phone_number as string) || null,
      website: (result.website as string) || null,
      maps_url: (result.url as string) || null,
      place_id: placeId,
      business_status: (result.business_status as string) || "OPERATIONAL",
      total_reviews: (result.user_ratings_total as number) ?? null,
      photo_reference: photos?.[0]?.photo_reference ?? null,
      rating: (result.rating as number) ?? null,
    };
  }

  /**
   * Walk every available result page (up to Google's 3-page / ~60 cap),
   * returning the ordered, de-duplicated list of place_ids. List calls are
   * cheap; this is deliberately exhaustive so we can compute what is unseen.
   */
  private async collectPlaceIds(
    endpoint: "nearbysearch" | "textsearch",
    baseParams: URLSearchParams
  ): Promise<string[]> {
    const seen = new Set<string>();
    const ordered: string[] = [];
    let nextPageToken: string | null = null;

    do {
      const params = nextPageToken
        ? new URLSearchParams({ pagetoken: nextPageToken, key: this.apiKey })
        : baseParams;

      let data = await this.getJson(`${this.baseUrl}/${endpoint}/json?${params}`);
      let status = data.status as string;

      // A freshly-issued page token is often not valid immediately; retry.
      if (status === "INVALID_REQUEST" && nextPageToken) {
        for (let attempt = 0; attempt < 2 && status === "INVALID_REQUEST"; attempt++) {
          await this.delay(1500);
          data = await this.getJson(`${this.baseUrl}/${endpoint}/json?${params}`);
          status = data.status as string;
        }
      }

      if (status === "ZERO_RESULTS") break;
      if (status !== "OK") throw new PlacesApiError(status);

      for (const place of (data.results as Array<{ place_id?: string }>) || []) {
        if (place.place_id && !seen.has(place.place_id)) {
          seen.add(place.place_id);
          ordered.push(place.place_id);
        }
      }

      nextPageToken = (data.next_page_token as string) || null;
      if (nextPageToken) await this.delay(2000);
    } while (nextPageToken);

    return ordered;
  }

  private async fetchDetailsBounded(placeIds: string[]): Promise<Business[]> {
    const out: Business[] = [];
    for (let i = 0; i < placeIds.length; i += DETAILS_CONCURRENCY) {
      const chunk = placeIds.slice(i, i + DETAILS_CONCURRENCY);
      const details = await Promise.all(chunk.map((id) => this.getBusinessDetails(id)));
      for (const d of details) if (d) out.push(d);
    }
    return out;
  }

  async searchNearby(
    keyword: string,
    location: { lat: number; lng: number },
    radius: number,
    maxResults: number,
    excludePlaceIds: Set<string>
  ): Promise<PlacesSearchResult> {
    const params = new URLSearchParams({
      location: `${location.lat},${location.lng}`,
      radius: radius.toString(),
      keyword,
      key: this.apiKey,
    });
    const encountered = await this.collectPlaceIds("nearbysearch", params);
    return this.buildResult(encountered, maxResults, excludePlaceIds);
  }

  async searchByText(
    query: string,
    location: string,
    maxResults: number,
    excludePlaceIds: Set<string>
  ): Promise<PlacesSearchResult> {
    const params = new URLSearchParams({
      query: `${query} in ${location}`,
      key: this.apiKey,
    });
    const encountered = await this.collectPlaceIds("textsearch", params);
    return this.buildResult(encountered, maxResults, excludePlaceIds);
  }

  private async buildResult(
    encounteredPlaceIds: string[],
    maxResults: number,
    excludePlaceIds: Set<string>
  ): Promise<PlacesSearchResult> {
    const unseen = encounteredPlaceIds.filter((id) => !excludePlaceIds.has(id));
    const toFetch = unseen.slice(0, maxResults);
    const businesses = await this.fetchDetailsBounded(toFetch);
    return {
      businesses,
      attemptedPlaceIds: toFetch,
      hasMoreUnseen: unseen.length > maxResults,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
