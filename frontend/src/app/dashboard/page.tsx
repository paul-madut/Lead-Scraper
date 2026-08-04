"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Download, Clock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getMostRecentUserSearch } from "@/services/query";
import { downloadLeadsCsv } from "@/lib/export";
import LeadResultsTable from "@/components/LeadResultsTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { SearchQuery } from "@/lib/types";

export default function LatestSearch() {
  const [query, setQuery] = useState<SearchQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let active = true;

    async function fetchLatestQuery() {
      if (!user?.uid) return;

      setLoading(true);
      setError(null);
      try {
        const latestQueries = await getMostRecentUserSearch(user.uid);
        if (!active) return;
        setQuery(latestQueries.length > 0 ? latestQueries[0] : null);
      } catch (err) {
        console.error("Error fetching latest query:", err);
        if (active) setError("We couldn't load your latest search. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }

    if (!authLoading) {
      if (user?.uid) {
        fetchLatestQuery();
      } else {
        setLoading(false);
      }
    }

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-40 w-full animate-pulse rounded-xl bg-muted" />
        <div className="mt-4 h-64 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <Card className="items-center text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-10 pb-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Search className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-foreground">
                No recent searches
              </h1>
              <p className="text-sm text-muted-foreground">
                You haven&apos;t run any searches yet. Start one to see your leads here.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/search">
                <Search className="h-4 w-4" />
                Start searching
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const results = query.results ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Your latest search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The most recent leads you pulled.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg capitalize">{query.searchTerm}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {new Date(query.timestamp).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge variant="secondary">{results.length} leads</Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={results.length === 0}
              onClick={() =>
                downloadLeadsCsv(results, `${query.searchTerm || "leads"}.csv`)
              }
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <LeadResultsTable businesses={results} />
          ) : (
            <p className="text-sm text-muted-foreground">
              This search returned no leads.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
