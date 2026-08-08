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
  Phone,
} from "lucide-react";
import { getSequence, updateSequence, deleteSequence } from "@/services/sequences";
import { subscribeWorkspaceNumbers } from "@/services/messaging";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_MERGE_FIELDS } from "@/lib/sms-template";
import type {
  Sequence,
  SendWindow,
  SequenceStep,
  WorkspaceNumber,
} from "@/lib/types";

let stepCounter = 0;
const newId = () => `s${Date.now()}_${stepCounter++}`;

const DEFAULT_SEND_WINDOW: SendWindow = { startHour: 8, endHour: 21 };
const MERGE_HINT = SUPPORTED_MERGE_FIELDS.map((f) => `{{${f}}}`).join(" ");

const clampHour = (raw: string, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, parseInt(raw, 10) || lo));

// Show whole-day waits in days, sub-day waits in hours, by default.
const defaultUnit = (hours: number): "hours" | "days" =>
  hours >= 24 && hours % 24 === 0 ? "days" : "hours";

export default function SequenceBuilderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { workspaceId } = useWorkspace();
  const [seq, setSeq] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [name, setName] = useState("");
  const [stopOnReply, setStopOnReply] = useState(true);
  const [sendWindow, setSendWindow] = useState<SendWindow>(DEFAULT_SEND_WINDOW);
  const [fromNumbers, setFromNumbers] = useState<string[]>([]);
  const [numbers, setNumbers] = useState<WorkspaceNumber[]>([]);
  const [waitUnit, setWaitUnit] = useState<Record<string, "hours" | "days">>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    return subscribeWorkspaceNumbers(workspaceId, setNumbers);
  }, [workspaceId]);

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
        setSendWindow(s.sendWindow ?? DEFAULT_SEND_WINDOW);
        setFromNumbers(s.fromNumbers ?? []);
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
          ? { id: newId(), type: "wait", hours: 24 }
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

  const saveSteps = () =>
    persist({ steps, name, stopOnReply, sendWindow, fromNumbers });

  const toggleActive = () => {
    if (!seq) return;
    const next = seq.status === "active" ? "draft" : "active";
    setSeq({ ...seq, status: next });
    persist({ status: next, steps, name, stopOnReply, sendWindow, fromNumbers });
  };

  const toggleNumber = (phone: string) =>
    setFromNumbers((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );

  const onDelete = async () => {
    if (!params?.id) return;
    await deleteSequence(params.id);
    router.push("/dashboard/sequences");
  };

  // The first SMS is where the opt-out line is auto-appended at send time.
  const firstSmsIndex = steps.findIndex((s) => s.type === "sms");

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

          <div className="space-y-1.5 border-t pt-4">
            <span className="text-sm font-medium">Quiet hours</span>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Only text between</span>
              <Input
                type="number"
                min={0}
                max={23}
                value={sendWindow.startHour}
                onChange={(e) =>
                  setSendWindow((w) => ({
                    ...w,
                    startHour: clampHour(e.target.value, 0, 23),
                  }))
                }
                className="w-16"
              />
              <span className="text-muted-foreground">:00 and</span>
              <Input
                type="number"
                min={1}
                max={24}
                value={sendWindow.endHour}
                onChange={(e) =>
                  setSendWindow((w) => ({
                    ...w,
                    endHour: clampHour(e.target.value, 1, 24),
                  }))
                }
                className="w-16"
              />
              <span className="text-muted-foreground">
                :00, in each contact&apos;s local time
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Sends outside this window are held until it reopens. 8-21 keeps you
              inside the TCPA 8am-9pm rule.
            </p>
          </div>

          <div className="space-y-1.5 border-t pt-4">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Phone className="h-4 w-4 text-primary" /> Send from
            </span>
            {numbers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No numbers attached. Add one under{" "}
                <Link href="/dashboard/numbers" className="text-primary hover:underline">
                  Numbers
                </Link>{" "}
                - until then this campaign uses your default number.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {numbers.map((n) => {
                    const on = fromNumbers.includes(n.phoneNumber);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => toggleNumber(n.phoneNumber)}
                        className={
                          on
                            ? "rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-sm"
                            : "rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                        }
                      >
                        {n.label ? `${n.label} · ` : ""}
                        {n.phoneNumber}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {fromNumbers.length === 0
                    ? "None selected - uses your default number."
                    : fromNumbers.length === 1
                      ? "All contacts send from this number."
                      : `Rotated across ${fromNumbers.length} numbers - one sticky number per contact.`}
                </p>
              </>
            )}
          </div>
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
                <div className="space-y-1.5">
                  <textarea
                    value={step.body}
                    onChange={(e) => updateStep(step.id, { body: e.target.value })}
                    placeholder="Message text..."
                    rows={2}
                    className="w-full resize-y rounded-md border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Merge fields: {MERGE_HINT}
                    {i === firstSmsIndex && " · an opt-out line is added automatically"}
                  </p>
                </div>
              )}
              {step.type === "wait" && (
                <WaitStepEditor
                  hours={step.hours}
                  unit={waitUnit[step.id] ?? defaultUnit(step.hours)}
                  onUnitChange={(u) =>
                    setWaitUnit((m) => ({ ...m, [step.id]: u }))
                  }
                  onHoursChange={(h) => updateStep(step.id, { hours: h })}
                />
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

function WaitStepEditor({
  hours,
  unit,
  onUnitChange,
  onHoursChange,
}: {
  hours: number;
  unit: "hours" | "days";
  onUnitChange: (u: "hours" | "days") => void;
  onHoursChange: (hours: number) => void;
}) {
  const displayValue = unit === "days" ? hours / 24 : hours;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>Wait</span>
      <Input
        type="number"
        min={1}
        value={displayValue}
        onChange={(e) => {
          const n = Math.max(1, parseInt(e.target.value, 10) || 1);
          onHoursChange(unit === "days" ? n * 24 : n);
        }}
        className="w-20"
      />
      <select
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as "hours" | "days")}
        className="rounded-md border bg-card px-2 py-2 text-sm outline-none focus:border-primary"
      >
        <option value="hours">hour(s)</option>
        <option value="days">day(s)</option>
      </select>
      <span className="text-muted-foreground">before the next step</span>
    </div>
  );
}
