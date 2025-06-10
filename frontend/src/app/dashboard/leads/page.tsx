"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getUserSearchHistory } from "@/services/query";
import { format } from "date-fns";
import Link from "next/link";
import { DataTable } from "./Table";

interface SearchQuery {
  id: string;
  searchTerm: string;
  timestamp: Date;
  resultCount: number;
  results: any[];
}

function LeadsPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<SearchQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<SearchQuery | null>(null);
  const [showTable, setShowTable] = useState(false);

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

  const viewQueryResults = (query: SearchQuery) => {
    setSelectedQuery(query);
    setShowTable(true);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your search history and leads.</p>
          <Link href="/auth" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If showing table view
  if (showTable && selectedQuery) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        {/* Header with back button */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => setShowTable(false)}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search History
              </button>
              <h1 className="text-3xl font-bold text-gray-900 capitalize">
                {selectedQuery.searchTerm} Results
              </h1>
              <p className="text-gray-600">
                {format(new Date(selectedQuery.timestamp), "MMMM dd, yyyy 'at' h:mm a")} • {selectedQuery.resultCount} results
              </p>
            </div>
            <Link 
              href={`/dashboard/leads/${selectedQuery.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Detailed View
            </Link>
          </div>
        </div>

        {/* Data Table */}
        <DataTable data={selectedQuery.results} />
      </div>
    );
  }

  // Main search history view
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Your Lead Searches</h1>
          <Link 
            href="/dashboard/search" 
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            New Search
          </Link>
        </div>
        <p className="text-gray-600">
          View and manage all your business lead searches in one place.
        </p>
      </div>

      {/* Search History */}
      {history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No searches yet</h3>
          <p className="text-gray-600 mb-6">Start by creating your first business lead search.</p>
          <Link 
            href="/dashboard/search" 
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Search
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((query) => {
            const businessesWithoutWebsite = query.results?.filter((business: any) => !business.website).length || 0;
            const conversionRate = query.resultCount > 0 ? Math.round((businessesWithoutWebsite / query.resultCount) * 100) : 0;
            
            return (
              <div 
                key={query.id} 
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 capitalize">
                        {query.searchTerm}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(query.timestamp), "MMMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{query.resultCount}</div>
                      <div className="text-sm text-gray-500">total results</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-lg font-semibold text-green-600">{businessesWithoutWebsite}</div>
                      <div className="text-sm text-gray-600">Without Website</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-lg font-semibold text-purple-600">{conversionRate}%</div>
                      <div className="text-sm text-gray-600">Potential Leads</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-lg font-semibold text-blue-600">
                        {query.results?.filter((b: any) => b.phone).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">With Phone</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => viewQueryResults(query)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        View Table
                      </button>
                      <Link 
                        href={`/dashboard/leads/${query.id}`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Detailed View
                      </Link>
                    </div>
                    <div className="text-sm text-gray-500">
                      Click to explore results
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {history.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{history.length}</div>
              <div className="text-sm text-gray-600">Total Searches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {history.reduce((sum, query) => sum + query.resultCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Results</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {history.reduce((sum, query) => 
                  sum + (query.results?.filter((business: any) => !business.website).length || 0), 0
                )}
              </div>
              <div className="text-sm text-gray-600">Potential Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  (history.reduce((sum, query) => 
                    sum + (query.results?.filter((business: any) => !business.website).length || 0), 0
                  ) / history.reduce((sum, query) => sum + query.resultCount, 0)) * 100
                )}%
              </div>
              <div className="text-sm text-gray-600">Avg. Lead Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadsPage;