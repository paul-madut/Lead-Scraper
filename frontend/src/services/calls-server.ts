// services/calls-server.ts - server-side call logging (Admin SDK).
import type { CallOutcome, MessageDirection } from "@/lib/types";

const getAdminDb = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin services must only run on the server side");
  }
  const { adminDb } = await import("../lib/firebase-admin");
  return adminDb;
};

export async function logCall(params: {
  workspaceId: string;
  contactId: string | null;
  direction: MessageDirection;
  from: string;
  to: string;
  outcome: CallOutcome;
  durationSec: number;
  twilioCallSid?: string | null;
  createdBy: string;
}): Promise<string> {
  const adminDb = await getAdminDb();
  const now = new Date();

  const callRef = await adminDb.collection("calls").add({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
    direction: params.direction,
    from: params.from,
    to: params.to,
    outcome: params.outcome,
    durationSec: params.durationSec,
    twilioCallSid: params.twilioCallSid ?? null,
    createdBy: params.createdBy,
    createdAt: now,
  });

  // Mirror onto the contact timeline.
  if (params.contactId) {
    const mins = Math.floor(params.durationSec / 60);
    const secs = params.durationSec % 60;
    const dur = params.durationSec > 0 ? ` (${mins}m ${secs}s)` : "";
    await adminDb.collection("activities").add({
      workspaceId: params.workspaceId,
      contactId: params.contactId,
      type: "call",
      body: `${params.direction === "outbound" ? "Called" : "Call from"} ${params.to}${dur} - ${params.outcome}`,
      direction: params.direction,
      createdBy: params.createdBy,
      createdAt: now,
    });
    await adminDb
      .collection("contacts")
      .doc(params.contactId)
      .update({ lastActivityAt: now });
  }

  return callRef.id;
}
