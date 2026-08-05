// services/tokenService.ts - client helper for reading the token balance.
import { auth } from "@/firebase/config";
import type { TokenBalanceResponse } from "@/lib/types";

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.getIdToken();
}

export async function getTokenBalance(): Promise<number> {
  const token = await getAuthToken();
  // no-store: the balance is per-user and changes on every search, so it must
  // never be served from the browser's HTTP cache (that showed a stale balance
  // from a previous session before the fresh value loaded).
  const response = await fetch("/api/tokens/balance", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = (await response.json()) as TokenBalanceResponse;
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to get token balance");
  }
  return data.balance;
}
