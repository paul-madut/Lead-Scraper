"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Search as SearchIcon, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { estimateSearchCost, PRICING_CONFIG } from "@/lib/pricing";

export interface SearchParams {
  keyword: string;
  location: string;
  radiusKm: number;
  maxResults: number;
}

export default function SearchForm({
  onSearch,
  isSearching,
  tokenBalance,
}: {
  onSearch: (params: SearchParams) => void;
  isSearching: boolean;
  tokenBalance: number | null;
}) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState("5");
  const [maxResults, setMaxResults] = useState("20");
  const [error, setError] = useState<string | null>(null);

  const maxResultsNum = useMemo(() => {
    const n = parseInt(maxResults, 10);
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), PRICING_CONFIG.MAX_RESULTS_LIMIT) : 20;
  }, [maxResults]);

  const estimatedMax = estimateSearchCost(maxResultsNum);
  const enoughTokens = tokenBalance == null || tokenBalance >= estimatedMax;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return setError("Enter a business type to search for.");
    if (!location.trim()) return setError("Enter a location.");
    const radius = parseInt(radiusKm, 10);
    setError(null);
    onSearch({
      keyword: keyword.trim(),
      location: location.trim(),
      radiusKm: Number.isFinite(radius) ? Math.min(Math.max(radius, 1), 50) : 5,
      maxResults: maxResultsNum,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Business type</span>
          <Input
            placeholder="e.g. roofing, dentist, restaurant"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isSearching}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Location</span>
          <Input
            placeholder="e.g. Ottawa, ON"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isSearching}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Search radius (km)</span>
          <Input
            type="number"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            disabled={isSearching}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Leads per search</span>
          <Input
            type="number"
            min={1}
            max={PRICING_CONFIG.MAX_RESULTS_LIMIT}
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
            disabled={isSearching}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Coins className="h-4 w-4" />
          Balance:{" "}
          <span className="font-semibold text-foreground">
            {tokenBalance == null ? "-" : tokenBalance.toLocaleString()}
          </span>
        </span>
        <Badge variant="muted">Up to {estimatedMax} tokens - you only pay for new leads</Badge>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!enoughTokens && (
        <p className="text-sm text-destructive">
          Not enough tokens: this search can cost up to {estimatedMax}, you have{" "}
          {tokenBalance}.
        </p>
      )}

      <Button type="submit" disabled={isSearching || !enoughTokens} className="w-full sm:w-auto">
        <SearchIcon className="h-4 w-4" />
        {isSearching ? "Searching..." : "Find leads"}
      </Button>
    </form>
  );
}
