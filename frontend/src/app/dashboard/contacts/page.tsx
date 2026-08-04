"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Search, Phone, Mail, ChevronRight } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { listContacts } from "@/services/contacts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PIPELINE_STAGES, stageLabel, stageTone } from "@/lib/crm";
import type { Contact } from "@/lib/types";

export default function ContactsPage() {
  const { workspaceId, loading: wsLoading } = useWorkspace();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  useEffect(() => {
    let ignore = false;
    if (wsLoading) return;
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    listContacts(workspaceId)
      .then((c) => !ignore && setContacts(c))
      .catch(() => !ignore && setContacts([]))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [workspaceId, wsLoading]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return contacts.filter((c) => {
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        (c.phone ?? "").toLowerCase().includes(needle) ||
        (c.address ?? "").toLowerCase().includes(needle)
      );
    });
  }, [contacts, q, stageFilter]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Users className="h-6 w-6 text-primary" />
          Contacts
        </h1>
        <p className="text-muted-foreground">
          Your CRM. Promote scraped leads into contacts, then work them through
          your pipeline.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, phone, or address"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip label="All" active={stageFilter === "all"} onClick={() => setStageFilter("all")} />
          {PIPELINE_STAGES.map((s) => (
            <FilterChip
              key={s.id}
              label={s.label}
              active={stageFilter === s.id}
              onClick={() => setStageFilter(s.id)}
            />
          ))}
        </div>
      </div>

      {loading || wsLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No contacts yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Run a search, then use &ldquo;Add&rdquo; on a lead to bring it into
              your CRM.
            </p>
            <Link
              href="/dashboard/search"
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Go to search
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/contacts/${c.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{c.name}</span>
                  {c.optOutSms && <Badge variant="muted">SMS opt-out</Badge>}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {c.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </span>
                  )}
                  {c.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {c.email}
                    </span>
                  )}
                  {!c.phone && !c.email && <span>No contact info</span>}
                </div>
              </div>
              <Badge variant={stageTone(c.stage)}>{stageLabel(c.stage)}</Badge>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          : "rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}
