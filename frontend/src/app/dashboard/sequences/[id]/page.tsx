"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  GitBranch,
  Trash2,
  Plus,
} from "lucide-react";
import { getSequence, updateSequence, deleteSequence } from "@/services/sequences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Sequence, SequenceStep } from "@/lib/types";

let stepCounter = 0;
const newId = () => `s${Date.now()}_${stepCounter++}`;

export default function SequenceBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [name, setName] = useState("");
  const [stopOnReply, setStopOnReply] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!params?.id) return;
    getSequence(params.id)
      .then((s) => {
        if (ignore || !s) return;
        setSeq(s);
        setSteps(s.steps);
        setName(s.name);
        setStopOnReply(s.stopOnReply);
      })
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [params?.id]);

  const persist = useCallback(
    async (patch: Parameters<typeof updateSequence>[1]) => {
      if (!params?.id) return;
      setSaving(true);
      setSaved(false);
      try {
        await updateSequence(params.id, patch);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } finally {
        setSaving(false);
      }
    },
    [params?.id]
  );

  const addStep = (type: SequenceStep["type"]) => {
    const step: SequenceStep =
      type === "sms"
        ? { id: newId(), type: "sms", body: "" }
        : type === "wait"
          ? { id: newId(), type: "wait", days: 1 }
          : { id: newId(), type: "branch", condition: "replied", jumpTo: -1 };
    setSteps((prev) => [...prev, step]);
  };

  const updateStep = (id: string, patch: Partial<SequenceStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...patch } as SequenceStep) : s))
    );
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const saveSteps = () => persist({ steps, name, stopOnReply });

  const toggleActive = () => {
    if (!seq) return;
    const next = seq.status === "active" ? "draft" : "active";
    setSeq({ ...seq, status: next });
    persist({ status: next, steps, name, stopOnReply });
  };

  const onDelete = async () => {
    if (!params?.id) return;
    await deleteSequence(params.id);
    router.push("/dashboard/sequences");
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }
  if (!seq) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <Link href="/dashboard/sequences" className="text-sm text-primary hover:underline">
          &larr; Back to sequences
        </Link>
        <p className="mt-6 text-muted-foreground">Sequence not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/sequences"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Sequences
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={seq.status === "active" ? "success" : "muted"}>
            {seq.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={toggleActive}>
            {seq.status === "active" ? "Pause" : "Activate"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Sequence name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={stopOnReply}
              onChange={(e) => setStopOnReply(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Stop the sequence automatically when the contact replies
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No steps yet. Add an SMS, a wait, or a branch below.
            </p>
          )}
          {steps.map((step, i) => (
            <div key={step.id} className="rounded-lg border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                    {i + 1}
                  </span>
                  {step.type === "sms" && (
                    <>
                      <MessageSquare className="h-4 w-4 text-primary" /> Send SMS
                    </>
                  )}
                  {step.type === "wait" && (
                    <>
                      <Clock className="h-4 w-4 text-primary" /> Wait
                    </>
                  )}
                  {step.type === "branch" && (
                    <>
                      <GitBranch className="h-4 w-4 text-primary" /> If replied
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove step"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {step.type === "sms" && (
                <textarea
                  value={step.body}
                  onChange={(e) => updateStep(step.id, { body: e.target.value })}
                  placeholder="Message text..."
                  rows={2}
                  className="w-full resize-y rounded-md border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              )}
              {step.type === "wait" && (
                <div className="flex items-center gap-2 text-sm">
                  <span>Wait</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={step.days}
                    onChange={(e) =>
                      updateStep(step.id, { days: parseInt(e.target.value) || 1 })
                    }
                    className="w-20"
                  />
                  <span>day(s) before the next step</span>
                </div>
              )}
              {step.type === "branch" && (
                <p className="text-sm text-muted-foreground">
                  If the contact has replied, exit the sequence. Otherwise
                  continue to the next step.
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => addStep("sms")}>
              <Plus className="h-4 w-4" /> SMS
            </Button>
            <Button variant="outline" size="sm" onClick={() => addStep("wait")}>
              <Plus className="h-4 w-4" /> Wait
            </Button>
            <Button variant="outline" size="sm" onClick={() => addStep("branch")}>
              <Plus className="h-4 w-4" /> Branch on reply
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-success">Saved</span>}
          <Button onClick={saveSteps} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
