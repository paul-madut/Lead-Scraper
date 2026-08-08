// services/sequences.ts - client CRUD for sequences + enroll/read enrollments.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type {
  Enrollment,
  SendWindow,
  Sequence,
  SequenceStep,
} from "@/lib/types";

const toDate = (v: Timestamp | undefined | null): Date => v?.toDate?.() ?? new Date(0);

function toSequence(snap: QueryDocumentSnapshot<DocumentData>): Sequence {
  const d = snap.data();
  return {
    id: snap.id,
    workspaceId: d.workspaceId,
    name: d.name ?? "Untitled",
    status: d.status ?? "draft",
    stopOnReply: d.stopOnReply ?? true,
    sendWindow: d.sendWindow ?? undefined,
    fromNumbers: Array.isArray(d.fromNumbers) ? d.fromNumbers : [],
    steps: Array.isArray(d.steps) ? d.steps : [],
    createdBy: d.createdBy ?? "",
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export async function createSequence(
  workspaceId: string,
  userId: string,
  name: string
): Promise<string> {
  const ref = await addDoc(collection(db, "sequences"), {
    workspaceId,
    name,
    status: "draft",
    stopOnReply: true,
    steps: [],
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listSequences(workspaceId: string): Promise<Sequence[]> {
  const q = query(
    collection(db, "sequences"),
    where("workspaceId", "==", workspaceId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(toSequence);
}

export async function getSequence(id: string): Promise<Sequence | null> {
  const snap = await getDoc(doc(db, "sequences", id));
  if (!snap.exists()) return null;
  return toSequence(snap as QueryDocumentSnapshot<DocumentData>);
}

export async function updateSequence(
  id: string,
  patch: {
    name?: string;
    status?: "draft" | "active";
    stopOnReply?: boolean;
    sendWindow?: SendWindow;
    fromNumbers?: string[];
    steps?: SequenceStep[];
  }
): Promise<void> {
  await updateDoc(doc(db, "sequences", id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteSequence(id: string): Promise<void> {
  await deleteDoc(doc(db, "sequences", id));
}

export async function enrollContactApi(
  idToken: string,
  sequenceId: string,
  contactId: string
): Promise<{ ok: boolean; reason?: string }> {
  const res = await fetch("/api/flows/enroll", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ sequenceId, contactId }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, reason: data.reason || data.error || "Failed" };
  return { ok: true };
}

export interface BulkEnrollResponse {
  ok: boolean;
  enrolled?: number;
  skipped?: { contactId: string; reason: string }[];
  reason?: string;
}

/** Enroll many contacts at once, optionally scheduled for a future start. */
export async function enrollBulkApi(
  idToken: string,
  params: { sequenceId: string; contactIds: string[]; startAt?: Date }
): Promise<BulkEnrollResponse> {
  const res = await fetch("/api/flows/enroll-bulk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      sequenceId: params.sequenceId,
      contactIds: params.contactIds,
      startAt: params.startAt ? params.startAt.toISOString() : undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, reason: data.reason || data.error || "Failed" };
  return { ok: true, enrolled: data.enrolled, skipped: data.skipped };
}

export async function listContactEnrollments(contactId: string): Promise<Enrollment[]> {
  const q = query(
    collection(db, "enrollments"),
    where("contactId", "==", contactId),
    orderBy("startedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((s) => {
    const d = s.data();
    return {
      id: s.id,
      workspaceId: d.workspaceId,
      sequenceId: d.sequenceId,
      contactId: d.contactId,
      contactPhone: d.contactPhone ?? "",
      currentStep: d.currentStep ?? 0,
      status: d.status ?? "active",
      startedAt: toDate(d.startedAt),
      scheduledStart: d.scheduledStart ? toDate(d.scheduledStart) : undefined,
      fromNumber: d.fromNumber ?? undefined,
      nextRunAt: toDate(d.nextRunAt),
      lastError: d.lastError ?? null,
    };
  });
}
