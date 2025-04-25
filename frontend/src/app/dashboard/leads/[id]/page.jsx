// pages/blog/[id].js
"use client";
import {usePathname} from 'next/navigation';
import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function BlogPost() {

  const path = usePathname();
  const  id  = path.split("/").pop(); // This will be MxKFEZnyAytOL3SVTWrS from the URL
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getQuery() {
      if (!id) return; // Wait until we have the ID from the router
      console.log(id)
      console.log("attempt")
      
      try {
        // Here you use the document ID to fetch the specific document
        const docRef = doc(db, "searchQueries", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setQuery({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
          
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    }
    
    getQuery();
  }, [id, path]);


  if (!query) return <div>Post not found {id}</div>;

  return (
    <div>
      <h1>{query.searchTerm}</h1>
      <p>Results: {query.resultCount}</p>
      {/* Display other fields from your document */}
    </div>
  );
}