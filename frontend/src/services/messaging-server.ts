// services/messaging-server.ts - server-side messaging persistence (Admin SDK).
// Conversations/messages are server-written only; clients read via realtime
// listeners. Deterministic conversation ids keep one thread per (number, contact).
import { createHash } from "crypto";
import type { MessageDirection, MessageStatus } from "@/lib/types";

const getAdminDb = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin services must only run on the server side");
  }
  const { adminDb } = await import("../lib/firebase-admin");
  return adminDb;
};

/** Normalize a phone number to a stable key for ids (E.164-ish). */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

function conversationId(workspacePhone: string, contactPhone: string): string {
  const key = `${normalizePhone(workspacePhone)}|${normalizePhone(contactPhone)}`;
  return createHash("sha1").update(key).digest("hex").slice(0, 24);
}

/** Look up which workspace owns an inbound number. */
export async function findWorkspaceByNumber(
  phoneNumber: string
): Promise<{ workspaceId: string; phoneNumber: string } | null> {
  const adminDb = await getAdminDb();
  const snap = await adminDb.collection("numbers").doc(normalizePhone(phoneNumber)).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return { workspaceId: data.workspaceId, phoneNumber: data.phoneNumber };
}

export async function attachNumber(params: {
  workspaceId: string;
  phoneNumber: string;
  label?: string;
}): Promise<void> {
  const adminDb = await getAdminDb();
  const id = normalizePhone(params.phoneNumber);
  await adminDb.collection("numbers").doc(id).set(
    {
      workspaceId: params.workspaceId,
      phoneNumber: id,
      label: params.label ?? null,
      createdAt: new Date(),
    },
    { merge: true }
  );
}

/** Detach a number from a workspace (no-op unless the workspace owns it). */
export async function removeNumber(params: {
  workspaceId: string;
  phoneNumber: string;
}): Promise<void> {
  const adminDb = await getAdminDb();
  const id = normalizePhone(params.phoneNumber);
  const ref = adminDb.collection("numbers").doc(id);
  const snap = await ref.get();
  if (snap.exists && snap.data()?.workspaceId === params.workspaceId) {
    await ref.delete();
  }
}

/** The workspace's primary sending number (falls back to the env number). */
export async function getWorkspacePrimaryNumber(
  workspaceId: string
): Promise<string | null> {
  const adminDb = await getAdminDb();
  const snap = await adminDb
    .collection("numbers")
    .where("workspaceId", "==", workspaceId)
    .limit(1)
    .get();
  if (!snap.empty) return snap.docs[0].data().phoneNumber as string;
  return process.env.TWILIO_PHONE_NUMBER
    ? normalizePhone(process.env.TWILIO_PHONE_NUMBER)
    : null;
}

export async function findContactByPhone(
  workspaceId: string,
  phone: string
): Promise<string | null> {
  const adminDb = await getAdminDb();
  const digits = normalizePhone(phone);
  const snap = await adminDb
    .collection("contacts")
    .where("workspaceId", "==", workspaceId)
    .get();
  // Phone formats vary (Google gives national format), so match on digits.
  const wanted = digits.replace(/\D/g, "").slice(-10);
  for (const doc of snap.docs) {
    const p = (doc.data().phone ?? "").replace(/\D/g, "").slice(-10);
    if (p && p === wanted) return doc.id;
  }
  return null;
}

export interface RecordMessageInput {
  workspaceId: string;
  workspacePhone: string;
  contactPhone: string;
  contactId: string | null;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  twilioSid?: string | null;
  errorMessage?: string | null;
}

/** Upsert the conversation and append a message, atomically. Returns ids. */
export async function recordMessage(
  input: RecordMessageInput
): Promise<{ conversationId: string; messageId: string }> {
  const adminDb = await getAdminDb();
  const convId = conversationId(input.workspacePhone, input.contactPhone);
  const convRef = adminDb.collection("conversations").doc(convId);
  const msgRef = adminDb.collection("messages").doc();
  const now = new Date();
  const preview = input.body.slice(0, 140);

  const batch = adminDb.batch();
  batch.set(
    convRef,
    {
      workspaceId: input.workspaceId,
      contactId: input.contactId,
      channel: "sms",
      contactPhone: normalizePhone(input.contactPhone),
      workspacePhone: normalizePhone(input.workspacePhone),
      lastMessageAt: now,
      lastMessagePreview: preview,
      lastDirection: input.direction,
      // Inbound messages mark the thread unread; outbound clears it.
      unread: input.direction === "inbound",
      updatedAt: now,
    },
    { merge: true }
  );
  batch.set(msgRef, {
    workspaceId: input.workspaceId,
    conversationId: convId,
    contactId: input.contactId,
    direction: input.direction,
    body: input.body,
    status: input.status,
    from: normalizePhone(input.direction === "outbound" ? input.workspacePhone : input.contactPhone),
    to: normalizePhone(input.direction === "outbound" ? input.contactPhone : input.workspacePhone),
    twilioSid: input.twilioSid ?? null,
    errorMessage: input.errorMessage ?? null,
    createdAt: now,
  });
  await batch.commit();

  return { conversationId: convId, messageId: msgRef.id };
}

export async function updateMessageStatusBySid(
  twilioSid: string,
  status: MessageStatus,
  errorMessage?: string
): Promise<void> {
  const adminDb = await getAdminDb();
  const snap = await adminDb
    .collection("messages")
    .where("twilioSid", "==", twilioSid)
    .limit(1)
    .get();
  if (snap.empty) return;
  await snap.docs[0].ref.update({
    status,
    errorMessage: errorMessage ?? null,
    updatedAt: new Date(),
  });
}

/** Mark a contact opted out of SMS (STOP keyword or manual). */
export async function markSmsOptOut(
  workspaceId: string,
  contactId: string,
  optedOut: boolean
): Promise<void> {
  const adminDb = await getAdminDb();
  await adminDb.collection("contacts").doc(contactId).update({
    optOutSms: optedOut,
    smsConsent: optedOut ? "denied" : "granted",
    updatedAt: new Date(),
  });
  await adminDb.collection("activities").add({
    workspaceId,
    contactId,
    type: "consent",
    body: optedOut
      ? "Contact replied STOP - SMS opt-out recorded"
      : "Contact replied START - SMS opt-in recorded",
    direction: "inbound",
    createdBy: "system",
    createdAt: new Date(),
  });
}

/** Append an activity to a contact's timeline (server-side). */
export async function addContactActivityAdmin(params: {
  workspaceId: string;
  contactId: string;
  type: "sms" | "call" | "note" | "consent";
  body: string;
  direction: MessageDirection | null;
  createdBy: string;
}): Promise<void> {
  const adminDb = await getAdminDb();
  const now = new Date();
  await adminDb.collection("activities").add({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
    type: params.type,
    body: params.body,
    direction: params.direction,
    createdBy: params.createdBy,
    createdAt: now,
  });
  await adminDb
    .collection("contacts")
    .doc(params.contactId)
    .update({ lastActivityAt: now });
}

export async function isContactOptedOut(contactId: string): Promise<boolean> {
  const adminDb = await getAdminDb();
  const snap = await adminDb.collection("contacts").doc(contactId).get();
  return Boolean(snap.exists && snap.data()?.optOutSms);
}
