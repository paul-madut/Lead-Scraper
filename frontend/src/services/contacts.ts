// services/contacts.ts - client-side CRM data access. Firestore rules enforce
// that every read/write is scoped to a workspace the user belongs to.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
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
import {
  DEFAULT_CALL_STATUS,
  DEFAULT_STAGE,
  callStatusLabel,
  contactFieldsFromBusiness,
} from "@/lib/crm";
import type {
  Activity,
  ActivityType,
  Business,
  CallStatus,
  ConsentState,
  Contact,
} from "@/lib/types";

const toDate = (v: Timestamp | undefined | null): Date =>
  v?.toDate?.() ?? new Date(0);

function toContact(snap: QueryDocumentSnapshot<DocumentData>): Contact {
  const d = snap.data();
  return {
    id: snap.id,
    workspaceId: d.workspaceId,
    name: d.name ?? "",
    companyName: d.companyName ?? null,
    phone: d.phone ?? null,
    email: d.email ?? null,
    website: d.website ?? null,
    address: d.address ?? null,
    source: d.source ?? "manual",
    placeId: d.placeId ?? null,
    rating: d.rating ?? null,
    totalReviews: d.totalReviews ?? null,
    tags: Array.isArray(d.tags) ? d.tags : [],
    stage: d.stage ?? DEFAULT_STAGE,
    callStatus: d.callStatus ?? DEFAULT_CALL_STATUS,
    ownerId: d.ownerId ?? "",
    smsConsent: d.smsConsent ?? "unknown",
    callConsent: d.callConsent ?? "unknown",
    dncCall: d.dncCall ?? false,
    optOutSms: d.optOutSms ?? false,
    createdBy: d.createdBy ?? "",
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
    lastActivityAt: d.lastActivityAt ? toDate(d.lastActivityAt) : null,
  };
}

export async function listContacts(workspaceId: string): Promise<Contact[]> {
  const q = query(
    collection(db, "contacts"),
    where("workspaceId", "==", workspaceId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(toContact);
}

export async function getContact(id: string): Promise<Contact | null> {
  const snap = await getDoc(doc(db, "contacts", id));
  if (!snap.exists()) return null;
  return toContact(snap as QueryDocumentSnapshot<DocumentData>);
}

async function findByPlaceId(
  workspaceId: string,
  placeId: string
): Promise<string | null> {
  const q = query(
    collection(db, "contacts"),
    where("workspaceId", "==", workspaceId),
    where("placeId", "==", placeId),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}

export interface PromoteResult {
  id: string;
  created: boolean;
}

/** Convert a scraped Business into a workspace contact, deduped by place_id. */
export async function promoteBusinessToContact(
  workspaceId: string,
  userId: string,
  business: Business
): Promise<PromoteResult> {
  const existing = await findByPlaceId(workspaceId, business.place_id);
  if (existing) return { id: existing, created: false };

  const ref = await addDoc(collection(db, "contacts"), {
    workspaceId,
    ...contactFieldsFromBusiness(business),
    tags: [],
    stage: DEFAULT_STAGE,
    callStatus: DEFAULT_CALL_STATUS,
    ownerId: userId,
    smsConsent: "unknown",
    callConsent: "unknown",
    dncCall: false,
    optOutSms: false,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });

  await addActivity(workspaceId, ref.id, userId, "created", "Added to CRM from a scraped lead");
  return { id: ref.id, created: true };
}

export async function updateContactStage(
  contact: Contact,
  userId: string,
  stage: string
): Promise<void> {
  await updateDoc(doc(db, "contacts", contact.id), {
    stage,
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });
  await addActivity(
    contact.workspaceId,
    contact.id,
    userId,
    "stage_change",
    `Stage changed to ${stage}`
  );
}

export async function setCallStatus(
  contact: Contact,
  userId: string,
  status: CallStatus
): Promise<void> {
  await updateDoc(doc(db, "contacts", contact.id), {
    callStatus: status,
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });
  await addActivity(
    contact.workspaceId,
    contact.id,
    userId,
    "call",
    `Marked "${callStatusLabel(status)}"`
  );
}

export async function setContactConsent(
  contact: Contact,
  userId: string,
  channel: "sms" | "call",
  value: ConsentState
): Promise<void> {
  const field = channel === "sms" ? "smsConsent" : "callConsent";
  await updateDoc(doc(db, "contacts", contact.id), {
    [field]: value,
    updatedAt: serverTimestamp(),
  });
  await addActivity(
    contact.workspaceId,
    contact.id,
    userId,
    "consent",
    `${channel.toUpperCase()} consent set to ${value}`
  );
}

export async function addNote(
  contact: Contact,
  userId: string,
  body: string
): Promise<void> {
  await addActivity(contact.workspaceId, contact.id, userId, "note", body);
  await updateDoc(doc(db, "contacts", contact.id), {
    lastActivityAt: serverTimestamp(),
  });
}

export async function addActivity(
  workspaceId: string,
  contactId: string,
  userId: string,
  type: ActivityType,
  body: string,
  direction: "inbound" | "outbound" | null = null
): Promise<void> {
  await addDoc(collection(db, "activities"), {
    workspaceId,
    contactId,
    type,
    body,
    direction,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
}

function toActivity(snap: QueryDocumentSnapshot<DocumentData>): Activity {
  const d = snap.data();
  return {
    id: snap.id,
    workspaceId: d.workspaceId,
    contactId: d.contactId,
    type: d.type ?? "note",
    body: d.body ?? "",
    direction: d.direction ?? null,
    createdBy: d.createdBy ?? "",
    createdAt: toDate(d.createdAt),
  };
}

export async function listActivities(contactId: string): Promise<Activity[]> {
  const q = query(
    collection(db, "activities"),
    where("contactId", "==", contactId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(toActivity);
}
