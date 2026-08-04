// services/adminSearchStore.ts - server-side persistence of search results.
// Writing with the Admin SDK keeps userId/resultCount/results out of the
// client's control (clients can only read their own history).
import { Business } from "@/lib/types";

const getAdminDb = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin services must only run on the server side");
  }
  const { adminDb } = await import("../lib/firebase-admin");
  return adminDb;
};

export async function saveSearchResults(params: {
  userId: string;
  searchTerm: string;
  results: Business[];
}): Promise<string> {
  const adminDb = await getAdminDb();
  const ref = await adminDb.collection("searchQueries").add({
    userId: params.userId,
    searchTerm: params.searchTerm,
    timestamp: new Date(),
    resultCount: params.results.length,
    results: params.results,
  });
  return ref.id;
}
