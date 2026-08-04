"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Workflow, Plus, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { createSequence, listSequences } from "@/services/sequences";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Sequence } from "@/lib/types";

export default function SequencesPage() {
  const { user } = useAuth();
  const { workspaceId, loading: wsLoading } = useWorkspace();
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (wsLoading || !workspaceId) return;
    setLoading(true);
    listSequences(workspaceId)
      .then((s) => !ignore && setSequences(s))
      .catch(() => !ignore && setSequences([]))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [workspaceId, wsLoading]);

  const onCreate = async () => {
    if (!user || !workspaceId || !name.trim()) return;
    setCreating(true);
    try {
      const id = await createSequence(workspaceId, user.uid, name.trim());
      router.push(`/dashboard/sequences/${id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Workflow className="h-6 w-6 text-primary" />
          Sequences
        </h1>
        <p className="text-muted-foreground">
          Automated outreach flows. Steps run on a schedule and stop
          automatically when a contact replies.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row">
          <Input
            placeholder="New sequence name (e.g. Cold outreach)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onCreate()}
          />
          <Button onClick={onCreate} disabled={creating || !name.trim()}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </CardContent>
      </Card>

      {loading || wsLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : sequences.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sequences yet. Create one above to start automating outreach.
        </p>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {sequences.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/sequences/${s.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{s.name}</span>
                  <Badge variant={s.status === "active" ? "success" : "muted"}>
                    {s.status}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.steps.length} step{s.steps.length === 1 ? "" : "s"}
                  {s.stopOnReply ? " · stops on reply" : ""}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
