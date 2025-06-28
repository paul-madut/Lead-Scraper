"use client";

import { useState, useEffect } from 'react';
import { SearchResponse } from '@/lib/types';
import { saveSearchQuery } from '@/services/query';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { getTokenBalance } from '@/services/tokenService';

interface SearchFormProps {
  onSearchStart: () => void;
  onSearchComplete: (data: SearchResponse) => void;
  onSearchError: (error: string) => void;
}

// Pricing configuration (should match backend)
const PRICING_CONFIG = {
  BASE_SEARCH_COST: 1,
  COST_PER_RESULT: 1,
  MIN_CHARGE: 5,
  MAX_RESULTS_LIMIT: 100
};

export default function Search({ onSearchStart, onSearchComplete, onSearchError }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState('5');
  const [maxResults, setMaxResults] = useState('20');
  const [userTokens, setUserTokens] = useState<number | null>(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  // Calculate estimated cost whenever maxResults changes
  useEffect(() => {
    const requestedResults = parseInt(maxResults) || 20;
    const cost = Math.max(
      PRICING_CONFIG.BASE_SEARCH_COST + (requestedResults * PRICING_CONFIG.COST_PER_RESULT),
      PRICING_CONFIG.MIN_CHARGE
    );
    setEstimatedCost(cost);
  }, [maxResults]);

  // Fetch user's token balance
  useEffect(() => {
    async function fetchTokenBalance() {
      if (!user) {
        setUserTokens(null);
        return;
      }
      
      setIsLoadingTokens(true);
      try {
        const currentBalance = await getTokenBalance();
        setUserTokens(currentBalance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setUserTokens(null);
      } finally {
        setIsLoadingTokens(false);
      }
    }
    
    fetchTokenBalance();
  }, [user]);

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
    
    // Check if user is logged in
    if (!user) {
      onSearchError('Please log in to perform searches');
      return;
    }
    
    const requestedResults = parseInt(maxResults);
    
    // Note: Token validation is now handled server-side in the API
    
    setIsSearching(true);
    onSearchStart();
    
    try {
      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();
      
      // Perform the search with proper authentication
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          location: location.trim(),
          radius: parseInt(radius) * 1000, // Convert km to meters for API
          max_results: requestedResults,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          // Token insufficient error - update local state
          if (data.currentTokens !== undefined) {
            setUserTokens(data.currentTokens);
          }
        }
        throw new Error(data.error || 'Failed to search for businesses');
      }
      
      // Update local token state with server response
      if (data.meta?.remaining_tokens !== undefined) {
        setUserTokens(data.meta.remaining_tokens);
      }
      
      // Complete the search process
      onSearchComplete(data);
      
      // Save the search query
      try {
        await saveSearchQuery(user.uid, keyword, data.businesses);
        console.log('Search query saved successfully');
      } catch (saveError) {
        console.error('Error saving search query:', saveError);
        // Don't fail the whole process if saving fails
      }
      
      // Navigate to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Search error:', error);
      onSearchError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  // Calculate if user has enough tokens
  const hasEnoughTokens = userTokens !== null && userTokens >= estimatedCost;

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      {user && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <div className="token-display">
              <span className="text-gray-700 font-bold">Available Tokens:</span>
              {isLoadingTokens ? (
                <span className="ml-2 text-blue-500">Loading...</span>
              ) : (
                <span className={`ml-2 font-bold ${hasEnoughTokens ? 'text-blue-600' : 'text-red-600'}`}>
                  {userTokens !== null ? userTokens.toLocaleString() : 0}
                </span>
              )}
            </div>
            
            <div className="token-cost">
              <span className="text-gray-700">Estimated Cost:</span>
              <span className="ml-2 text-blue-600 font-bold">
                {estimatedCost} tokens
              </span>
            </div>
          </div>
          
          {/* Cost breakdown */}
          <div className="text-sm text-gray-600 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>Base cost: {PRICING_CONFIG.BASE_SEARCH_COST} token</div>
              <div>Per result: {PRICING_CONFIG.COST_PER_RESULT} token</div>
              <div>Min charge: {PRICING_CONFIG.MIN_CHARGE} tokens</div>
            </div>
            <div className="mt-1 text-xs">
              * You'll only be charged for actual results returned (minimum {PRICING_CONFIG.MIN_CHARGE} tokens)
            </div>
          </div>
        </div>
      )}
      
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
            disabled={isSearching}
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
            placeholder="e.g., Toronto, ON or Ontario or Canada"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isSearching}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="radius">
            Search Radius (kilometers)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="radius"
            type="number"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            disabled={isSearching}
          />
          <p className="text-xs text-gray-500 mt-1">
            For large areas like provinces/countries, use text search (larger radius or leave as default)
          </p>
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
            max={PRICING_CONFIG.MAX_RESULTS_LIMIT}
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
            disabled={isSearching}
          />
        </div>
      </div>
      
      {user && !hasEnoughTokens && userTokens !== null && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              Insufficient tokens. You have {userTokens} tokens but need at least {estimatedCost} tokens for this search.
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          type="submit"
          disabled={!user || isSearching}
        >
          {isSearching ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          ) : (
            'Search Businesses'
          )}
        </button>
      </div>
    </form>
  );
}