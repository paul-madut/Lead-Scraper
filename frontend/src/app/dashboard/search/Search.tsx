// src/components/SearchForm.tsx
"use client";

import { useState } from 'react';
import { SearchResponse } from '@/lib/types';
import { saveSearchQuery } from '@/services/query';
import { useAuth } from '@/components/AuthProvider';

interface SearchFormProps {
  onSearchStart: () => void;
  onSearchComplete: (data: SearchResponse) => void;
  onSearchError: (error: string) => void;
}

export default function Search({ onSearchStart, onSearchComplete, onSearchError }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState('5000');
  const [maxResults, setMaxResults] = useState('20');
  const { user } = useAuth();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      onSearchError('Please enter a business type keyword');
      return;
    }
    
    if (!location.trim()) {
      onSearchError('Please enter a location');
      return;
    }
    
    onSearchStart();
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          location,
          radius: parseInt(radius),
          max_results: parseInt(maxResults),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search for businesses');
      }
      
      const data = await response.json();
      onSearchComplete(data);
      
      if (user) {
        try {
          await saveSearchQuery(user.uid, 
            keyword,
            data.businesses,
          );
          console.log('Search query saved successfully');
        } catch (saveError) {
          console.error('Error saving search query:', saveError);
        }
      }
    } catch (error) {
      onSearchError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="keyword">
            Business Type
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="keyword"
            type="text"
            placeholder="e.g., roofing, plumbing, restaurant"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
            Location
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="location"
            type="text"
            placeholder="e.g., Miami, FL"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="radius">
            Search Radius (meters)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="radius"
            type="number"
            min="1000"
            max="50000"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="maxResults">
            Maximum Results
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="maxResults"
            type="number"
            min="1"
            max="100"
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="submit"
        >
          Search Businesses
        </button>
      </div>
    </form>
  );
}