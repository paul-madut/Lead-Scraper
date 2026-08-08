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
import { nextSendTime, timezoneForPhone } from "@/lib/phone-timezone";
import { ensureOptOut, renderTemplate } from "@/lib/sms-template";
import type { SendWindow, SequenceStep } from "@/lib/types";

const HOUR_MS = 3_600_000;
const DEFAULT_SEND_WINDOW: SendWindow = { startHour: 8, endHour: 21 };
// Default spacing between successive contacts in a bulk enroll, so a batch
// doesn't fire from one number in the same second (a carrier spam signal).
const DEFAULT_SPACING_SECONDS = 45;

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
  /** When the first step should fire. Defaults to now (send immediately). */
  startAt?: Date;
  /** Position in a batch, used to rotate a multi-number sender pool evenly. */
  rotationIndex?: number;
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

  // Assign a sender from the sequence's number pool: one number = fixed sender,
  // many = rotate evenly across contacts (sticky per contact for a coherent
  // thread). Empty pool -> null, and the engine falls back to the workspace
  // default / env number at send time.
  const pool: string[] = Array.isArray(seqSnap.data()?.fromNumbers)
    ? seqSnap.data()!.fromNumbers
    : [];
  let fromNumber: string | null = null;
  if (pool.length === 1) {
    fromNumber = pool[0];
  } else if (pool.length > 1) {
    let idx = params.rotationIndex;
    if (idx == null) {
      const c = await adminDb
        .collection("enrollments")
        .where("sequenceId", "==", params.sequenceId)
        .count()
        .get();
      idx = c.data().count;
    }
    fromNumber = pool[idx % pool.length];
  }

  const now = new Date();
  const start = params.startAt && params.startAt > now ? params.startAt : now;
  await adminDb.collection("enrollments").add({
    workspaceId: params.workspaceId,
    sequenceId: params.sequenceId,
    contactId: params.contactId,
    contactPhone: contact.phone,
    currentStep: 0,
    status: "active",
    startedAt: now,
    scheduledStart: start,
    fromNumber: fromNumber ?? null,
    nextRunAt: start,
    lastError: null,
  });
  const seqName = seqSnap.data()?.name ?? params.sequenceId;
  const when =
    start > now ? ` (scheduled for ${start.toLocaleString()})` : "";
  await addContactActivityAdmin({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
    type: "note",
    body: `Enrolled in sequence "${seqName}"${when}`,
    direction: null,
    createdBy: "system",
  });
  return { enrolled: true };
}

export interface BulkEnrollResult {
  enrolled: number;
  skipped: { contactId: string; reason: string }[];
}

/**
 * Enroll many contacts into one sequence with a shared start, staggering each
 * successive contact by `spacingSeconds` so the batch doesn't burst from a
 * single number. Skips (already-enrolled, no phone) are reported, not fatal.
 */
export async function enrollContactsBulk(params: {
  workspaceId: string;
  sequenceId: string;
  contactIds: string[];
  startAt?: Date;
  spacingSeconds?: number;
}): Promise<BulkEnrollResult> {
  const base = params.startAt ?? new Date();
  const spacing = params.spacingSeconds ?? DEFAULT_SPACING_SECONDS;
  const result: BulkEnrollResult = { enrolled: 0, skipped: [] };

  let i = 0;
  for (const contactId of params.contactIds) {
    const startAt = new Date(base.getTime() + i * spacing * 1000);
    const res = await enrollContact({
      workspaceId: params.workspaceId,
      sequenceId: params.sequenceId,
      contactId,
      startAt,
      rotationIndex: i,
    });
    if (res.enrolled) result.enrolled++;
    else result.skipped.push({ contactId, reason: res.reason ?? "skipped" });
    i++;
  }
  return result;
}

export interface TickSummary {
  processed: number;
  advanced: number;
  completed: number;
  stopped: number;
  failed: number;
  // Held for quiet hours (recipient outside the send window); retried later.
  deferred: number;
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
    deferred: 0,
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

type StepOutcome =
  | "advanced"
  | "completed"
  | "stopped"
  | "failed"
  | "deferred";

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
    // A contact who opted out is skipped silently; still advance the sequence.
    if (await isContactOptedOut(e.contactId)) {
      await ref.update({ currentStep: idx + 1, nextRunAt: now, lastError: null });
      return "advanced";
    }

    // Quiet hours: hold the send until the recipient's local window opens.
    const win: SendWindow = seq.sendWindow ?? DEFAULT_SEND_WINDOW;
    const tz = timezoneForPhone(e.contactPhone);
    const sendAt = nextSendTime(tz, now, win.startHour, win.endHour);
    if (sendAt.getTime() > now.getTime()) {
      // Do NOT advance: re-run this same step when the window reopens.
      await ref.update({ nextRunAt: sendAt, lastError: null });
      return "deferred";
    }

    // Personalize from the contact, and guarantee an opt-out path on the very
    // first SMS the contact receives in this sequence.
    const contactSnap = await adminDb.collection("contacts").doc(e.contactId).get();
    const contact = contactSnap.data() ?? {};
    let body = renderTemplate(step.body, {
      name: contact.name ?? "",
      companyName: contact.companyName ?? null,
      phone: e.contactPhone,
      address: contact.address ?? null,
    });
    const firstSmsIdx = steps.findIndex((s) => s.type === "sms");
    if (idx === firstSmsIdx) body = ensureOptOut(body);

    // Prefer the number assigned to this enrollment (from the campaign's pool),
    // falling back to the workspace default / env number.
    const from = e.fromNumber || (await getWorkspacePrimaryNumber(e.workspaceId));
    if (from && isTwilioConfigured()) {
      const sent = await sendSms({ to: e.contactPhone, body, from });
      await recordMessage({
        workspaceId: e.workspaceId,
        workspacePhone: from,
        contactPhone: e.contactPhone,
        contactId: e.contactId,
        direction: "outbound",
        body,
        status: (sent.status as never) ?? "sent",
        twilioSid: sent.sid,
      });
      await addContactActivityAdmin({
        workspaceId: e.workspaceId,
        contactId: e.contactId,
        type: "sms",
        body,
        direction: "outbound",
        createdBy: "system",
      });
    } else {
      // Dry-run: no Twilio yet. Log exactly what WOULD have gone out so a
      // scheduled batch is fully visible on the timeline before real sends.
      await addContactActivityAdmin({
        workspaceId: e.workspaceId,
        contactId: e.contactId,
        type: "note",
        body: `[dry-run] would text ${e.contactPhone} from ${from ?? "(no number set)"}: ${body}`,
        direction: null,
        createdBy: "system",
      });
    }
    await ref.update({ currentStep: idx + 1, nextRunAt: now, lastError: null });
    return "advanced";
  }

  if (step.type === "wait") {
    // Canonical unit is hours; tolerate legacy day-based docs defensively.
    const legacyDays = (step as { days?: number }).days;
    const hours = step.hours ?? (legacyDays != null ? legacyDays * 24 : 0);
    await ref.update({
      currentStep: idx + 1,
      nextRunAt: new Date(now.getTime() + hours * HOUR_MS),
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
