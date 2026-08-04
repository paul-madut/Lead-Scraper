// lib/pricing.ts - single source of truth for token pricing.
export const PRICING_CONFIG = {
  /** Base cost applied once per search that returns at least one new lead. */
  BASE_SEARCH_COST: 1,

  /** Cost per NEW (previously unseen) lead returned. */
  COST_PER_RESULT: 1,

  /** Maximum results requestable in a single search. */
  MAX_RESULTS_LIMIT: 60,

  /** Free tokens granted once to each new user. */
  INITIAL_TOKENS: 200,

  /** Token packages available for purchase. */
  TOKEN_PACKAGES: [
    { tokens: 100, price: 10, name: "Starter Pack" },
    { tokens: 500, price: 40, name: "Business Pack", popular: true },
    { tokens: 1000, price: 75, name: "Professional Pack" },
    { tokens: 2500, price: 175, name: "Enterprise Pack" },
  ],
} as const;

/**
 * Amount to RESERVE before a search runs (worst case: every requested result
 * is new). The unused portion is refunded once actual results are known.
 */
export function estimateSearchCost(maxResults: number): number {
  return PRICING_CONFIG.BASE_SEARCH_COST + maxResults * PRICING_CONFIG.COST_PER_RESULT;
}

/**
 * Final charge based on how many NEW leads were actually delivered.
 * Zero new leads costs zero - users are never charged for duplicates or for a
 * failed/empty search.
 */
export function chargeForResults(newResults: number): number {
  if (newResults <= 0) return 0;
  return PRICING_CONFIG.BASE_SEARCH_COST + newResults * PRICING_CONFIG.COST_PER_RESULT;
}
