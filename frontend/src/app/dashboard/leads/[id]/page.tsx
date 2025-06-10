// app/dashboard/leads/[id]/page.tsx
"use client";
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function LeadDetails() {
  const path = usePathname();
  const id = path.split("/").pop();
  const [query, setQuery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'no-website'>('all');

  useEffect(() => {
    async function getQuery() {
      if (!id) return;
      console.log(id);
      console.log("Fetching query data...");
      
      try {
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lead Details Not Found</h1>
          <p className="text-gray-600 mb-6">The lead details you're looking for could not be found.</p>
          <Link href="/dashboard/leads" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            Back to Leads
          </Link>
        </div>
      </div>
    );
  }

  const allBusinesses = query.results || [];
  const businessesWithoutWebsite = allBusinesses.filter((business: any) => !business.website);
  const displayBusinesses = filter === 'no-website' ? businessesWithoutWebsite : allBusinesses;

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        {/* Back Button */}
        <Link 
          href="/dashboard/leads" 
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Searches
        </Link>

        {/* Title Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 capitalize mb-2">
                {query.searchTerm || 'Search Results'}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center lg:space-x-6 gap-2 lg:gap-0 text-sm text-gray-600">
                <span className="flex items-center">
                  📅 {new Date(query.timestamp?.toDate?.() || query.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span>📊 {allBusinesses.length} total results</span>
                <span>🎯 {businessesWithoutWebsite.length} potential leads</span>
                <span>📞 {allBusinesses.filter((b: any) => b.phone).length} with phone</span>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="text-xl lg:text-2xl font-bold text-blue-600">{allBusinesses.length}</div>
              <div className="text-sm text-gray-500">businesses found</div>
            </div>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilter('no-website')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'no-website' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-red-50 shadow-sm border border-gray-200'
              }`}
            >
              Without website ({businessesWithoutWebsite.length})
            </button>
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 shadow-sm border border-gray-200'
              }`}
            >
              Show all ({allBusinesses.length})
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Showing {displayBusinesses.length} of {allBusinesses.length} businesses
          </div>
        </div>
      </div>

      {/* Results Table - Responsive and Scrollable */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {displayBusinesses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No businesses match the current filter.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="md:hidden">
              <div className="max-h-96 overflow-y-auto">
                {displayBusinesses.map((business: any, index: number) => (
                  <div key={business.place_id || index} className="p-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {business.photo_reference ? (
                          <img
                            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${business.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                            alt={business.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-medium">
                              {business.name?.charAt(0)?.toUpperCase() || 'B'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{business.name}</h3>
                        {business.rating && (
                          <p className="text-xs text-gray-500 mb-1">⭐ {business.rating} • {business.total_reviews || 0} reviews</p>
                        )}
                        <p className="text-xs text-gray-600 mb-2">{business.address}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {business.website ? (
                              <a 
                                href={business.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                🌐 Website
                              </a>
                            ) : (
                              <span className="text-red-500 text-xs">❌ No website</span>
                            )}
                            {business.phone && (
                              <a 
                                href={`tel:${business.phone}`}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                📞 Call
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="max-h-80 lg:max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Reviews
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        Website
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayBusinesses.map((business: any, index: number) => (
                      <tr key={business.place_id || index} className="hover:bg-gray-50">
                        {/* Business Name with Image */}
                        <td className="px-3 py-2">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-7 w-7 mr-2">
                              {business.photo_reference ? (
                                <img
                                  src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${business.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                                  alt={business.name}
                                  className="h-7 w-7 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs font-medium">
                                    {business.name?.charAt(0)?.toUpperCase() || 'B'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate" title={business.name}>
                                {business.name}
                              </div>
                              {business.rating && (
                                <div className="text-xs text-gray-500">
                                  ⭐ {business.rating}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Reviews */}
                        <td className="px-3 py-2 text-center text-xs text-gray-900">
                          {business.total_reviews || '0'}
                        </td>

                        {/* Address */}
                        <td className="px-3 py-2 text-xs text-gray-900">
                          <div className="truncate max-w-xs" title={business.address}>
                            {business.address}
                          </div>
                        </td>

                        {/* Website Status */}
                        <td className="px-3 py-2 text-center">
                          {business.website ? (
                            <a 
                              href={business.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
                              title={business.website}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={1.5} 
                                stroke="currentColor" 
                                className="w-4 h-4"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" 
                                />
                              </svg>
                            </a>
                          ) : (
                            <span className="inline-flex items-center justify-center text-red-500" title="No website available">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={1.5} 
                                stroke="currentColor" 
                                className="w-4 h-4"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M6 18L18 6M6 6l12 12" 
                                />
                              </svg>
                            </span>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="px-3 py-2 text-xs text-gray-900">
                          {business.phone ? (
                            <a 
                              href={`tel:${business.phone}`}
                              className="text-blue-600 hover:text-blue-800 transition-colors block truncate"
                              title={business.phone}
                            >
                              {business.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">No phone</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg lg:text-xl font-bold text-blue-600">{allBusinesses.length}</div>
          <div className="text-xs lg:text-sm text-gray-600">Total Businesses</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg lg:text-xl font-bold text-red-500">{businessesWithoutWebsite.length}</div>
          <div className="text-xs lg:text-sm text-gray-600">Without Website</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg lg:text-xl font-bold text-green-600">
            {allBusinesses.filter((b: any) => b.phone).length}
          </div>
          <div className="text-xs lg:text-sm text-gray-600">With Phone</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-lg lg:text-xl font-bold text-purple-600">
            {allBusinesses.length > 0 ? Math.round((businessesWithoutWebsite.length / allBusinesses.length) * 100) : 0}%
          </div>
          <div className="text-xs lg:text-sm text-gray-600">Potential Leads</div>
        </div>
      </div>
    </div>
  );
}