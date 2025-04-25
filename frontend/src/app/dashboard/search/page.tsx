// src/app/page.tsx
"use client";

import { useState } from 'react';
import Search from './Search';
import ResultsTable from '@/components/ResultsTable';
import ExportButton from '@/components/ExportButton';
import { Business } from '@/lib/types';


export default function Home() {
  const [results, setResults] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
 

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Business Lead Generator</h1>
      
      <div className="w-full max-w-4xl">
        <Search 
          onSearchStart={() => {
            setIsLoading(true);
            setError(null);
          }}
          onSearchComplete={(data) => {
            setResults(data.businesses);
            setIsLoading(false);
          }}
          onSearchError={(err) => {
            setError(err);
            setIsLoading(false);
          }}
        />

        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Found {results.length} businesses</h2>
              <ExportButton data={results} />
            </div>
            <ResultsTable businesses={results} />
          </div>
        )}
      </div>
    </main>
  );
}