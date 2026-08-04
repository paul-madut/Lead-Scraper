// services/flows-server.ts - sequence enrollment + the step processor.
// The processor is driven by a cron tick (a durable job runner built on
// Firestore, no external queue). One step per enrollment per tick.
import { isTwilioConfigured, sendSms } from "@/lib/twilio-server";
import {
  addContactActivityAdmin,
  getWorkspacePrimaryNumber,
  isContactOptedOut,
  recordMessage,
} from "@/services/messaging-server";
import type { SequenceStep } from "@/lib/types";

const DAY_MS = 86_400_000;

const getAdminDb = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin services must only run on the server side");
  }
  const { adminDb } = await import("../lib/firebase-admin");
  return adminDb;
};

/** Has the contact sent us an inbound message since a given time? */
async function hasRepliedSince(contactId: string, since: Date): Promise<boolean> {
  const adminDb = await getAdminDb();
  const snap = await adminDb
    .collection("messages")
    .where("contactId", "==", contactId)
    .limit(200)
    .get();
  return snap.docs.some((d) => {
    const m = d.data();
    const at = m.createdAt?.toDate?.() ?? new Date(0);
    return m.direction === "inbound" && at > since;
  });
}

export interface EnrollResult {
  enrolled: boolean;
  reason?: string;
}

export async function enrollContact(params: {
  workspaceId: string;
  sequenceId: string;
  contactId: string;
}): Promise<EnrollResult> {
  const adminDb = await getAdminDb();

  const [seqSnap, contactSnap] = await Promise.all([
    adminDb.collection("sequences").doc(params.sequenceId).get(),
    adminDb.collection("contacts").doc(params.contactId).get(),
  ]);
  if (!seqSnap.exists || seqSnap.data()?.workspaceId !== params.workspaceId) {
    return { enrolled: false, reason: "Sequence not found" };
  }
  if (!contactSnap.exists || contactSnap.data()?.workspaceId !== params.workspaceId) {
    return { enrolled: false, reason: "Contact not found" };
  }
  const contact = contactSnap.data()!;
  if (!contact.phone) {
    return { enrolled: false, reason: "Contact has no phone number" };
  }

  // Don't double-enroll into the same active sequence.
  const existing = await adminDb
    .collection("enrollments")
    .where("contactId", "==", params.contactId)
    .get();
  const alreadyActive = existing.docs.some(
    (d) =>
      d.data().sequenceId === params.sequenceId && d.data().status === "active"
  );
  if (alreadyActive) {
    return { enrolled: false, reason: "Already enrolled" };
  }

  const now = new Date();
  await adminDb.collection("enrollments").add({
    workspaceId: params.workspaceId,
    sequenceId: params.sequenceId,
    contactId: params.contactId,
    contactPhone: contact.phone,
    currentStep: 0,
    status: "active",
    startedAt: now,
    nextRunAt: now,
    lastError: null,
  });
  await addContactActivityAdmin({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
    type: "note",
    body: `Enrolled in sequence "${seqSnap.data()?.name ?? params.sequenceId}"`,
    direction: null,
    createdBy: "system",
  });
  return { enrolled: true };
}

export interface TickSummary {
  processed: number;
  advanced: number;
  completed: number;
  stopped: number;
  failed: number;
}

/** Process every enrollment whose next step is due. */
export async function processDueEnrollments(limit = 50): Promise<TickSummary> {
  const adminDb = await getAdminDb();
  const now = new Date();
  const due = await adminDb
    .collection("enrollments")
    .where("status", "==", "active")
    .where("nextRunAt", "<=", now)
    .limit(limit)
    .get();

  const summary: TickSummary = {
    processed: 0,
    advanced: 0,
    completed: 0,
    stopped: 0,
    failed: 0,
  };

  for (const doc of due.docs) {
    summary.processed++;
    try {
      const outcome = await runEnrollmentStep(doc.id);
      summary[outcome]++;
    } catch (err) {
      summary.failed++;
      await doc.ref.update({
        lastError: err instanceof Error ? err.message : "step failed",
        // Back off and retry in an hour rather than hot-looping.
        nextRunAt: new Date(Date.now() + 3_600_000),
      });
    }
  }
  return summary;
}

type StepOutcome = "advanced" | "completed" | "stopped" | "failed";

async function runEnrollmentStep(enrollmentId: string): Promise<StepOutcome> {
  const adminDb = await getAdminDb();
  const ref = adminDb.collection("enrollments").doc(enrollmentId);
  const snap = await ref.get();
  if (!snap.exists) return "failed";
  const e = snap.data()!;

  const seqSnap = await adminDb.collection("sequences").doc(e.sequenceId).get();
  if (!seqSnap.exists) {
    await ref.update({ status: "failed", lastError: "Sequence deleted" });
    return "failed";
  }
  const seq = seqSnap.data()!;
  const steps: SequenceStep[] = seq.steps ?? [];
  const startedAt: Date = e.startedAt?.toDate?.() ?? new Date(0);

  // Global branch: stop the moment the contact replies.
  if (seq.stopOnReply && (await hasRepliedSince(e.contactId, startedAt))) {
    await ref.update({ status: "stopped" });
    await addContactActivityAdmin({
      workspaceId: e.workspaceId,
      contactId: e.contactId,
      type: "note",
      body: `Sequence "${seq.name}" stopped - contact replied`,
      direction: null,
      createdBy: "system",
    });
    return "stopped";
  }

  const idx: number = e.currentStep ?? 0;
  if (idx >= steps.length) {
    await ref.update({ status: "completed" });
    return "completed";
  }
  const step = steps[idx];
  const now = new Date();

  if (step.type === "sms") {
    const optedOut = await isContactOptedOut(e.contactId);
    if (!optedOut) {
      const from = await getWorkspacePrimaryNumber(e.workspaceId);
      if (from && isTwilioConfigured()) {
        const sent = await sendSms({ to: e.contactPhone, body: step.body });
        await recordMessage({
          workspaceId: e.workspaceId,
          workspacePhone: from,
          contactPhone: e.contactPhone,
          contactId: e.contactId,
          direction: "outbound",
          body: step.body,
          status: (sent.status as never) ?? "sent",
          twilioSid: sent.sid,
        });
        await addContactActivityAdmin({
          workspaceId: e.workspaceId,
          contactId: e.contactId,
          type: "sms",
          body: step.body,
          direction: "outbound",
          createdBy: "system",
        });
      } else {
        await addContactActivityAdmin({
          workspaceId: e.workspaceId,
          contactId: e.contactId,
          type: "note",
          body: `Sequence SMS skipped (SMS not configured): ${step.body}`,
          direction: null,
          createdBy: "system",
        });
      }
    }
    await ref.update({ currentStep: idx + 1, nextRunAt: now, lastError: null });
    return "advanced";
  }

  if (step.type === "wait") {
    await ref.update({
      currentStep: idx + 1,
      nextRunAt: new Date(now.getTime() + step.days * DAY_MS),
      lastError: null,
    });
    return "advanced";
  }

  // branch on reply
  const replied = await hasRepliedSince(e.contactId, startedAt);
  if (replied && step.jumpTo < 0) {
    await ref.update({ status: "completed" });
    return "completed";
  }
  const target = replied ? step.jumpTo : idx + 1;
  await ref.update({ currentStep: target, nextRunAt: now, lastError: null });
  return "advanced";
}
