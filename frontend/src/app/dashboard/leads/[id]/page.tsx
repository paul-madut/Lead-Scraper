"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Download } from "lucide-react";

import { getSearchResultsById } from "@/services/query";
import { downloadLeadsCsv } from "@/lib/export";
import type { SearchQuery } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import LeadResultsTable from "@/components/LeadResultsTable";

type WebsiteFilter = "all" | "no-website";

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-28 rounded-xl bg-muted" />
        <div className="h-72 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export default function LeadDetails() {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState<SearchQuery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<WebsiteFilter>("all");

  useEffect(() => {
    if (!id) return;

    let active = true;
    async function getQuery() {
      try {
        setLoading(true);
        setError("");
        const result = await getSearchResultsById(id);
        if (active) setQuery(result);
      } catch (err) {
        console.error("Error fetching search:", err);
        if (active) {
          setError(
            err instanceof Error ? err.message : "Failed to load lead details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    getQuery();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (error || !query) {
    return (
      <div className="mx-auto max-w-2xl p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Lead details not found
            </h1>
            <p className="text-sm text-muted-foreground">
              {error || "The lead details you're looking for could not be found."}
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/leads">
                <ArrowLeft className="h-4 w-4" />
                Back to leads
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allBusinesses = query.results;
  const businessesWithoutWebsite = allBusinesses.filter((b) => !b.website);
  const businessesWithPhone = allBusinesses.filter((b) => b.phone);
  const displayBusinesses =
    filter === "no-website" ? businessesWithoutWebsite : allBusinesses;
  const leadRate =
    allBusinesses.length > 0
      ? Math.round((businessesWithoutWebsite.length / allBusinesses.length) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      {/* Back */}
      <Link
        href="/dashboard/leads"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all searches
      </Link>

      {/* Title */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize tracking-tight text-foreground lg:text-3xl">
            {query.searchTerm || "Search results"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(query.timestamp), "MMMM d, yyyy 'at' h:mm a")}{" "}
            &middot; {allBusinesses.length} results
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            downloadLeadsCsv(
              displayBusinesses,
              `${query.searchTerm || "leads"}.csv`
            )
          }
          disabled={displayBusinesses.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-4">
            <div className="text-2xl font-bold text-foreground">
              {allBusinesses.length}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Total businesses
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-4">
            <div className="text-2xl font-bold text-success">
              {businessesWithoutWebsite.length}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Without website
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-4">
            <div className="text-2xl font-bold text-foreground">
              {businessesWithPhone.length}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              With phone
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-4">
            <div className="text-2xl font-bold text-primary">{leadRate}%</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Potential leads
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Show all ({allBusinesses.length})
          </Button>
          <Button
            variant={filter === "no-website" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("no-website")}
          >
            Without website ({businessesWithoutWebsite.length})
          </Button>
        </div>
        <Badge variant="muted">
          Showing {displayBusinesses.length} of {allBusinesses.length}
        </Badge>
      </div>

      {/* Results */}
      {displayBusinesses.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No businesses match the current filter.
        </div>
      ) : (
        <LeadResultsTable businesses={displayBusinesses} />
      )}
    </div>
  );
}
