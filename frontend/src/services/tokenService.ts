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
  const response = await fetch("/api/tokens/balance", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await response.json()) as TokenBalanceResponse;
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to get token balance");
  }
  return data.balance;
}
