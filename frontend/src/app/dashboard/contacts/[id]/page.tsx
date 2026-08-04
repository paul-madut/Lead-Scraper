"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  getContact,
  listActivities,
  addNote,
  updateContactStage,
  setContactConsent,
} from "@/services/contacts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PIPELINE_STAGES, stageLabel, stageTone } from "@/lib/crm";
import type { Activity, Contact, ConsentState } from "@/lib/types";

const CONSENT_TONE: Record<ConsentState, "success" | "muted" | "secondary"> = {
  granted: "success",
  denied: "muted",
  unknown: "secondary",
};

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!params?.id) return;
    const [c, a] = await Promise.all([
      getContact(params.id),
      listActivities(params.id),
    ]);
    setContact(c);
    setActivities(a);
  }, [params?.id]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    refresh().finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [refresh]);

  const onStageChange = async (stage: string) => {
    if (!contact || !user) return;
    await updateContactStage(contact, user.uid, stage);
    await refresh();
  };

  const onConsent = async (channel: "sms" | "call", value: ConsentState) => {
    if (!contact || !user) return;
    await setContactConsent(contact, user.uid, channel, value);
    await refresh();
  };

  const onAddNote = async () => {
    if (!contact || !user || !note.trim()) return;
    setSaving(true);
    try {
      await addNote(contact, user.uid, note.trim());
      setNote("");
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Link href="/dashboard/contacts" className="text-sm text-primary hover:underline">
          &larr; Back to contacts
        </Link>
        <p className="mt-6 text-muted-foreground">
          This contact could not be found, or you don&apos;t have access to it.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <Link
        href="/dashboard/contacts"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to contacts
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{contact.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </a>
                )}
                {contact.website && (
                  <a href={contact.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
              </div>
              {contact.address && (
                <div className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {contact.address}
                </div>
              )}
              {contact.rating != null && (
                <div className="mt-1 inline-flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {contact.rating.toFixed(1)}
                  {contact.totalReviews != null && (
                    <span className="text-muted-foreground">({contact.totalReviews})</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Stage
            </label>
            <select
              value={contact.stage}
              onChange={(e) => onStageChange(e.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Compliance / consent - front and center before outreach */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outreach consent</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ConsentRow
            label="SMS"
            value={contact.optOutSms ? "denied" : contact.smsConsent}
            locked={contact.optOutSms}
            onSet={(v) => onConsent("sms", v)}
          />
          <ConsentRow
            label="Calls"
            value={contact.dncCall ? "denied" : contact.callConsent}
            locked={contact.dncCall}
            onSet={(v) => onConsent("call", v)}
          />
        </CardContent>
      </Card>

      {/* Notes + timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 resize-y rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button onClick={onAddNote} disabled={saving || !note.trim()}>
              {saving ? "Saving..." : "Add note"}
            </Button>
          </div>

          <ol className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{a.body}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.type}
                    {" · "}
                    {a.createdAt.toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
            {activities.length === 0 && (
              <li className="text-sm text-muted-foreground">No activity yet.</li>
            )}
          </ol>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={stageTone(contact.stage)}>{stageLabel(contact.stage)}</Badge>
        <span>Added {contact.createdAt.toLocaleDateString()}</span>
        <span className="capitalize">· {contact.source}</span>
      </div>
    </div>
  );
}

function ConsentRow({
  label,
  value,
  locked,
  onSet,
}: {
  label: string;
  value: ConsentState;
  locked: boolean;
  onSet: (v: ConsentState) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-sm font-medium">{label}</span>
      <Badge variant={CONSENT_TONE[value]}>
        {value === "granted" ? (
          <ShieldCheck className="h-3 w-3" />
        ) : value === "denied" ? (
          <ShieldAlert className="h-3 w-3" />
        ) : null}
        {locked ? "opted out" : value}
      </Badge>
      {!locked && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onSet("granted")}
            className="rounded-md border px-2 py-1 text-xs hover:border-success hover:text-success"
          >
            Granted
          </button>
          <button
            type="button"
            onClick={() => onSet("denied")}
            className="rounded-md border px-2 py-1 text-xs hover:border-destructive hover:text-destructive"
          >
            Denied
          </button>
        </div>
      )}
    </div>
  );
}
