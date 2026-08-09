"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users, Search, Phone, Mail, ChevronRight, Workflow } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { listContacts, setCallStatus } from "@/services/contacts";
import { enrollBulkApi, listSequences } from "@/services/sequences";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CALL_STATUSES,
  PIPELINE_STAGES,
  stageLabel,
  stageTone,
} from "@/lib/crm";
import type { CallStatus, Contact, Sequence } from "@/lib/types";

// Local datetime-local string for tomorrow at 9am (a sensible default start).
function tomorrow9am(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const { workspaceId, loading: wsLoading } = useWorkspace();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [callFilter, setCallFilter] = useState<string>("all");

  // Bulk-enroll state.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [seqId, setSeqId] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("later");
  const [scheduleAt, setScheduleAt] = useState(tomorrow9am());
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (wsLoading) return;
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([listContacts(workspaceId), listSequences(workspaceId)])
      .then(([c, s]) => {
        if (ignore) return;
        setContacts(c);
        setSequences(s);
      })
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
      if (callFilter !== "all" && (c.callStatus ?? "todo") !== callFilter) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        (c.phone ?? "").toLowerCase().includes(needle) ||
        (c.address ?? "").toLowerCase().includes(needle)
      );
    });
  }, [contacts, q, stageFilter, callFilter]);

  const toCallCount = useMemo(
    () => contacts.filter((c) => (c.callStatus ?? "todo") === "todo").length,
    [contacts]
  );

  const onSetCallStatus = async (contact: Contact, status: CallStatus) => {
    if (!user) return;
    // Optimistic: update the row immediately, then persist.
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, callStatus: status } : c))
    );
    try {
      await setCallStatus(contact, user.uid, status);
    } catch {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contact.id ? { ...c, callStatus: contact.callStatus } : c
        )
      );
    }
  };

  const activeSequences = sequences.filter((s) => s.status === "active");
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      if (filtered.every((c) => prev.has(c.id))) {
        const next = new Set(prev);
        filtered.forEach((c) => next.delete(c.id));
        return next;
      }
      return new Set([...prev, ...filtered.map((c) => c.id)]);
    });

  const onEnroll = async () => {
    if (!user || !seqId || selected.size === 0) return;
    setEnrolling(true);
    setEnrollMsg(null);
    try {
      const token = await user.getIdToken();
      const startAt =
        scheduleMode === "later" && scheduleAt ? new Date(scheduleAt) : undefined;
      const res = await enrollBulkApi(token, {
        sequenceId: seqId,
        contactIds: [...selected],
        startAt,
      });
      if (!res.ok) {
        setEnrollMsg(res.reason ?? "Failed to enroll.");
      } else {
        const skipped = res.skipped?.length ?? 0;
        setEnrollMsg(
          `Enrolled ${res.enrolled ?? 0} contact(s)` +
            (skipped ? `, skipped ${skipped} (already enrolled or no phone)` : "") +
            (startAt ? ` - first send ${startAt.toLocaleString()}` : "") +
            "."
        );
        setSelected(new Set());
      }
    } finally {
      setEnrolling(false);
    }
  };

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

      {/* Call-status filter - for working a call list. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          Calls:
        </span>
        <FilterChip label="All" active={callFilter === "all"} onClick={() => setCallFilter("all")} />
        <FilterChip
          label={`To call (${toCallCount})`}
          active={callFilter === "todo"}
          onClick={() => setCallFilter("todo")}
        />
        {CALL_STATUSES.filter((s) => s.id !== "todo").map((s) => (
          <FilterChip
            key={s.id}
            label={s.label}
            active={callFilter === s.id}
            onClick={() => setCallFilter(s.id)}
          />
        ))}
      </div>

      {/* Bulk-enroll bar - appears once contacts are selected. */}
      {selected.size > 0 && (
        <Card className="border-primary/40">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Workflow className="h-4 w-4 text-primary" />
              {selected.size} selected - enroll in a sequence
            </div>
            {activeSequences.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active sequences. Create one under{" "}
                <Link href="/dashboard/sequences" className="text-primary hover:underline">
                  Sequences
                </Link>{" "}
                and activate it first.
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <select
                  value={seqId}
                  onChange={(e) => setSeqId(e.target.value)}
                  className="rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Choose a sequence...</option>
                  {activeSequences.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={scheduleMode === "now"}
                      onChange={() => setScheduleMode("now")}
                    />
                    Start now
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={scheduleMode === "later"}
                      onChange={() => setScheduleMode("later")}
                    />
                    Schedule
                  </label>
                  {scheduleMode === "later" && (
                    <input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                      className="rounded-lg border bg-card px-2 py-1.5 text-sm outline-none focus:border-primary"
                    />
                  )}
                </div>

                <Button onClick={onEnroll} disabled={enrolling || !seqId}>
                  {enrolling ? "Enrolling..." : `Enroll ${selected.size}`}
                </Button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            )}
            {enrollMsg && <p className="text-sm text-muted-foreground">{enrollMsg}</p>}
            <p className="text-xs text-muted-foreground">
              Contacts are staggered ~45s apart and held to each sequence&apos;s
              quiet hours in the recipient&apos;s local time.
            </p>
          </CardContent>
        </Card>
      )}

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
        <div className="overflow-hidden rounded-xl border bg-card">
          <label className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-input"
            />
            Select all {filtered.length}
          </label>
          <div className="divide-y">
            {filtered.map((c) => (
              <div
                key={c.id}
                className={
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40" +
                  (selected.has(c.id) ? " bg-primary/5" : "")
                }
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 shrink-0 rounded border-input"
                  aria-label={`Select ${c.name}`}
                />
                <Link
                  href={`/dashboard/contacts/${c.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
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
                </Link>
                <select
                  value={c.callStatus ?? "todo"}
                  onChange={(e) => onSetCallStatus(c, e.target.value as CallStatus)}
                  aria-label={`Call status for ${c.name}`}
                  className="shrink-0 rounded-lg border bg-card px-2 py-1.5 text-xs font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {CALL_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Link
                  href={`/dashboard/contacts/${c.id}`}
                  aria-label={`Open ${c.name}`}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
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
