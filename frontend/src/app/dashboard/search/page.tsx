"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import SearchForm, { type SearchParams } from "./Search";
import LeadResultsTable from "@/components/LeadResultsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { getTokenBalance } from "@/services/tokenService";
import { promoteBusinessToContact } from "@/services/contacts";
import { downloadLeadsCsv } from "@/lib/export";
import type { Business, SearchMeta } from "@/lib/types";

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const { workspaceId } = useWorkspace();
  const [balance, setBalance] = useState<number | null>(null);
  const [results, setResults] = useState<Business[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedPlaceIds, setAddedPlaceIds] = useState<Set<string>>(new Set());
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const lastParams = useRef<SearchParams | null>(null);
  const inFlight = useRef(false);

  const handleAddToCrm = useCallback(
    async (business: Business) => {
      if (!user || !workspaceId) return;
      setAddingPlaceId(business.place_id);
      try {
        await promoteBusinessToContact(workspaceId, user.uid, business);
        setAddedPlaceIds((prev) => new Set(prev).add(business.place_id));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not add contact to the CRM."
        );
      } finally {
        setAddingPlaceId(null);
      }
    },
    [user, workspaceId]
  );

  useEffect(() => {
    let ignore = false;
    if (!user) {
      setBalance(null);
      return;
    }
    getTokenBalance()
      .then((b) => !ignore && setBalance(b))
      .catch(() => !ignore && setBalance(null));
    return () => {
      ignore = true;
    };
  }, [user]);

  const runSearch = useCallback(
    async (params: SearchParams, mode: "new" | "more") => {
      if (!user) {
        setError("Please sign in to search.");
        return;
      }
      // Guard against overlapping requests (a second one would waste API calls
      // and race the result state).
      if (inFlight.current) return;
      inFlight.current = true;
      setIsSearching(true);
      setError(null);
      lastParams.current = params;

      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            keyword: params.keyword,
            location: params.location,
            radius: params.radiusKm * 1000,
            max_results: params.maxResults,
            idempotencyKey:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.currentTokens !== undefined) setBalance(data.currentTokens);
          throw new Error(data.error || "Search failed.");
        }

        setMeta(data.meta);
        setBalance(data.meta.remaining_tokens);
        setResults((prev) =>
          mode === "new" ? data.businesses : [...prev, ...data.businesses]
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        inFlight.current = false;
        setIsSearching(false);
      }
    },
    [user]
  );

  const onNewSearch = (params: SearchParams) => {
    setResults([]);
    setMeta(null);
    runSearch(params, "new");
  };

  const onLoadMore = () => {
    if (lastParams.current) runSearch(lastParams.current, "more");
  };

  const exhausted = meta?.area_exhausted ?? false;
  const hasMore = meta?.has_more ?? false;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Find leads</h1>
        <p className="text-muted-foreground">
          Search local businesses. Re-run the same area to pull fresh leads - you
          are never charged twice for the same result.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <SearchForm
            onSearch={onNewSearch}
            isSearching={isSearching}
            tokenBalance={balance}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {meta && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle>
                {results.length} lead{results.length === 1 ? "" : "s"} for{" "}
                &ldquo;{meta.query}&rdquo; in {meta.location}
              </CardTitle>
              <CardDescription>
                {meta.tokens_charged > 0
                  ? `Charged ${meta.tokens_charged} tokens for ${meta.new_results} new lead${
                      meta.new_results === 1 ? "" : "s"
                    }.`
                  : "No new leads this time - no tokens charged."}
              </CardDescription>
            </div>
            {results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadLeadsCsv(
                    results,
                    `${meta.query}-${meta.location}-leads.csv`.replace(/\s+/g, "-")
                  )
                }
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <LeadResultsTable
              businesses={results}
              onAddToCrm={workspaceId ? handleAddToCrm : undefined}
              addedPlaceIds={addedPlaceIds}
              addingPlaceId={addingPlaceId}
            />

            {exhausted ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" />
                You&apos;ve pulled every available lead in this area.
              </div>
            ) : (
              <div className="flex justify-center">
                <Button variant="outline" onClick={onLoadMore} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isSearching
                    ? "Finding more..."
                    : hasMore
                      ? "Load more leads in this area"
                      : "Check for new leads in this area"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {authLoading && !user && (
        <p className="text-sm text-muted-foreground">Loading your account...</p>
      )}
    </div>
  );
}
