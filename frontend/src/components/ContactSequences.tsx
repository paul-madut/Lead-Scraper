"use client";

import { useCallback, useEffect, useState } from "react";
import { Workflow } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  enrollContactApi,
  listContactEnrollments,
  listSequences,
} from "@/services/sequences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Enrollment, Sequence } from "@/lib/types";

const STATUS_TONE: Record<
  Enrollment["status"],
  "default" | "success" | "muted" | "secondary"
> = {
  active: "default",
  completed: "success",
  stopped: "muted",
  failed: "secondary",
};

export default function ContactSequences({ contactId }: { contactId: string }) {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;
    const [seqs, enrs] = await Promise.all([
      listSequences(workspaceId),
      listContactEnrollments(contactId),
    ]);
    setSequences(seqs);
    setEnrollments(enrs);
  }, [workspaceId, contactId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = sequences.filter((s) => s.status === "active");
  const nameFor = (id: string) =>
    sequences.find((s) => s.id === id)?.name ?? "Sequence";

  const onEnroll = async () => {
    if (!user || !selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const token = await user.getIdToken();
      const res = await enrollContactApi(token, selected, contactId);
      if (!res.ok) setMessage(res.reason ?? "Could not enroll");
      else {
        setSelected("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Workflow className="h-4 w-4 text-primary" />
          Sequences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrollments.length > 0 && (
          <ul className="space-y-2">
            {enrollments.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{nameFor(e.sequenceId)}</span>
                <Badge variant={STATUS_TONE[e.status]}>{e.status}</Badge>
              </li>
            ))}
          </ul>
        )}

        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active sequences. Create and activate one under Sequences.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="flex-1 rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Choose a sequence...</option>
              {active.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button onClick={onEnroll} disabled={busy || !selected}>
              {busy ? "Enrolling..." : "Enroll"}
            </Button>
          </div>
        )}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
