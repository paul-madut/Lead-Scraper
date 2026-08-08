"use client";

import { useEffect, useState } from "react";
import { Phone, Plus, Trash2, Hash } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWorkspace } from "@/components/WorkspaceProvider";
import {
  subscribeWorkspaceNumbers,
  attachWorkspaceNumber,
  removeWorkspaceNumber,
} from "@/services/messaging";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkspaceNumber } from "@/lib/types";

export default function NumbersPage() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const [numbers, setNumbers] = useState<WorkspaceNumber[]>([]);
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    return subscribeWorkspaceNumbers(workspaceId, setNumbers);
  }, [workspaceId]);

  const onAdd = async () => {
    if (!user || !phone.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      await attachWorkspaceNumber(token, phone.trim(), label.trim() || undefined);
      setPhone("");
      setLabel("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add number");
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (phoneNumber: string) => {
    if (!user) return;
    const token = await user.getIdToken();
    await removeWorkspaceNumber(token, phoneNumber);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Phone className="h-6 w-6 text-primary" />
          Numbers
        </h1>
        <p className="text-muted-foreground">
          The phone numbers you send from. Attach numbers you own in Twilio,
          label them by market, then pick which ones each sequence uses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attach a number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+16135550123 (E.164)"
              className="flex-1"
            />
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. Ottawa)"
              className="flex-1"
            />
            <Button onClick={onAdd} disabled={busy || !phone.trim()}>
              <Plus className="h-4 w-4" /> {busy ? "Adding..." : "Add"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Must be a number you own in Twilio. Inbound texts to it route to your
            inbox.
          </p>
        </CardContent>
      </Card>

      {numbers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Hash className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No numbers yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Attach your first Twilio number above to start sending.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {numbers.map((n) => (
            <div key={n.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.phoneNumber}</p>
                {n.label && (
                  <p className="text-xs text-muted-foreground">{n.label}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(n.phoneNumber)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove number"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
