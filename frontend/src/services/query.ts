// services/queryService.ts
import { 
    collection, 
    addDoc, 
    getDocs, 
    query as firestoreQuery, 
    where, 
    orderBy, 
    Timestamp,
    doc,
    limit,
    getDoc, 
    DocumentData,
    QueryDocumentSnapshot
  } from 'firebase/firestore';
  import { db } from '@/firebase/config';
  import { Business, SearchQuery, SearchQueryDocument } from '@/lib/types';
  
  // Helper to convert Firestore document to SearchQuery
  const convertDoc = (doc: QueryDocumentSnapshot<DocumentData>): SearchQuery => {
    const data = doc.data() as SearchQueryDocument;
    return {
      id: doc.id,
      userId: data.userId,
      searchTerm: data.searchTerm,
      timestamp: data.timestamp.toDate(),
      resultCount: data.resultCount,
      results: data.results
    };
  };
  
  export async function saveSearchQuery(
    userId: string, 
    searchTerm: string, 
    results: Business[]
  ): Promise<string> {
    console.log(userId, searchTerm,results)
    try {
      const queryData: SearchQueryDocument = {
        userId,
        searchTerm,
        timestamp: Timestamp.now(),
        resultCount: results.length,
        results: results
      };
      
      const docRef = await addDoc(collection(db, "searchQueries"), queryData);
      return docRef.id;
    } catch (error) {
      console.error("Error saving search query:", error);
      throw error;
    }
  }
  
  export async function getUserSearchHistory(userId: string): Promise<SearchQuery[]> {
    console.log(userId + " history")
    try {
      const q = firestoreQuery(
        collection(db, "searchQueries"), 
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      console.log(querySnapshot.docs.map(convertDoc))
      return querySnapshot.docs.map(convertDoc);
    } catch (error) {
      console.error("Error fetching search history:", error);
      throw error;
    }
  }

  export async function getMostRecentUserSearch(userId: string): Promise<SearchQuery[]> {
    console.log(userId + " history");
    try {
      const q = firestoreQuery(
        collection(db, "searchQueries"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc"),
        limit(1) // Add this to get only the most recent entry
      );
      const querySnapshot = await getDocs(q);
      console.log(querySnapshot.docs.map(convertDoc));
      return querySnapshot.docs.map(convertDoc);
    } catch (error) {
      console.error("Error fetching search history:", error);
      throw error;
    }
  }
  export async function getSearchResultsById(queryId: string): Promise<SearchQuery> {
    try {
      const docRef = doc(db, "searchQueries", queryId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as SearchQueryDocument;
        return {
          id: docSnap.id,
          userId: data.userId,
          searchTerm: data.searchTerm,
          timestamp: data.timestamp.toDate(),
          resultCount: data.resultCount,
          results: data.results
        };
      } else {
        throw new Error("Search query not found");
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
      throw error;
    }
  }