// lib/pricing.ts
export const PRICING_CONFIG = {
    // Base cost for performing any search
    BASE_SEARCH_COST: 1,
    
    // Cost per actual result returned
    COST_PER_RESULT: 1,
    
    // Minimum charge even if no results are found
    MIN_CHARGE: 5,
    
    // Maximum results allowed per search
    MAX_RESULTS_LIMIT: 100,
    
    // Free tokens for new users
    INITIAL_TOKENS: 200,
    
    // Token packages available for purchase
    TOKEN_PACKAGES: [
      { tokens: 100, price: 10, name: "Starter Pack" },
      { tokens: 500, price: 40, name: "Business Pack", popular: true },
      { tokens: 1000, price: 75, name: "Professional Pack" },
      { tokens: 2500, price: 175, name: "Enterprise Pack" }
    ]
  };
  
  // Helper function to calculate search cost
  export const calculateSearchCost = (maxResults: number): number => {
    return Math.max(
      PRICING_CONFIG.BASE_SEARCH_COST + (maxResults * PRICING_CONFIG.COST_PER_RESULT),
      PRICING_CONFIG.MIN_CHARGE
    );
  };
  
  // Helper function to calculate actual cost based on results
  export const calculateActualCost = (actualResults: number): number => {
    return Math.max(
      PRICING_CONFIG.BASE_SEARCH_COST + (actualResults * PRICING_CONFIG.COST_PER_RESULT),
      PRICING_CONFIG.MIN_CHARGE
    );
  };
  
  // Helper function to format cost breakdown
  export const formatCostBreakdown = (results: number) => {
    const baseCost = PRICING_CONFIG.BASE_SEARCH_COST;
    const resultsCost = results * PRICING_CONFIG.COST_PER_RESULT;
    const totalBeforeMin = baseCost + resultsCost;
    const actualCost = Math.max(totalBeforeMin, PRICING_CONFIG.MIN_CHARGE);
    
    return {
      baseCost,
      resultsCost,
      totalBeforeMin,
      actualCost,
      appliedMinimum: actualCost > totalBeforeMin
    };
  };