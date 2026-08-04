// services/adminTokenService.ts - server-side only token operations.
// The Admin SDK bypasses Firestore rules; nothing here may run in the browser.
import { PRICING_CONFIG } from "@/lib/pricing";

const getAdminDb = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin services must only run on the server side");
  }
  const { adminDb } = await import("../lib/firebase-admin");
  return adminDb;
};

export class AdminTokenService {
  /**
   * Read balance, granting the one-time initial allotment on first ever access.
   * The grant is idempotent: an `initialGranted` flag survives balance changes,
   * so deleting and re-creating the balance field cannot re-trigger free tokens.
   */
  static async getTokenBalance(userId: string): Promise<number> {
    const adminDb = await getAdminDb();
    const tokenRef = adminDb.collection("tokens").doc(userId);

    return adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(tokenRef);
      if (snap.exists) {
        const data = snap.data();
        // Backfill the flag for docs created before it existed.
        if (data?.initialGranted !== true) {
          transaction.update(tokenRef, { initialGranted: true });
        }
        return data?.balance ?? 0;
      }
      transaction.set(tokenRef, {
        balance: PRICING_CONFIG.INITIAL_TOKENS,
        initialGranted: true,
        createdAt: new Date(),
        lastUpdated: new Date(),
      });
      return PRICING_CONFIG.INITIAL_TOKENS;
    });
  }

  /**
   * Atomically deduct `amount` tokens, refusing to go negative.
   * Throws INSUFFICIENT_TOKENS if the balance cannot cover the charge.
   */
  static async deductTokens(userId: string, amount: number): Promise<number> {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error("Deduction amount must be a non-negative integer");
    }
    if (amount === 0) return this.getTokenBalance(userId);

    const adminDb = await getAdminDb();
    const tokenRef = adminDb.collection("tokens").doc(userId);

    return adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(tokenRef);
      const current = snap.exists
        ? snap.data()?.balance ?? 0
        : PRICING_CONFIG.INITIAL_TOKENS;

      if (current < amount) {
        const err = new Error(
          `INSUFFICIENT_TOKENS: have ${current}, need ${amount}`
        );
        err.name = "InsufficientTokens";
        throw err;
      }

      const next = current - amount;
      if (snap.exists) {
        transaction.update(tokenRef, { balance: next, lastUpdated: new Date() });
      } else {
        transaction.set(tokenRef, {
          balance: next,
          initialGranted: true,
          createdAt: new Date(),
          lastUpdated: new Date(),
        });
      }
      return next;
    });
  }

  /**
   * Credit tokens back (refund of an over-reservation). Never used to grant
   * free tokens - callers pass only amounts they previously deducted.
   */
  static async refundTokens(userId: string, amount: number): Promise<number> {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error("Refund amount must be a non-negative integer");
    }
    if (amount === 0) return this.getTokenBalance(userId);

    const adminDb = await getAdminDb();
    const tokenRef = adminDb.collection("tokens").doc(userId);

    return adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(tokenRef);
      const current = snap.exists
        ? snap.data()?.balance ?? 0
        : PRICING_CONFIG.INITIAL_TOKENS;
      const next = current + amount;
      if (snap.exists) {
        transaction.update(tokenRef, { balance: next, lastUpdated: new Date() });
      } else {
        transaction.set(tokenRef, {
          balance: next,
          initialGranted: true,
          createdAt: new Date(),
          lastUpdated: new Date(),
        });
      }
      return next;
    });
  }
}
