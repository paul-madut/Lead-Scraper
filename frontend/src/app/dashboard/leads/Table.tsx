"use client";

import * as React from "react";
import { Download, Search } from "lucide-react";

import type { Business } from "@/lib/types";
import { downloadLeadsCsv } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import LeadResultsTable from "@/components/LeadResultsTable";

type WebsiteFilter = "all" | "no-website" | "has-website";

interface DataTableProps {
  data: Business[];
  filename?: string;
}

function StatCard({
  value,
  label,
  tone,
}: {
  value: React.ReactNode;
  label: string;
  tone?: "default" | "success" | "primary";
}) {
  const valueTone =
    tone === "success"
      ? "text-success"
      : tone === "primary"
        ? "text-primary"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="px-4 py-4">
        <div className={`text-2xl font-bold ${valueTone}`}>{value}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export function DataTable({ data, filename = "leads.csv" }: DataTableProps) {
  const [nameQuery, setNameQuery] = React.useState("");
  const [websiteFilter, setWebsiteFilter] =
    React.useState<WebsiteFilter>("all");

  const businessesWithoutWebsite = data.filter((b) => !b.website).length;
  const businessesWithPhone = data.filter((b) => b.phone).length;
  const potentialLeadRate =
    data.length > 0
      ? Math.round((businessesWithoutWebsite / data.length) * 100)
      : 0;

  const filtered = React.useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    return data.filter((b) => {
      if (q && !b.name.toLowerCase().includes(q)) return false;
      if (websiteFilter === "no-website" && b.website) return false;
      if (websiteFilter === "has-website" && !b.website) return false;
      return true;
    });
  }, [data, nameQuery, websiteFilter]);

  return (
    <div className="w-full space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard value={data.length} label="Total businesses" />
        <StatCard
          value={businessesWithoutWebsite}
          label="Without website"
          tone="success"
        />
        <StatCard value={businessesWithPhone} label="With phone" />
        <StatCard
          value={`${potentialLeadRate}%`}
          label="Potential leads"
          tone="primary"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by business name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={websiteFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setWebsiteFilter("all")}
            >
              All ({data.length})
            </Button>
            <Button
              variant={websiteFilter === "no-website" ? "default" : "outline"}
              size="sm"
              onClick={() => setWebsiteFilter("no-website")}
            >
              No website ({businessesWithoutWebsite})
            </Button>
            <Button
              variant={websiteFilter === "has-website" ? "default" : "outline"}
              size="sm"
              onClick={() => setWebsiteFilter("has-website")}
            >
              Has website ({data.length - businessesWithoutWebsite})
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadLeadsCsv(filtered, filename)}
          disabled={filtered.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No businesses match the current filters.
        </div>
      ) : (
        <LeadResultsTable businesses={filtered} />
      )}
    </div>
  );
}
