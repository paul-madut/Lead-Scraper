"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Plus,
  Search as SearchIcon,
  FolderSearch,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { getUserSearchHistory } from "@/services/query";
import { downloadLeadsCsv } from "@/lib/export";
import type { SearchQuery } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "./Table";

function HistorySkeleton() {
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <div className="animate-pulse space-y-8">
        <div className="h-8 w-1/3 rounded-lg bg-muted" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<SearchQuery[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<SearchQuery | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLoadingHistory(false);
      return;
    }

    let active = true;
    async function fetchSearchHistory() {
      try {
        setLoadingHistory(true);
        setError("");
        const userHistory = await getUserSearchHistory(user!.uid);
        if (active) setHistory(userHistory);
      } catch (err) {
        console.error(err);
        if (active) setError("Failed to load search history.");
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    fetchSearchHistory();
    return () => {
      active = false;
    };
  }, [user, loading]);

  // While auth is resolving, show a skeleton - never flash "Access Denied".
  if (loading || (user && loadingHistory)) {
    return <HistorySkeleton />;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FolderSearch className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Sign in to view your leads
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your saved searches and lead history live behind your account.
              </p>
            </div>
            <Button asChild>
              <Link href="/auth">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Table view for a single selected search.
  if (selectedQuery) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="mb-6">
          <button
            onClick={() => setSelectedQuery(null)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search history
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold capitalize tracking-tight text-foreground">
                {selectedQuery.searchTerm || "Search results"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(
                  new Date(selectedQuery.timestamp),
                  "MMMM d, yyyy 'at' h:mm a"
                )}{" "}
                &middot; {selectedQuery.resultCount} results
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/dashboard/leads/${selectedQuery.id}`}>
                Detailed view
              </Link>
            </Button>
          </div>
        </div>

        <DataTable
          data={selectedQuery.results}
          filename={`${selectedQuery.searchTerm || "leads"}.csv`}
        />
      </div>
    );
  }

  // Aggregate stats, guarded against an empty history.
  const totalResults = history.reduce((sum, q) => sum + q.resultCount, 0);
  const totalPotentialLeads = history.reduce(
    (sum, q) => sum + q.results.filter((b) => !b.website).length,
    0
  );
  const avgLeadRate =
    totalResults > 0
      ? Math.round((totalPotentialLeads / totalResults) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Your lead searches
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage every business lead search in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/search">
            <Plus className="h-4 w-4" />
            New search
          </Link>
        </Button>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchIcon className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                No searches yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start by creating your first business lead search.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/search">
                <Plus className="h-4 w-4" />
                Create your first search
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="px-5 py-5">
                <div className="text-2xl font-bold text-foreground">
                  {history.length}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Total searches
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-5 py-5">
                <div className="text-2xl font-bold text-foreground">
                  {totalResults}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Total results
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-5 py-5">
                <div className="text-2xl font-bold text-success">
                  {totalPotentialLeads}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Potential leads
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-5 py-5">
                <div className="text-2xl font-bold text-primary">
                  {avgLeadRate}%
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  Avg. lead rate
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History list */}
          <div className="space-y-4">
            {history.map((query) => {
              const withoutWebsite = query.results.filter(
                (b) => !b.website
              ).length;
              const withPhone = query.results.filter((b) => b.phone).length;
              const leadRate =
                query.resultCount > 0
                  ? Math.round((withoutWebsite / query.resultCount) * 100)
                  : 0;

              return (
                <Card
                  key={query.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardHeader className="flex-row items-start justify-between gap-4 pb-0">
                    <div>
                      <CardTitle className="text-lg capitalize">
                        {query.searchTerm}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {format(
                          new Date(query.timestamp),
                          "MMMM d, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {query.resultCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        results
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <Badge variant="success">
                        {withoutWebsite} without website
                      </Badge>
                      <Badge variant="secondary">
                        {leadRate}% potential leads
                      </Badge>
                      <Badge variant="muted">{withPhone} with phone</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedQuery(query)}
                      >
                        View table
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/leads/${query.id}`}>
                          Detailed view
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          downloadLeadsCsv(
                            query.results,
                            `${query.searchTerm || "leads"}.csv`
                          )
                        }
                        disabled={query.results.length === 0}
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
