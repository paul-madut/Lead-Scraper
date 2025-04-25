"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getUserSearchHistory, getSearchResultsById } from "@/services/query";
import { format } from "date-fns";

function page() {
  const { user } = useAuth();
  const [history, setHistory] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuery, setSelectedQuery] = useState();
  const [queryResults, setQueryResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    async function fetchSearchHistory() {
      if (!user) return;
      
      try {
        setLoading(true);
        const userHistory = await getUserSearchHistory(user.uid);
        setHistory(userHistory);
      } catch (err) {
        setError("Failed to load search history");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSearchHistory();
  }, [user]);

  const viewQueryResults = async (queryId) => {
    try {
      setResultsLoading(true);
      setSelectedQuery(queryId);
      
      const queryData = await getSearchResultsById(queryId);
      setQueryResults(queryData.results);
    } catch (err) {
      console.error("Failed to load query results:", err);
    } finally {
      setResultsLoading(false);
    }
  };

  if (!user) {
    return <p>Please sign in to view your search history.</p>;
  }

  if (loading) {
    return <p>Loading history...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }


  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Business Lead Generator</h1>
    </main>
  );
}

export default page;
