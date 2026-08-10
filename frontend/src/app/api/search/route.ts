// app/api/search/route.ts
// Flow: authenticate -> validate -> cheap balance pre-check -> scrape only
// UNSEEN places (dedup via the session snapshot) -> settle ATOMICALLY (charge
// only for leads still new at commit time + record the cursor in one
// transaction) -> persist results -> return new leads + pagination state.
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { BusinessLeadService } from "@/services/businessLead";
import { AdminTokenService } from "@/services/adminTokenService";
import { SearchSessionService } from "@/services/searchSession";
import { saveSearchResults } from "@/services/adminSearchStore";
import { PlacesApiError } from "@/services/googlePlaces";
import { PRICING_CONFIG, estimateSearchCost } from "@/lib/pricing";
import type { SearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const SearchSchema = z.object({
  keyword: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(120),
  radius: z.coerce.number().int().min(1000).max(50000).default(5000),
  max_results: z.coerce
    .number()
    .int()
    .min(1)
    .max(PRICING_CONFIG.MAX_RESULTS_LIMIT)
    .default(20),
  // Deliver (and charge for) only businesses without a website. Everything
  // scraped is still marked seen so "load more" pages forward correctly.
  noWebsiteOnly: z.boolean().optional().default(false),
  idempotencyKey: z.string().max(100).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;
  const userId = auth.uid;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = SearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Invalid search parameters: ${parsed.error.issues[0]?.message}` },
      { status: 400 }
    );
  }
  const { keyword, location, radius, max_results, noWebsiteOnly, idempotencyKey } =
    parsed.data;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY is not configured");
    return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
  }

  // Cheap advisory pre-check so we don't scrape for a user who clearly can't
  // pay. The authoritative check happens atomically in settle().
  const balance = await AdminTokenService.getTokenBalance(userId);
  const worstCase = estimateSearchCost(max_results);
  if (balance < worstCase) {
    return NextResponse.json(
      {
        error: `Insufficient tokens. You have ${balance} but this search can cost up to ${worstCase}.`,
        currentTokens: balance,
        requiredTokens: worstCase,
      },
      { status: 403 }
    );
  }

  // Snapshot of already-delivered leads, used to skip their (expensive) Details.
  const session = await SearchSessionService.load(userId, keyword, location, radius);

  // Scrape only unseen places. Nothing has been charged yet, so a failure just
  // returns an error with no billing side effects.
  let result;
  try {
    const leadService = new BusinessLeadService(apiKey);
    result = await leadService.searchBusinesses(
      { keyword, location, radius, max_results },
      session.seenPlaceIds
    );
  } catch (err) {
    if (err instanceof PlacesApiError) {
      console.error("Places API error:", err.status);
      const msg =
        err.status === "OVER_QUERY_LIMIT"
          ? "Search is temporarily rate-limited. Please try again shortly."
          : "The lead source is temporarily unavailable. You were not charged.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    console.error("Search failed:", err);
    return NextResponse.json(
      { error: "Search failed. You were not charged." },
      { status: 500 }
    );
  }

  // When filtering to no-website leads, deliver + charge only those, but still
  // mark every scraped place_id as seen (attemptedPlaceIds is unchanged) so a
  // "load more" pages past the ones that do have a site instead of re-scraping.
  const deliverable = noWebsiteOnly
    ? result.businesses.filter((b) => !b.website)
    : result.businesses;

  // Charge + record the cursor atomically. Only leads still new at commit time
  // are billed, so a crash cannot split billing from the cursor and a
  // concurrent search cannot re-charge for the same leads.
  let settled;
  try {
    settled = await SearchSessionService.settle({
      userId,
      ref: session.ref,
      keyword,
      location,
      radius,
      scraped: deliverable,
      attemptedPlaceIds: result.attemptedPlaceIds,
      hasMoreUnseen: result.hasMoreUnseen,
      idempotencyKey,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "InsufficientTokens") {
      const current = await AdminTokenService.getTokenBalance(userId);
      return NextResponse.json(
        { error: "Insufficient tokens to complete this search.", currentTokens: current },
        { status: 403 }
      );
    }
    console.error("Settle failed:", err);
    return NextResponse.json(
      { error: "Failed to finalize the search. You were not charged." },
      { status: 500 }
    );
  }

  // Persisting saved history is a convenience, not money-critical - the user
  // already has their leads and billing is committed. Never fail the response.
  if (settled.charged.length > 0) {
    try {
      await saveSearchResults({
        userId,
        searchTerm: `${keyword} in ${location}`,
        results: settled.charged,
      });
    } catch (persistErr) {
      console.error("Saving search history failed (non-fatal):", persistErr);
    }
  }

  const newResults = settled.charged.length;
  const response: SearchResponse = {
    success: true,
    businesses: settled.charged,
    meta: {
      query: keyword,
      location,
      radius,
      max_results,
      results_count: newResults,
      new_results: newResults,
      tokens_charged: settled.tokensCharged,
      remaining_tokens: settled.remaining,
      has_more: result.hasMoreUnseen,
      area_exhausted: settled.areaExhausted,
      cost_breakdown: {
        base_cost: newResults > 0 ? PRICING_CONFIG.BASE_SEARCH_COST : 0,
        per_result_cost: PRICING_CONFIG.COST_PER_RESULT,
        new_results: newResults,
        total_cost: settled.tokensCharged,
      },
    },
  };
  return NextResponse.json(response);
}
