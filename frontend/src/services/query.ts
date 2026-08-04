// services/query.ts - CLIENT-side read helpers for a user's own search history.
// Writes happen server-side (see adminSearchStore). Firestore rules restrict
// reads to documents the caller owns.
import {
  collection,
  getDocs,
  query as firestoreQuery,
  where,
  orderBy,
  doc,
  limit,
  getDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/firebase/config";
import { SearchQuery, SearchQueryDocument } from "@/lib/types";

const convertDoc = (
  snapshot: QueryDocumentSnapshot<DocumentData>
): SearchQuery => {
  const data = snapshot.data() as Partial<SearchQueryDocument>;
  const results = Array.isArray(data.results) ? data.results : [];
  return {
    id: snapshot.id,
    userId: data.userId ?? "",
    searchTerm: data.searchTerm ?? "",
    timestamp: data.timestamp?.toDate?.() ?? new Date(0),
    resultCount: data.resultCount ?? results.length,
    results,
  };
};

export async function getUserSearchHistory(userId: string): Promise<SearchQuery[]> {
  const q = firestoreQuery(
    collection(db, "searchQueries"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertDoc);
}

export async function getMostRecentUserSearch(userId: string): Promise<SearchQuery[]> {
  const q = firestoreQuery(
    collection(db, "searchQueries"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(convertDoc);
}

export async function getSearchResultsById(queryId: string): Promise<SearchQuery> {
  const snapshot = await getDoc(doc(db, "searchQueries", queryId));
  if (!snapshot.exists()) {
    throw new Error("Search query not found");
  }
  const data = snapshot.data() as SearchQueryDocument;

  // Defence in depth on top of Firestore rules.
  if (data.userId !== auth.currentUser?.uid) {
    throw new Error("You do not have access to this search");
  }

  const results = Array.isArray(data.results) ? data.results : [];
  return {
    id: snapshot.id,
    userId: data.userId,
    searchTerm: data.searchTerm,
    timestamp: data.timestamp?.toDate?.() ?? new Date(0),
    resultCount: data.resultCount ?? results.length,
    results,
  };
}
