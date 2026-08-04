// services/searchSession.ts - server-side pagination cursor + atomic billing.
// One document per (user, normalized query) records which place_ids have
// already been delivered. Charging and cursor-recording happen in a SINGLE
// transaction so they can never diverge (crash-safe) and concurrent searches
// for the same area re-read the authoritative seen-set (no double-charge).
import { createHash } from "crypto";
import type { DocumentReference } from "firebase-admin/firestore";
import { PRICING_CONFIG, chargeForResults } from "@/lib/pricing";
import type { Business } from "@/lib/types";

const getAdminDb = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin services must only run on the server side");
  }
  const { adminDb } = await import("../lib/firebase-admin");
  return adminDb;
};

export interface SessionState {
  ref: DocumentReference;
  seenPlaceIds: Set<string>;
}

export interface SettleResult {
  charged: Business[];
  tokensCharged: number;
  remaining: number;
  areaExhausted: boolean;
  duplicate: boolean;
}

function queryKey(
  userId: string,
  keyword: string,
  location: string,
  radius: number
): string {
  const norm = `${keyword.trim().toLowerCase()}|${location
    .trim()
    .toLowerCase()}|${radius}`;
  const hash = createHash("sha1").update(norm).digest("hex").slice(0, 16);
  return `${userId}_${hash}`;
}

export class SearchSessionService {
  /** Snapshot of already-delivered place_ids, used to pre-filter the scrape. */
  static async load(
    userId: string,
    keyword: string,
    location: string,
    radius: number
  ): Promise<SessionState> {
    const adminDb = await getAdminDb();
    const ref = adminDb.collection("searchSessions").doc(queryKey(userId, keyword, location, radius));
    const snap = await ref.get();
    const seen = snap.exists ? snap.data()?.seenPlaceIds ?? [] : [];
    return { ref, seenPlaceIds: new Set<string>(seen) };
  }

  /**
   * Atomically: re-read the authoritative seen-set, charge ONLY for leads that
   * are still new at commit time, deduct tokens, and record the delivered
   * place_ids + idempotency key - all in one transaction. Returns what was
   * actually charged. Never lets the balance go negative.
   */
  static async settle(params: {
    userId: string;
    ref: DocumentReference;
    keyword: string;
    location: string;
    radius: number;
    scraped: Business[];
    attemptedPlaceIds: string[];
    hasMoreUnseen: boolean;
    idempotencyKey?: string;
  }): Promise<SettleResult> {
    const adminDb = await getAdminDb();
    const tokenRef = adminDb.collection("tokens").doc(params.userId);

    return adminDb.runTransaction(async (tx) => {
      const [sessionSnap, tokenSnap] = await Promise.all([
        tx.get(params.ref),
        tx.get(tokenRef),
      ]);

      const sessionData = sessionSnap.exists ? sessionSnap.data() ?? {} : {};
      const seen = new Set<string>(sessionData.seenPlaceIds ?? []);

      const balance = tokenSnap.exists
        ? tokenSnap.data()?.balance ?? 0
        : PRICING_CONFIG.INITIAL_TOKENS;

      // Idempotent retry: this exact request was already settled.
      if (params.idempotencyKey && sessionData.lastIdempotencyKey === params.idempotencyKey) {
        return {
          charged: [],
          tokensCharged: 0,
          remaining: balance,
          areaExhausted: sessionData.areaExhausted ?? false,
          duplicate: true,
        };
      }

      // Charge only for leads still unseen at commit time (concurrency-safe).
      const chargeable = params.scraped.filter((b) => !seen.has(b.place_id));
      const cost = chargeForResults(chargeable.length);

      if (cost > balance) {
        const err = new Error(`INSUFFICIENT_TOKENS: have ${balance}, need ${cost}`);
        err.name = "InsufficientTokens";
        throw err;
      }

      // Mark every attempted place_id as seen so failed Detail lookups are not
      // retried forever (which would keep an area from ever reporting exhausted).
      for (const id of params.attemptedPlaceIds) seen.add(id);
      for (const b of chargeable) seen.add(b.place_id);

      const remaining = balance - cost;
      const now = new Date();

      tx.set(
        tokenRef,
        {
          balance: remaining,
          initialGranted: true,
          lastUpdated: now,
          ...(tokenSnap.exists ? {} : { createdAt: now }),
        },
        { merge: true }
      );

      tx.set(
        params.ref,
        {
          userId: params.userId,
          keyword: params.keyword,
          location: params.location,
          radius: params.radius,
          seenPlaceIds: [...seen],
          areaExhausted: !params.hasMoreUnseen,
          lastIdempotencyKey: params.idempotencyKey ?? null,
          lastUpdated: now,
          ...(sessionSnap.exists ? {} : { createdAt: now }),
        },
        { merge: true }
      );

      return {
        charged: chargeable,
        tokensCharged: cost,
        remaining,
        areaExhausted: !params.hasMoreUnseen,
        duplicate: false,
      };
    });
  }
}
