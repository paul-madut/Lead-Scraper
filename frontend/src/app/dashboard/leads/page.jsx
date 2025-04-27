"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getUserSearchHistory, getSearchResultsById } from "@/services/query";
import { format } from "date-fns";
import Link from "next/link";


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
    <main className="flex min-h-screen w-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Business Lead Generator</h1>

      <div className="w-full max-w-1/2">
        <h2 className="text-xl font-bold mb-4">Search History</h2>
        <ul>
          {history.map((query) => (
            <li key={query.id} className="mb-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <Link className="block " href={`/dashboard/leads/${query.id}`}>
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                  <span  className="text-lg font-medium text-blue-600 capitalize">{query.searchTerm}</span>
                  <span className="text-sm text-gray-500">{query.resultCount} results</span>
                </div>
                <div className="text-sm text-gray-400">
                  {format(new Date(query.timestamp), "yyyy-MM-dd")}
                </div>
              </div>
            </Link>
          </li>
          ))}
        </ul>

        {selectedQuery && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Query Results</h2>
            <p>Query: {selectedQuery.searchTerm}</p>
            <p>Results: {selectedQuery.resultCount}</p>
            {resultsLoading ? (
              <p>Loading results...</p>
            ) : (
              <ul>
                {queryResults.map((result) => (
                  <li key={result.id} className="mb-4">
                    <p>{result.name}</p>
                  </li>
                ))}
              </ul>
            )}

          </div>

        )}

      </div>
    </main>
  );
}

export default page;
