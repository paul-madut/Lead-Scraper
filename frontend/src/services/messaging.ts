// services/messaging.ts - client-side messaging: realtime reads + send.
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Conversation, Message, WorkspaceNumber } from "@/lib/types";

const toDate = (v: Timestamp | undefined | null): Date | null =>
  v?.toDate?.() ?? null;

function toConversation(snap: QueryDocumentSnapshot<DocumentData>): Conversation {
  const d = snap.data();
  return {
    id: snap.id,
    workspaceId: d.workspaceId,
    contactId: d.contactId ?? null,
    channel: "sms",
    contactPhone: d.contactPhone ?? "",
    workspacePhone: d.workspacePhone ?? "",
    lastMessageAt: toDate(d.lastMessageAt),
    lastMessagePreview: d.lastMessagePreview ?? "",
    lastDirection: d.lastDirection ?? null,
    unread: d.unread ?? false,
  };
}

function toMessage(snap: QueryDocumentSnapshot<DocumentData>): Message {
  const d = snap.data();
  return {
    id: snap.id,
    workspaceId: d.workspaceId,
    conversationId: d.conversationId,
    contactId: d.contactId ?? null,
    direction: d.direction,
    body: d.body ?? "",
    status: d.status ?? "sent",
    from: d.from ?? "",
    to: d.to ?? "",
    twilioSid: d.twilioSid ?? null,
    errorMessage: d.errorMessage ?? null,
    createdAt: toDate(d.createdAt) ?? new Date(0),
  };
}

export function subscribeConversations(
  workspaceId: string,
  cb: (conversations: Conversation[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    collection(db, "conversations"),
    where("workspaceId", "==", workspaceId),
    orderBy("lastMessageAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map(toConversation)),
    (err) => onError?.(err)
  );
}

export function subscribeMessages(
  conversationId: string,
  cb: (messages: Message[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map(toMessage)),
    (err) => onError?.(err)
  );
}

export function subscribeWorkspaceNumbers(
  workspaceId: string,
  cb: (numbers: WorkspaceNumber[]) => void
): () => void {
  const q = query(
    collection(db, "numbers"),
    where("workspaceId", "==", workspaceId)
  );
  return onSnapshot(q, (snap) =>
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        workspaceId: d.data().workspaceId,
        phoneNumber: d.data().phoneNumber,
        label: d.data().label ?? null,
        createdAt: toDate(d.data().createdAt) ?? new Date(0),
      }))
    )
  );
}

export async function sendSmsMessage(
  idToken: string,
  payload: { to: string; body: string; contactId?: string }
): Promise<{ conversationId: string; messageId: string }> {
  const res = await fetch("/api/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send message");
  return data;
}

export async function attachWorkspaceNumber(
  idToken: string,
  phoneNumber: string,
  label?: string
): Promise<void> {
  const res = await fetch("/api/numbers/attach", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ phoneNumber, label }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to attach number");
}
